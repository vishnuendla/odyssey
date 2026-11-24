package com.odyssey.service;

import com.odyssey.repository.RefreshTokenRepository;
import com.odyssey.repository.VerificationTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Keeps the refresh_token and verification_token tables from growing without
 * bound. Revoked refresh tokens are retained for a while because reuse
 * detection still needs to see them.
 */
@Service
public class TokenMaintenanceService {

    private static final Logger logger = LoggerFactory.getLogger(TokenMaintenanceService.class);
    private static final int REVOKED_RETENTION_DAYS = 30;

    private final RefreshTokenRepository refreshTokenRepository;
    private final VerificationTokenRepository verificationTokenRepository;

    public TokenMaintenanceService(RefreshTokenRepository refreshTokenRepository,
                                   VerificationTokenRepository verificationTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.verificationTokenRepository = verificationTokenRepository;
    }

    @Scheduled(cron = "${app.tokens.purge-cron:0 30 3 * * *}")
    @Transactional
    public void purgeExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        int refreshTokens = refreshTokenRepository.purgeExpiredAndRevoked(
                now, now.minusDays(REVOKED_RETENTION_DAYS));
        int verificationTokens = verificationTokenRepository.purgeExpired(now);

        if (refreshTokens > 0 || verificationTokens > 0) {
            logger.info("Purged {} refresh tokens and {} verification tokens",
                    refreshTokens, verificationTokens);
        }
    }
}
