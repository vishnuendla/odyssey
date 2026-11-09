-- Phase 1 auth hardening: verified email state, session revocation, and
-- single-use verification/reset tokens.

ALTER TABLE users
    ADD COLUMN email_verified BIT(1) NOT NULL DEFAULT b'0',
    ADD COLUMN email_verified_at DATETIME(6) DEFAULT NULL,
    ADD COLUMN password_changed_at DATETIME(6) DEFAULT NULL,
    ADD COLUMN terms_accepted_at DATETIME(6) DEFAULT NULL,
    ADD COLUMN token_version INT NOT NULL DEFAULT 0,
    ADD COLUMN updated_at DATETIME(6) DEFAULT NULL;

-- Accounts that existed before email verification was introduced are grandfathered in.
UPDATE users
SET email_verified = b'1',
    email_verified_at = COALESCE(created_at, CURRENT_TIMESTAMP(6)),
    terms_accepted_at = COALESCE(created_at, CURRENT_TIMESTAMP(6)),
    updated_at = COALESCE(created_at, CURRENT_TIMESTAMP(6));

CREATE TABLE refresh_tokens (
    id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    remember_me BIT(1) NOT NULL DEFAULT b'0',
    issued_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    last_used_at DATETIME(6) DEFAULT NULL,
    revoked_at DATETIME(6) DEFAULT NULL,
    replaced_by_hash VARCHAR(64) DEFAULT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(64) DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_refresh_tokens_hash (token_hash),
    KEY idx_refresh_tokens_user (user_id),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE verification_tokens (
    id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    token_hash VARCHAR(64) NOT NULL,
    purpose VARCHAR(32) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    consumed_at DATETIME(6) DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY idx_verification_tokens_hash (token_hash),
    KEY idx_verification_tokens_user (user_id),
    CONSTRAINT fk_verification_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
