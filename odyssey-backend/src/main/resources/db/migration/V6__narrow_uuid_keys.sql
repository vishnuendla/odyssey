-- DATA-05: UUID primary and foreign keys were stored as VARCHAR(255).
--
-- Every value is a standard 36-character UUID, but the oversized columns made
-- every primary key, unique key and foreign-key index 3-4x wider than needed.
-- This migration narrows the id columns to VARCHAR(36) and restores the
-- ON DELETE rules introduced in V5.
--
-- MySQL requires the referencing and referenced columns to be modified
-- separately from their foreign-key constraints, so all constraints are
-- dropped first, the columns are narrowed, and the constraints are re-added.

ALTER TABLE bookmarks
    DROP FOREIGN KEY fk_bookmarks_journal,
    DROP FOREIGN KEY fk_bookmarks_user;

ALTER TABLE comments
    DROP FOREIGN KEY fk_comments_journal,
    DROP FOREIGN KEY fk_comments_parent,
    DROP FOREIGN KEY fk_comments_user;

ALTER TABLE follows
    DROP FOREIGN KEY fk_follows_follower,
    DROP FOREIGN KEY fk_follows_following;

ALTER TABLE images
    DROP FOREIGN KEY fk_images_journal;

ALTER TABLE journal_tags
    DROP FOREIGN KEY fk_journal_tags_journal;

ALTER TABLE journals
    DROP FOREIGN KEY fk_journals_user;

ALTER TABLE locations
    DROP FOREIGN KEY fk_locations_journal;

ALTER TABLE notifications
    DROP FOREIGN KEY fk_notifications_actor,
    DROP FOREIGN KEY fk_notifications_journal,
    DROP FOREIGN KEY fk_notifications_user;

ALTER TABLE reactions
    DROP FOREIGN KEY fk_reactions_journal,
    DROP FOREIGN KEY fk_reactions_user;

ALTER TABLE refresh_tokens
    DROP FOREIGN KEY fk_refresh_tokens_user;

ALTER TABLE reports
    DROP FOREIGN KEY fk_reports_reporter,
    DROP FOREIGN KEY fk_reports_resolved_by;

ALTER TABLE verification_tokens
    DROP FOREIGN KEY fk_verification_tokens_user;

ALTER TABLE users
    MODIFY COLUMN id VARCHAR(36) NOT NULL;

ALTER TABLE journals
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN user_id VARCHAR(36) NOT NULL;

ALTER TABLE locations
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN journal_id VARCHAR(36) NOT NULL;

ALTER TABLE images
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN journal_id VARCHAR(36) NOT NULL;

ALTER TABLE comments
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN journal_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN user_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN parent_id VARCHAR(36) DEFAULT NULL;

ALTER TABLE reactions
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN journal_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN user_id VARCHAR(36) NOT NULL;

ALTER TABLE refresh_tokens
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN user_id VARCHAR(36) NOT NULL;

ALTER TABLE verification_tokens
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN user_id VARCHAR(36) NOT NULL;

ALTER TABLE bookmarks
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN user_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN journal_id VARCHAR(36) NOT NULL;

ALTER TABLE journal_tags
    MODIFY COLUMN journal_id VARCHAR(36) NOT NULL;

ALTER TABLE follows
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN follower_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN following_id VARCHAR(36) NOT NULL;

ALTER TABLE notifications
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN user_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN actor_id VARCHAR(36) DEFAULT NULL,
    MODIFY COLUMN journal_id VARCHAR(36) DEFAULT NULL,
    MODIFY COLUMN comment_id VARCHAR(36) DEFAULT NULL;

ALTER TABLE reports
    MODIFY COLUMN id VARCHAR(36) NOT NULL,
    MODIFY COLUMN reporter_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN target_id VARCHAR(36) NOT NULL,
    MODIFY COLUMN resolved_by VARCHAR(36) DEFAULT NULL;

ALTER TABLE journals
    ADD CONSTRAINT fk_journals_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE locations
    ADD CONSTRAINT fk_locations_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE;

ALTER TABLE images
    ADD CONSTRAINT fk_images_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE;

ALTER TABLE comments
    ADD CONSTRAINT fk_comments_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments (id) ON DELETE CASCADE;

ALTER TABLE reactions
    ADD CONSTRAINT fk_reactions_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_reactions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE refresh_tokens
    ADD CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE verification_tokens
    ADD CONSTRAINT fk_verification_tokens_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE bookmarks
    ADD CONSTRAINT fk_bookmarks_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_bookmarks_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE;

ALTER TABLE journal_tags
    ADD CONSTRAINT fk_journal_tags_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE;

ALTER TABLE follows
    ADD CONSTRAINT fk_follows_follower FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_follows_following FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_notifications_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE;

ALTER TABLE reports
    ADD CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_reports_resolved_by FOREIGN KEY (resolved_by) REFERENCES users (id) ON DELETE SET NULL;
