-- Phase 3: follows, notifications, threaded comments, moderation and indexes.

-- Roles. Existing accounts stay regular users; promote an operator with:
--   UPDATE users SET role = 'ADMIN' WHERE email = 'you@example.com';
ALTER TABLE users
    ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Moderation flags. Hidden content stays visible to its owner and to admins.
ALTER TABLE journals
    ADD COLUMN hidden BIT(1) NOT NULL DEFAULT b'0';

ALTER TABLE comments
    ADD COLUMN parent_id VARCHAR(255) DEFAULT NULL,
    ADD COLUMN hidden BIT(1) NOT NULL DEFAULT b'0',
    ADD KEY idx_comments_parent (parent_id),
    ADD CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments (id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS follows (
    id VARCHAR(255) NOT NULL,
    follower_id VARCHAR(255) NOT NULL,
    following_id VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_follows_pair (follower_id, following_id),
    KEY idx_follows_following (following_id),
    CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_follows_following FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    actor_id VARCHAR(255) DEFAULT NULL,
    type VARCHAR(32) NOT NULL,
    journal_id VARCHAR(255) DEFAULT NULL,
    comment_id VARCHAR(255) DEFAULT NULL,
    message VARCHAR(255) DEFAULT NULL,
    is_read BIT(1) NOT NULL DEFAULT b'0',
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_notifications_user_created (user_id, created_at),
    KEY idx_notifications_user_unread (user_id, is_read),
    KEY idx_notifications_journal (journal_id),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL,
    CONSTRAINT fk_notifications_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(255) NOT NULL,
    reporter_id VARCHAR(255) NOT NULL,
    target_type VARCHAR(16) NOT NULL,
    target_id VARCHAR(255) NOT NULL,
    reason VARCHAR(32) NOT NULL,
    details VARCHAR(1000) DEFAULT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    created_at DATETIME(6) NOT NULL,
    resolved_at DATETIME(6) DEFAULT NULL,
    resolved_by VARCHAR(255) DEFAULT NULL,
    resolution_note VARCHAR(500) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_reports_status_created (status, created_at),
    KEY idx_reports_target (target_type, target_id),
    KEY idx_reports_reporter (reporter_id),
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_resolved_by FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Feed and detail query indexes.
CREATE INDEX idx_journals_public_created ON journals (is_public, created_at);
CREATE INDEX idx_journals_user_created ON journals (user_id, created_at);
CREATE INDEX idx_journals_public_hidden ON journals (is_public, hidden);
CREATE INDEX idx_comments_journal_created ON comments (journal_id, created_at);
CREATE INDEX idx_reactions_journal_type ON reactions (journal_id, type);
CREATE INDEX idx_comments_user_created ON comments (user_id, created_at);
