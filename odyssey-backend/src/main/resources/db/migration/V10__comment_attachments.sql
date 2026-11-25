-- Comments and replies can carry a small set of photos, GIFs or a short video.
-- Media rows live beside the comment instead of inside a JSON/blob column so a
-- thread stays cheap to page and moderation can remove one attachment cleanly.

CREATE TABLE IF NOT EXISTS comment_attachments (
    id VARCHAR(36) NOT NULL,
    comment_id VARCHAR(36) NOT NULL,
    url VARCHAR(512) NOT NULL,
    media_type ENUM('IMAGE', 'GIF', 'VIDEO') NOT NULL,
    position INT NOT NULL DEFAULT 0,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_comment_attachments_comment (comment_id, position),
    CONSTRAINT fk_comment_attachments_comment
        FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
