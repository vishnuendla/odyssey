package com.odyssey.service;

import com.odyssey.dto.*;
import com.odyssey.entity.RefreshToken;
import com.odyssey.entity.User;
import com.odyssey.entity.VerificationToken;
import com.odyssey.exception.ConflictException;
import com.odyssey.exception.ForbiddenException;
import com.odyssey.exception.TooManyRequestsException;
import com.odyssey.exception.UnauthorizedException;
import com.odyssey.repository.CommentRepository;
import com.odyssey.repository.BookmarkRepository;
import com.odyssey.repository.FollowRepository;
import com.odyssey.repository.JournalRepository;
import com.odyssey.repository.NotificationRepository;
import com.odyssey.repository.ReactionRepository;
import com.odyssey.repository.ReportRepository;
import com.odyssey.repository.RefreshTokenRepository;
import com.odyssey.repository.UserRepository;
import com.odyssey.repository.VerificationTokenRepository;
import com.odyssey.security.JwtTokenProvider;
import com.odyssey.security.TokenHasher;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class AuthService {

    private static final Duration EMAIL_VERIFICATION_TTL = Duration.ofHours(24);
    private static final Duration PASSWORD_RESET_TTL = Duration.ofHours(1);
    private static final int RESEND_LIMIT_PER_HOUR = 3;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final JournalRepository journalRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final BookmarkRepository bookmarkRepository;
    private final FollowRepository followRepository;
    private final NotificationRepository notificationRepository;
    private final ReportRepository reportRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final MailService mailService;
    private final AuthAuditLogger auditLogger;
    private final StorageService storageService;
    private final FollowService followService;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       VerificationTokenRepository verificationTokenRepository,
                       JournalRepository journalRepository,
                       CommentRepository commentRepository,
                       ReactionRepository reactionRepository,
                       BookmarkRepository bookmarkRepository,
                       FollowRepository followRepository,
                       NotificationRepository notificationRepository,
                       ReportRepository reportRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider tokenProvider,
                       MailService mailService,
                       AuthAuditLogger auditLogger,
                       StorageService storageService,
                       FollowService followService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.journalRepository = journalRepository;
        this.commentRepository = commentRepository;
        this.reactionRepository = reactionRepository;
        this.bookmarkRepository = bookmarkRepository;
        this.followRepository = followRepository;
        this.notificationRepository = notificationRepository;
        this.reportRepository = reportRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.mailService = mailService;
        this.auditLogger = auditLogger;
        this.storageService = storageService;
        this.followService = followService;
    }

    public record AuthSession(UserDto user, String accessToken, String refreshToken, long refreshExpiresMs) {
    }

    @Transactional
    public AuthSession register(RegisterRequest request, String userAgent, String ipAddress) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with this email already exists.");
        }

        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmailVerified(false);
        user.setTermsAcceptedAt(LocalDateTime.now());
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        try {
            user = userRepository.save(user);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new ConflictException("An account with this email already exists.");
        }

        sendVerificationEmail(user);
        auditLogger.registered(email, ipAddress);
        return issueSession(user, false, userAgent, ipAddress);
    }

    @Transactional
    public AuthSession login(LoginRequest request, String userAgent, String ipAddress) {
        String email = normalizeEmail(request.getEmail());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (AuthenticationException e) {
            auditLogger.loginFailed(email, ipAddress);
            throw new UnauthorizedException("Invalid email or password.");
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password."));

        auditLogger.loginSucceeded(email, ipAddress);
        return issueSession(user, request.isRememberMe(), userAgent, ipAddress);
    }

    @Transactional(noRollbackFor = UnauthorizedException.class)
    public AuthSession refresh(String rawRefreshToken, String userAgent, String ipAddress) {
        if (!StringUtils.hasText(rawRefreshToken)) {
            throw new UnauthorizedException("Your session has expired. Please sign in again.");
        }

        String hash = TokenHasher.sha256(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new UnauthorizedException("Your session has expired. Please sign in again."));

        LocalDateTime now = LocalDateTime.now();
        if (stored.getRevokedAt() != null) {
            // Refresh-token reuse: assume theft and invalidate every session for this user.
            revokeAllSessions(stored.getUser());
            throw new UnauthorizedException("Your session is no longer valid. Please sign in again.");
        }
        if (stored.getExpiresAt().isBefore(now)) {
            stored.setRevokedAt(now);
            refreshTokenRepository.save(stored);
            throw new UnauthorizedException("Your session has expired. Please sign in again.");
        }

        User user = stored.getUser();
        AuthSession session = issueSession(user, stored.isRememberMe(), userAgent, ipAddress);

        stored.setRevokedAt(now);
        stored.setLastUsedAt(now);
        stored.setReplacedByHash(TokenHasher.sha256(session.refreshToken()));
        refreshTokenRepository.save(stored);

        return session;
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (!StringUtils.hasText(rawRefreshToken)) {
            return;
        }
        refreshTokenRepository.findByTokenHash(TokenHasher.sha256(rawRefreshToken))
                .ifPresent(token -> {
                    if (token.getRevokedAt() == null) {
                        token.setRevokedAt(LocalDateTime.now());
                        refreshTokenRepository.save(token);
                    }
                });
    }

    @Transactional
    public void logoutAll(String email, String ipAddress) {
        User user = requireUser(email);
        revokeAllSessions(user);
        auditLogger.sessionsRevoked(user.getEmail(), ipAddress);
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUser(String email) {
        return convertToDto(requireUser(email));
    }

    @Transactional(readOnly = true)
    public PublicUserDto getPublicUserById(String userId, String viewerEmail) {
        return followService.getProfile(userId, viewerEmail);
    }

    @Transactional(readOnly = true)
    public List<SessionDto> listSessions(String email, String currentRawRefreshToken) {
        User user = requireUser(email);
        String currentHash = StringUtils.hasText(currentRawRefreshToken)
                ? TokenHasher.sha256(currentRawRefreshToken)
                : null;
        LocalDateTime now = LocalDateTime.now();

        return refreshTokenRepository.findByUserIdOrderByIssuedAtDesc(user.getId()).stream()
                .filter(token -> token.getRevokedAt() == null && token.getExpiresAt().isAfter(now))
                .sorted(Comparator.comparing(RefreshToken::getIssuedAt).reversed())
                .map(token -> {
                    SessionDto dto = new SessionDto();
                    dto.setId(token.getId());
                    dto.setCreatedAt(token.getIssuedAt());
                    dto.setLastUsedAt(token.getLastUsedAt());
                    dto.setExpiresAt(token.getExpiresAt());
                    dto.setUserAgent(token.getUserAgent());
                    dto.setIpAddress(token.getIpAddress());
                    dto.setCurrent(currentHash != null && currentHash.equals(token.getTokenHash()));
                    return dto;
                })
                .toList();
    }

    @Transactional
    public void revokeSession(String email, String sessionId) {
        User user = requireUser(email);
        RefreshToken token = refreshTokenRepository.findById(sessionId)
                .orElseThrow(() -> new com.odyssey.exception.ResourceNotFoundException("Session not found"));
        if (!token.getUser().getId().equals(user.getId())) {
            throw new com.odyssey.exception.ResourceNotFoundException("Session not found");
        }
        if (token.getRevokedAt() == null) {
            token.setRevokedAt(LocalDateTime.now());
            refreshTokenRepository.save(token);
        }
    }

    @Transactional
    public AuthSession changePassword(String email, ChangePasswordRequest request,
                                      String userAgent, String ipAddress) {
        User user = requireUser(email);
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new UnauthorizedException("Your current password is incorrect.");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Choose a password you have not used before.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        refreshTokenRepository.revokeAllForUser(user.getId(), LocalDateTime.now());
        auditLogger.passwordChanged(user.getEmail(), ipAddress);

        // Keep the current device signed in with fresh credentials.
        return issueSession(user, false, userAgent, ipAddress);
    }

    @Transactional
    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmailIgnoreCase(normalizeEmail(email)).orElse(null);
        if (user == null) {
            // Enumeration-safe: behave exactly like a successful request.
            return;
        }
        String rawToken = createVerificationToken(user, VerificationToken.Purpose.PASSWORD_RESET, PASSWORD_RESET_TTL);
        mailService.sendPasswordResetEmail(user.getEmail(), rawToken);
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request, String ipAddress) {
        VerificationToken token = requireToken(request.getToken(), VerificationToken.Purpose.PASSWORD_RESET,
                "This password reset link is invalid or has expired.");

        User user = token.getUser();
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Choose a password you have not used before.");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);

        token.setConsumedAt(LocalDateTime.now());
        verificationTokenRepository.save(token);
        refreshTokenRepository.revokeAllForUser(user.getId(), LocalDateTime.now());

        auditLogger.passwordReset(user.getEmail(), ipAddress);
    }

    @Transactional
    public void verifyEmail(String rawToken, String ipAddress) {
        VerificationToken token = requireToken(rawToken, VerificationToken.Purpose.EMAIL_VERIFICATION,
                "This verification link is invalid or has expired.");
        User user = token.getUser();

        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);

        token.setConsumedAt(LocalDateTime.now());
        verificationTokenRepository.save(token);
        auditLogger.emailVerified(user.getEmail(), ipAddress);
    }

    @Transactional
    public void resendVerification(String email) {
        User user = requireUser(email);
        if (user.isEmailVerified()) {
            throw new IllegalArgumentException("Your email is already verified.");
        }
        long recent = verificationTokenRepository.countRecent(user.getId(),
                VerificationToken.Purpose.EMAIL_VERIFICATION, LocalDateTime.now().minusHours(1));
        if (recent >= RESEND_LIMIT_PER_HOUR) {
            throw new TooManyRequestsException("Too many verification emails. Please try again later.");
        }
        sendVerificationEmail(user);
    }

    @Transactional
    public UserDto updateProfile(String email, UpdateProfileRequest request) {
        User user = requireUser(email);
        if (request.getName() != null) {
            if (request.getName().trim().length() < 2) {
                throw new IllegalArgumentException("Name must be between 2 and 80 characters.");
            }
            user.setName(request.getName().trim());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(emptyToNull(request.getAvatar()));
        }
        if (request.getBio() != null) {
            user.setBio(emptyToNull(request.getBio()));
        }
        if (request.getLocation() != null) {
            user.setLocation(emptyToNull(request.getLocation()));
        }
        user.setUpdatedAt(LocalDateTime.now());
        return convertToDto(userRepository.save(user));
    }

    @Transactional
    public void deleteAccount(String email, DeleteAccountRequest request, String ipAddress) {
        User user = requireUser(email);
        if (!"DELETE".equalsIgnoreCase(request.getConfirmation().trim())) {
            throw new IllegalArgumentException("Please type DELETE to confirm account deletion.");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Your password is incorrect.");
        }

        // Remove rows that reference the user directly before deleting their journals.
        for (com.odyssey.entity.Comment comment : commentRepository.findByUserId(user.getId())) {
            commentRepository.deleteByParentId(comment.getId());
            notificationRepository.deleteByCommentId(comment.getId());
            reportRepository.deleteByTarget(com.odyssey.entity.Report.TargetType.COMMENT, comment.getId());
        }
        commentRepository.deleteByUserId(user.getId());
        reactionRepository.deleteByUserId(user.getId());
        bookmarkRepository.deleteByUserId(user.getId());
        followRepository.deleteByUserId(user.getId());
        notificationRepository.deleteByUserId(user.getId());
        reportRepository.deleteByReporterId(user.getId());
        refreshTokenRepository.deleteAllForUser(user.getId());
        verificationTokenRepository.deleteAllForUser(user.getId());

        List<com.odyssey.entity.Journal> journals = journalRepository.findByUser(user);
        List<String> imageUrls = journals.stream()
                .flatMap(journal -> journal.getImages().stream())
                .map(com.odyssey.entity.Image::getUrl)
                .toList();

        // Reports and notifications point at journals and comments by id, not by
        // foreign key, so deleting the rows alone would leave dangling entries.
        for (com.odyssey.entity.Journal journal : journals) {
            notificationRepository.deleteByJournalId(journal.getId());
            reportRepository.deleteByTarget(com.odyssey.entity.Report.TargetType.JOURNAL, journal.getId());
            for (com.odyssey.entity.Comment comment : journal.getComments()) {
                notificationRepository.deleteByCommentId(comment.getId());
                reportRepository.deleteByTarget(com.odyssey.entity.Report.TargetType.COMMENT, comment.getId());
            }
        }

        journalRepository.deleteAll(journals);
        user.getJournals().clear();
        userRepository.delete(user);

        storageService.deleteFilesAfterCommit(imageUrls);
        auditLogger.accountDeleted(email, ipAddress);
    }

    @Transactional
    public void requireVerifiedEmail(String email) {
        User user = requireUser(email);
        if (!user.isEmailVerified()) {
            throw new ForbiddenException("Please verify your email address before publishing or commenting. "
                    + "Check your inbox for the verification link.");
        }
    }

    private AuthSession issueSession(User user, boolean rememberMe, String userAgent, String ipAddress) {
        String accessToken = tokenProvider.createAccessToken(user);
        String rawRefreshToken = TokenHasher.randomToken();
        long refreshExpiresMs = tokenProvider.refreshExpirationMs(rememberMe);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setTokenHash(TokenHasher.sha256(rawRefreshToken));
        refreshToken.setRememberMe(rememberMe);
        refreshToken.setIssuedAt(LocalDateTime.now());
        refreshToken.setExpiresAt(LocalDateTime.now().plus(Duration.ofMillis(refreshExpiresMs)));
        refreshToken.setUserAgent(truncate(userAgent, 255));
        refreshToken.setIpAddress(truncate(ipAddress, 64));
        refreshTokenRepository.save(refreshToken);

        return new AuthSession(convertToDto(user), accessToken, rawRefreshToken, refreshExpiresMs);
    }

    private void sendVerificationEmail(User user) {
        String rawToken = createVerificationToken(user, VerificationToken.Purpose.EMAIL_VERIFICATION,
                EMAIL_VERIFICATION_TTL);
        mailService.sendVerificationEmail(user.getEmail(), rawToken);
    }

    private String createVerificationToken(User user, VerificationToken.Purpose purpose, Duration ttl) {
        verificationTokenRepository.deleteByUserAndPurpose(user.getId(), purpose);

        String rawToken = TokenHasher.randomToken();
        VerificationToken token = new VerificationToken();
        token.setUser(user);
        token.setTokenHash(TokenHasher.sha256(rawToken));
        token.setPurpose(purpose);
        token.setCreatedAt(LocalDateTime.now());
        token.setExpiresAt(LocalDateTime.now().plus(ttl));
        verificationTokenRepository.save(token);
        return rawToken;
    }

    private VerificationToken requireToken(String rawToken, VerificationToken.Purpose purpose, String errorMessage) {
        if (!StringUtils.hasText(rawToken)) {
            throw new IllegalArgumentException(errorMessage);
        }
        VerificationToken token = verificationTokenRepository.findByTokenHash(TokenHasher.sha256(rawToken))
                .orElseThrow(() -> new IllegalArgumentException(errorMessage));
        if (token.getPurpose() != purpose || !token.isUsable()) {
            throw new IllegalArgumentException(errorMessage);
        }
        return token;
    }

    private void revokeAllSessions(User user) {
        user.setTokenVersion(user.getTokenVersion() + 1);
        userRepository.save(user);
        refreshTokenRepository.revokeAllForUser(user.getId(), LocalDateTime.now());
    }

    private User requireUser(String email) {
        return userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    public UserDto convertToDto(User user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setAvatar(user.getAvatar());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setBio(user.getBio());
        dto.setLocation(user.getLocation());
        dto.setEmailVerified(user.isEmailVerified());
        dto.setRole(user.getRole());
        return dto;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String emptyToNull(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String truncate(String value, int maxLength) {
        if (value == null) {
            return null;
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }
}
