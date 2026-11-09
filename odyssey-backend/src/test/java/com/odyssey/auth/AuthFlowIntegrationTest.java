package com.odyssey.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.odyssey.repository.RefreshTokenRepository;
import com.odyssey.repository.UserRepository;
import com.odyssey.service.MailService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @MockBean
    private MailService mailService;

    @Test
    void registerNormalizesEmailAndRequiresValidCsrfToken() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of(
                "name", "Ada Lovelace",
                "email", "Ada@Example.COM",
                "password", "Str0ng!Pass",
                "acceptTerms", true
        ));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());

        Csrf csrf = csrf();

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("ada@example.com"))
                .andExpect(jsonPath("$.user.emailVerified").value(false))
                .andExpect(jsonPath("$.token").doesNotExist())
                .andReturn();

        Cookie access = cookie(result, "odyssey-token");
        Cookie refresh = cookie(result, "odyssey-refresh");
        assertThat(access).isNotNull();
        assertThat(refresh).isNotNull();
        assertThat(access.isHttpOnly()).isTrue();
        assertThat(refresh.isHttpOnly()).isTrue();

        mockMvc.perform(get("/api/auth/me").cookie(access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("ada@example.com"));
    }

    @Test
    void validationErrorsUseStandardEnvelope() throws Exception {
        Csrf csrf = csrf();
        String body = objectMapper.writeValueAsString(Map.of(
                "name", "A",
                "email", "not-an-email",
                "password", "weak",
                "acceptTerms", false
        ));

        mockMvc.perform(post("/api/auth/register")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.errors.email").isNotEmpty())
                .andExpect(jsonPath("$.errors.password").isNotEmpty())
                .andExpect(jsonPath("$.errors.acceptTerms").isNotEmpty());
    }

    @Test
    void duplicateRegistrationIsRejected() throws Exception {
        register("grace@example.com");
        Csrf csrf = csrf();

        mockMvc.perform(post("/api/auth/register")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("grace@example.com")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("An account with this email already exists."));
    }

    @Test
    void refreshRotatesTokenAndDetectsReuse() throws Exception {
        Csrf csrf = csrf();
        MvcResult login = mockMvc.perform(post("/api/auth/register")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody("rotate@example.com")))
                .andExpect(status().isOk())
                .andReturn();

        Cookie originalRefresh = cookie(login, "odyssey-refresh");
        Csrf refreshCsrf = csrf();

        MvcResult refreshed = mockMvc.perform(post("/api/auth/refresh")
                        .cookie(refreshCsrf.cookie())
                        .header("X-XSRF-TOKEN", refreshCsrf.token())
                        .cookie(originalRefresh))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value("rotate@example.com"))
                .andReturn();

        Cookie rotatedRefresh = cookie(refreshed, "odyssey-refresh");
        assertThat(rotatedRefresh).isNotNull();
        assertThat(rotatedRefresh.getValue()).isNotEqualTo(originalRefresh.getValue());

        // Reusing the old refresh token is treated as theft and kills every session.
        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(refreshCsrf.cookie())
                        .header("X-XSRF-TOKEN", refreshCsrf.token())
                        .cookie(originalRefresh))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(refreshCsrf.cookie())
                        .header("X-XSRF-TOKEN", refreshCsrf.token())
                        .cookie(rotatedRefresh))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void forgotPasswordIsEnumerationSafe() throws Exception {
        Csrf csrf = csrf();

        mockMvc.perform(post("/api/auth/forgot-password")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", "nobody@example.com"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "If an account exists for that email, a password reset link is on its way."));

        verify(mailService, org.mockito.Mockito.never())
                .sendPasswordResetEmail(eq("nobody@example.com"), org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void verifyEmailUnlocksPublishing() throws Exception {
        MvcResult registered = register("writer@example.com");
        Cookie access = cookie(registered, "odyssey-token");

        ArgumentCaptor<String> tokenCaptor = ArgumentCaptor.forClass(String.class);
        verify(mailService).sendVerificationEmail(eq("writer@example.com"), tokenCaptor.capture());

        Csrf csrf = csrf();
        mockMvc.perform(post("/api/auth/verify-email")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("token", tokenCaptor.getValue()))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/auth/me").cookie(access))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.emailVerified").value(true));
    }

    @Test
    void unverifiedUserCannotPublishJournals() throws Exception {
        MvcResult registered = register("draft@example.com");
        Cookie access = cookie(registered, "odyssey-token");
        Csrf csrf = csrf();

        mockMvc.perform(post("/api/journals")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .cookie(access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Draft",
                                "content", "Not verified yet",
                                "isPublic", false))))
                .andExpect(status().isForbidden());
    }

    @Test
    void changePasswordInvalidatesOtherSessions() throws Exception {
        MvcResult registered = register("secure@example.com");
        Cookie access = cookie(registered, "odyssey-token");
        Cookie refresh = cookie(registered, "odyssey-refresh");
        Csrf csrf = csrf();

        mockMvc.perform(post("/api/auth/change-password")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .cookie(access)
                        .cookie(refresh)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", "Str0ng!Pass",
                                "newPassword", "Even5tr0nger!"))))
                .andExpect(status().isOk());

        // Change-password itself imposes a fresh CSRF pair on the test client.
        Csrf postChangeCsrf = csrf();

        // The pre-change access token and refresh token must no longer work.
        mockMvc.perform(get("/api/auth/me").cookie(access))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(postChangeCsrf.cookie())
                        .header("X-XSRF-TOKEN", postChangeCsrf.token())
                        .cookie(refresh))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteAccountRemovesUserAndData() throws Exception {
        MvcResult registered = register("delete-me@example.com");
        Cookie access = cookie(registered, "odyssey-token");
        Cookie refresh = cookie(registered, "odyssey-refresh");
        String userId = userRepository.findByEmailIgnoreCase("delete-me@example.com").orElseThrow().getId();
        Csrf csrf = csrf();

        mockMvc.perform(delete("/api/auth/account")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .cookie(access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "password", "Str0ng!Pass",
                                "confirmation", "NOPE"))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(delete("/api/auth/account")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .cookie(access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "password", "Str0ng!Pass",
                                "confirmation", "DELETE"))))
                .andExpect(status().isOk());

        assertThat(userRepository.findByEmailIgnoreCase("delete-me@example.com")).isEmpty();
        assertThat(refreshTokenRepository.findByUserIdOrderByIssuedAtDesc(userId)).isEmpty();
        mockMvc.perform(post("/api/auth/refresh")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .cookie(refresh))
                .andExpect(status().isUnauthorized());
    }

    private MvcResult register(String email) throws Exception {
        Csrf csrf = csrf();
        return mockMvc.perform(post("/api/auth/register")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody(email)))
                .andExpect(status().isOk())
                .andReturn();
    }

    private String registerBody(String email) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "name", "Test Traveler",
                "email", email,
                "password", "Str0ng!Pass",
                "acceptTerms", true
        ));
    }

    private Csrf csrf() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        Cookie cookie = result.getResponse().getCookie("XSRF-TOKEN");
        assertThat(cookie).isNotNull();
        return new Csrf(cookie, json.get("token").asText());
    }

    private Cookie cookie(MvcResult result, String name) {
        return java.util.Arrays.stream(result.getResponse().getCookies())
                .filter(cookie -> name.equals(cookie.getName()))
                .findFirst()
                .orElse(null);
    }

    private record Csrf(Cookie cookie, String token) {
    }
}
