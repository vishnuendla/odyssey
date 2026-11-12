package com.odyssey.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.odyssey.repository.UserRepository;
import com.odyssey.service.MailService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Covers the Phase 3 social features: follows, notifications, threaded comments
 * and report-driven moderation.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class Phase3SocialIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private MailService mailService;

    @Test
    void followUpdatesCountsAndCreatesNotification() throws Exception {
        String authorEmail = "follow-author@example.com";
        MvcResult author = register(authorEmail);
        markVerified(authorEmail);
        String authorId = userId(authorEmail);
        Cookie authorAccess = cookie(author, "odyssey-token");

        String followerEmail = "follow-follower@example.com";
        MvcResult follower = register(followerEmail);
        markVerified(followerEmail);
        Cookie followerAccess = cookie(follower, "odyssey-token");

        Csrf csrf = csrf();
        mockMvc.perform(post("/api/users/" + authorId + "/follow")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .cookie(followerAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.following").value(true))
                .andExpect(jsonPath("$.followersCount").value(1));

        mockMvc.perform(get("/api/users/" + authorId + "/followers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(userId(followerEmail)));

        mockMvc.perform(get("/api/auth/users/" + authorId).cookie(followerAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.following").value(true))
                .andExpect(jsonPath("$.followersCount").value(1))
                .andExpect(jsonPath("$.followingCount").value(0));

        mockMvc.perform(get("/api/notifications").cookie(authorAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("FOLLOW"))
                .andExpect(jsonPath("$[0].read").value(false));

        mockMvc.perform(get("/api/notifications/unread-count").cookie(authorAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1));

        // Self-follow is rejected.
        Csrf csrfSelf = csrf();
        mockMvc.perform(post("/api/users/" + authorId + "/follow")
                        .cookie(csrfSelf.cookie())
                        .header("X-XSRF-TOKEN", csrfSelf.token())
                        .cookie(authorAccess))
                .andExpect(status().isBadRequest());

        // Unfollowing is idempotent and clears the count.
        Csrf csrfUnfollow = csrf();
        mockMvc.perform(delete("/api/users/" + authorId + "/follow")
                        .cookie(csrfUnfollow.cookie())
                        .header("X-XSRF-TOKEN", csrfUnfollow.token())
                        .cookie(followerAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.following").value(false))
                .andExpect(jsonPath("$.followersCount").value(0));

        // Notifications can be marked as read.
        String notificationId = firstNotificationId(authorAccess);
        Csrf csrfRead = csrf();
        mockMvc.perform(post("/api/notifications/" + notificationId + "/read")
                        .cookie(csrfRead.cookie())
                        .header("X-XSRF-TOKEN", csrfRead.token())
                        .cookie(authorAccess))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/notifications/unread-count").cookie(authorAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
    }

    @Test
    void threadedCommentsNotifyAuthorAndParent() throws Exception {
        String authorEmail = "thread-author@example.com";
        MvcResult author = register(authorEmail);
        markVerified(authorEmail);
        Cookie authorAccess = cookie(author, "odyssey-token");
        String journalId = createPublicJournal(author, "Oslo in Winter", "Ferries and frozen harbours.");

        String readerEmail = "thread-reader@example.com";
        MvcResult reader = register(readerEmail);
        markVerified(readerEmail);
        Cookie readerAccess = cookie(reader, "odyssey-token");

        String parentCommentId = createComment(journalId, readerAccess, "What a beautiful trip.", null);

        mockMvc.perform(get("/api/notifications").cookie(authorAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("COMMENT"))
                .andExpect(jsonPath("$[0].journalId").value(journalId));

        String secondEmail = "thread-second@example.com";
        MvcResult second = register(secondEmail);
        markVerified(secondEmail);
        Cookie secondAccess = cookie(second, "odyssey-token");

        String replyId = createComment(journalId, secondAccess, "Agreed, the fjords are unreal.", parentCommentId);

        // The parent commenter gets a REPLY and the journal author gets a COMMENT.
        mockMvc.perform(get("/api/notifications").cookie(readerAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("REPLY"))
                .andExpect(jsonPath("$[0].commentId").value(replyId));

        JsonNode journal = getJournal(journalId);
        assertThat(journal.get("comments")).hasSize(2);
        assertThat(journal.get("comments").get(1).get("parentId").asText()).isEqualTo(parentCommentId);

        // Only one level of replies is allowed.
        Csrf csrfNested = csrf();
        mockMvc.perform(post("/api/journals/" + journalId + "/comments")
                        .cookie(csrfNested.cookie())
                        .header("X-XSRF-TOKEN", csrfNested.token())
                        .cookie(secondAccess)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "content", "Nested reply",
                                "parentId", replyId))))
                .andExpect(status().isBadRequest());

        // The journal owner can moderate a comment thread.
        Csrf csrfDelete = csrf();
        mockMvc.perform(delete("/api/journals/" + journalId + "/comments/" + parentCommentId)
                        .cookie(csrfDelete.cookie())
                        .header("X-XSRF-TOKEN", csrfDelete.token())
                        .cookie(authorAccess))
                .andExpect(status().isOk());

        assertThat(getJournal(journalId).get("comments")).isEmpty();
    }

    @Test
    void reportsRequireAdminToResolveAndHideContent() throws Exception {
        String authorEmail = "report-author@example.com";
        MvcResult author = register(authorEmail);
        markVerified(authorEmail);
        Cookie authorAccess = cookie(author, "odyssey-token");
        String journalId = createPublicJournal(author, "Crowded Beaches", "Too many umbrellas.");

        String reporterEmail = "report-reporter@example.com";
        MvcResult reporter = register(reporterEmail);
        markVerified(reporterEmail);
        Cookie reporterAccess = cookie(reporter, "odyssey-token");

        Csrf csrf = csrf();
        mockMvc.perform(post("/api/reports")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .cookie(reporterAccess)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetType", "JOURNAL",
                                "targetId", journalId,
                                "reason", "SPAM",
                                "details", "Looks like an advert."))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.targetPreview").value("Crowded Beaches"));

        // Duplicate open reports from the same reporter are rejected.
        Csrf csrfDuplicate = csrf();
        mockMvc.perform(post("/api/reports")
                        .cookie(csrfDuplicate.cookie())
                        .header("X-XSRF-TOKEN", csrfDuplicate.token())
                        .cookie(reporterAccess)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "targetType", "JOURNAL",
                                "targetId", journalId,
                                "reason", "SPAM"))))
                .andExpect(status().isConflict());

        // Regular users cannot see the moderation queue.
        mockMvc.perform(get("/api/admin/reports").cookie(reporterAccess))
                .andExpect(status().isForbidden());

        promoteToAdmin(reporterEmail);
        Cookie adminAccess = cookie(login(reporterEmail), "odyssey-token");

        String reportId = firstReportId(adminAccess);

        mockMvc.perform(get("/api/admin/stats").cookie(adminAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openReports").value(1));

        Csrf csrfResolve = csrf();
        mockMvc.perform(patch("/api/admin/reports/" + reportId)
                        .cookie(csrfResolve.cookie())
                        .header("X-XSRF-TOKEN", csrfResolve.token())
                        .cookie(adminAccess)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "action", "HIDE",
                                "note", "Confirmed advert."))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVED"));

        // Hidden content disappears from the public feed but stays visible to its owner.
        mockMvc.perform(get("/api/journals/search").param("q", "crowded"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0]").doesNotExist());

        mockMvc.perform(get("/api/journals/" + journalId))
                .andExpect(status().isNotFound());

        mockMvc.perform(get("/api/journals/" + journalId).cookie(authorAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hidden").value(true));

        // Hiding content tells the author why it disappeared.
        mockMvc.perform(get("/api/notifications").cookie(authorAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("MODERATION"));

        // The author can still edit hidden content, but editing does not silently
        // undo a moderation decision.
        Csrf csrfEdit = csrf();
        mockMvc.perform(put("/api/journals/" + journalId)
                        .cookie(csrfEdit.cookie())
                        .header("X-XSRF-TOKEN", csrfEdit.token())
                        .cookie(authorAccess)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", "Crowded Beaches",
                                "content", "An updated, honest review.",
                                "isPublic", true))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/journals/" + journalId).cookie(authorAccess))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hidden").value(true));
    }

    private String createComment(String journalId, Cookie access, String content, String parentId) throws Exception {
        Map<String, Object> payload = parentId == null
                ? Map.of("content", content)
                : Map.of("content", content, "parentId", parentId);

        Csrf csrf = csrf();
        MvcResult result = mockMvc.perform(post("/api/journals/" + journalId + "/comments")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .cookie(access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private String createPublicJournal(MvcResult session, String title, String content) throws Exception {
        Cookie access = cookie(session, "odyssey-token");
        Csrf csrf = csrf();
        MvcResult created = mockMvc.perform(post("/api/journals")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .cookie(access)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "title", title,
                                "content", content,
                                "isPublic", true,
                                "tags", List.of("Norway")))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(created.getResponse().getContentAsString()).get("id").asText();
    }

    private JsonNode getJournal(String journalId) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/journals/" + journalId))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private String firstNotificationId(Cookie access) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/notifications").cookie(access))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get(0).get("id").asText();
    }

    private String firstReportId(Cookie access) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/admin/reports").cookie(access))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("content").get(0).get("id").asText();
    }

    private void promoteToAdmin(String email) {
        var user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        user.setRole("ADMIN");
        userRepository.save(user);
    }

    private MvcResult login(String email) throws Exception {
        Csrf csrf = csrf();
        return mockMvc.perform(post("/api/auth/login")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "Str0ng!Pass"))))
                .andExpect(status().isOk())
                .andReturn();
    }

    private MvcResult register(String email) throws Exception {
        Csrf csrf = csrf();
        return mockMvc.perform(post("/api/auth/register")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Test Traveler",
                                "email", email,
                                "password", "Str0ng!Pass",
                                "acceptTerms", true))))
                .andExpect(status().isOk())
                .andReturn();
    }

    private void markVerified(String email) {
        var user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        user.setEmailVerified(true);
        userRepository.save(user);
    }

    private String userId(String email) {
        return userRepository.findByEmailIgnoreCase(email).orElseThrow().getId();
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
