package com.odyssey.controller;

import com.odyssey.dto.*;
import com.odyssey.security.JwtTokenProvider;
import com.odyssey.service.AuthService;
import com.odyssey.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_COOKIE_PATH = "/api/auth";

    private final AuthService authService;
    private final JwtTokenProvider tokenProvider;
    private final RateLimitService rateLimitService;

    public AuthController(AuthService authService,
                          JwtTokenProvider tokenProvider,
                          RateLimitService rateLimitService) {
        this.authService = authService;
        this.tokenProvider = tokenProvider;
        this.rateLimitService = rateLimitService;
    }

    @GetMapping("/csrf")
    public ResponseEntity<Map<String, String>> csrf(CsrfToken csrfToken) {
        return ResponseEntity.ok(Map.of(
                "token", csrfToken.getToken(),
                "headerName", csrfToken.getHeaderName()
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request,
                                                        HttpServletRequest httpRequest,
                                                        HttpServletResponse response) {
        rateLimitService.check("register:" + clientIp(httpRequest), 5, 3600);
        AuthService.AuthSession session = authService.register(
                request, httpRequest.getHeader("User-Agent"), clientIp(httpRequest));
        writeSessionCookies(response, session);
        return ResponseEntity.ok(Map.of("user", session.user()));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request,
                                                     HttpServletRequest httpRequest,
                                                     HttpServletResponse response) {
        rateLimitService.check("login:" + clientIp(httpRequest), 10, 900);
        AuthService.AuthSession session = authService.login(
                request, httpRequest.getHeader("User-Agent"), clientIp(httpRequest));
        writeSessionCookies(response, session);
        return ResponseEntity.ok(Map.of("user", session.user()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refresh(HttpServletRequest httpRequest,
                                                       HttpServletResponse response) {
        String rawRefreshToken = tokenProvider.resolveRefreshToken(httpRequest);
        AuthService.AuthSession session;
        try {
            session = authService.refresh(rawRefreshToken,
                    httpRequest.getHeader("User-Agent"), clientIp(httpRequest));
        } catch (RuntimeException e) {
            clearAuthCookies(response);
            throw e;
        }
        writeSessionCookies(response, session);
        return ResponseEntity.ok(Map.of("user", session.user()));
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(authService.getCurrentUser(userDetails.getUsername()));
    }

    /**
     * Public author card. Returns no email or other private account data.
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<PublicUserDto> getUserById(@PathVariable String userId) {
        return ResponseEntity.ok(authService.getPublicUserById(userId));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateProfile(@AuthenticationPrincipal UserDetails userDetails,
                                                 @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(authService.updateProfile(userDetails.getUsername(), request));
    }

    @GetMapping("/sessions")
    public ResponseEntity<List<SessionDto>> listSessions(@AuthenticationPrincipal UserDetails userDetails,
                                                         HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.listSessions(userDetails.getUsername(),
                tokenProvider.resolveRefreshToken(httpRequest)));
    }

    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Void> revokeSession(@AuthenticationPrincipal UserDetails userDetails,
                                              @PathVariable String sessionId) {
        authService.revokeSession(userDetails.getUsername(), sessionId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(@AuthenticationPrincipal UserDetails userDetails,
                                                              @Valid @RequestBody ChangePasswordRequest request,
                                                              HttpServletRequest httpRequest,
                                                              HttpServletResponse response) {
        rateLimitService.check("change-password:" + clientIp(httpRequest), 5, 3600);
        AuthService.AuthSession session = authService.changePassword(userDetails.getUsername(), request,
                httpRequest.getHeader("User-Agent"), clientIp(httpRequest));
        writeSessionCookies(response, session);
        return ResponseEntity.ok(Map.of("user", session.user()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request,
                                                          HttpServletRequest httpRequest) {
        rateLimitService.check("forgot-password:" + clientIp(httpRequest), 5, 3600);
        rateLimitService.check("forgot-password-email:" + request.getEmail().trim().toLowerCase(), 3, 3600);
        authService.requestPasswordReset(request.getEmail());
        return ResponseEntity.ok(new MessageResponse(
                "If an account exists for that email, a password reset link is on its way."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request,
                                                         HttpServletRequest httpRequest) {
        rateLimitService.check("reset-password:" + clientIp(httpRequest), 10, 3600);
        authService.resetPassword(request, clientIp(httpRequest));
        return ResponseEntity.ok(new MessageResponse("Your password has been reset. You can sign in now."));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<MessageResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request,
                                                       HttpServletRequest httpRequest) {
        rateLimitService.check("verify-email:" + clientIp(httpRequest), 20, 3600);
        authService.verifyEmail(request.getToken(), clientIp(httpRequest));
        return ResponseEntity.ok(new MessageResponse("Your email address is verified."));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<MessageResponse> resendVerification(@AuthenticationPrincipal UserDetails userDetails,
                                                              HttpServletRequest httpRequest) {
        rateLimitService.check("resend-verification:" + clientIp(httpRequest), 5, 3600);
        authService.resendVerification(userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Verification email sent. Check your inbox."));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest httpRequest, HttpServletResponse response) {
        authService.logout(tokenProvider.resolveRefreshToken(httpRequest));
        clearAuthCookies(response);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout-all")
    public ResponseEntity<Void> logoutAll(@AuthenticationPrincipal UserDetails userDetails,
                                          HttpServletRequest httpRequest,
                                          HttpServletResponse response) {
        authService.logoutAll(userDetails.getUsername(), clientIp(httpRequest));
        clearAuthCookies(response);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/account")
    public ResponseEntity<MessageResponse> deleteAccount(@AuthenticationPrincipal UserDetails userDetails,
                                                         @Valid @RequestBody DeleteAccountRequest request,
                                                         HttpServletRequest httpRequest,
                                                         HttpServletResponse response) {
        rateLimitService.check("delete-account:" + clientIp(httpRequest), 3, 3600);
        authService.deleteAccount(userDetails.getUsername(), request, clientIp(httpRequest));
        clearAuthCookies(response);
        return ResponseEntity.ok(new MessageResponse("Your account has been deleted."));
    }

    private void writeSessionCookies(HttpServletResponse response, AuthService.AuthSession session) {
        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie(session.accessToken()).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie(session.refreshToken(),
                Duration.ofMillis(session.refreshExpiresMs())).toString());
    }

    private ResponseCookie accessCookie(String token) {
        return ResponseCookie.from(JwtTokenProvider.ACCESS_COOKIE, token)
                .httpOnly(true)
                .secure(tokenProvider.getJwtConfig().isSecureCookies())
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofMillis(tokenProvider.getAccessExpirationMs()))
                .build();
    }

    private ResponseCookie refreshCookie(String token, Duration maxAge) {
        return ResponseCookie.from(JwtTokenProvider.REFRESH_COOKIE, token)
                .httpOnly(true)
                .secure(tokenProvider.getJwtConfig().isSecureCookies())
                .sameSite("Lax")
                .path(REFRESH_COOKIE_PATH)
                .maxAge(maxAge)
                .build();
    }

    private void clearAuthCookies(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(JwtTokenProvider.ACCESS_COOKIE, "")
                .httpOnly(true)
                .secure(tokenProvider.getJwtConfig().isSecureCookies())
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build().toString());
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from(JwtTokenProvider.REFRESH_COOKIE, "")
                .httpOnly(true)
                .secure(tokenProvider.getJwtConfig().isSecureCookies())
                .sameSite("Lax")
                .path(REFRESH_COOKIE_PATH)
                .maxAge(0)
                .build().toString());
        // Clear the legacy cookie name used before the auth overhaul.
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("auth_token", "")
                .httpOnly(true)
                .path("/")
                .maxAge(0)
                .build().toString());
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
