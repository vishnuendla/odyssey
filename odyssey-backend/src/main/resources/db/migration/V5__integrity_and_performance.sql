-- Integrity and performance hardening.
--
-- 1. Deleting a user or journal must not leave orphaned rows behind.
-- 2. A reaction is unique per (journal, user, type); duplicates are removed
--    before the constraint is added so the migration is safe on live data.
-- 3. is_public is non-null so "public feed" queries never miss NULL rows.
-- 4. Composite indexes back the feed, search and moderation queries.

-- Public flag: backfill NULLs, then enforce NOT NULL.
UPDATE journals SET is_public = b'0' WHERE is_public IS NULL;
ALTER TABLE journals MODIFY COLUMN is_public BIT(1) NOT NULL DEFAULT b'0';

-- Cascade deletes through the journal graph.
ALTER TABLE journals DROP FOREIGN KEY fk_journals_user;
ALTER TABLE journals
    ADD CONSTRAINT fk_journals_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE locations DROP FOREIGN KEY fk_locations_journal;
ALTER TABLE locations
    ADD CONSTRAINT fk_locations_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE;

ALTER TABLE images DROP FOREIGN KEY fk_images_journal;
ALTER TABLE images
    ADD CONSTRAINT fk_images_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE;

ALTER TABLE comments DROP FOREIGN KEY fk_comments_journal;
ALTER TABLE comments DROP FOREIGN KEY fk_comments_user;
ALTER TABLE comments
    ADD CONSTRAINT fk_comments_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE reactions DROP FOREIGN KEY fk_reactions_journal;
ALTER TABLE reactions DROP FOREIGN KEY fk_reactions_user;
ALTER TABLE reactions
    ADD CONSTRAINT fk_reactions_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_reactions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

-- Remove duplicate reactions, keeping the oldest row per (journal, user, type).
DELETE FROM reactions
WHERE id NOT IN (
    SELECT keep_id FROM (
        SELECT MIN(id) AS keep_id
        FROM reactions
        GROUP BY journal_id, user_id, type
    ) AS keep_rows
);

ALTER TABLE reactions
    ADD UNIQUE KEY uk_reactions_journal_user_type (journal_id, user_id, type);

-- Query indexes.
CREATE INDEX idx_journals_public_hidden_created ON journals (is_public, hidden, created_at);
CREATE INDEX idx_reports_target_status ON reports (target_type, target_id, status);
