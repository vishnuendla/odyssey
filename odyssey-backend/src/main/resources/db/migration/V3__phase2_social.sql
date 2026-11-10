-- Phase 2: saved journals (bookmarks), journal tags, and public profile data.

CREATE TABLE IF NOT EXISTS bookmarks (
    id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    journal_id VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_bookmarks_user_journal (user_id, journal_id),
    KEY idx_bookmarks_user (user_id),
    KEY idx_bookmarks_journal (journal_id),
    CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_bookmarks_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS journal_tags (
    journal_id VARCHAR(255) NOT NULL,
    tag VARCHAR(50) NOT NULL,
    PRIMARY KEY (journal_id, tag),
    KEY idx_journal_tags_tag (tag),
    CONSTRAINT fk_journal_tags_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
