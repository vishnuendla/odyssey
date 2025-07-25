-- Database Optimization Indexes for Odyssey
-- Run these SQL commands on your MySQL database for better performance

-- Index for public journal queries (most common query)
CREATE INDEX idx_journal_public_created ON journals(is_public, deleted, created_at DESC);

-- Index for user's journals
CREATE INDEX idx_journal_user_created ON journals(user_id, deleted, created_at DESC);

-- Index for location-based queries
CREATE INDEX idx_journal_location ON journals(latitude, longitude);

-- Index for journal entries by journal
CREATE INDEX idx_entry_journal_created ON journal_entries(journal_id, created_at DESC);

-- Index for user authentication
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_username ON users(username);

-- Composite index for search queries
CREATE INDEX idx_journal_search ON journals(is_public, deleted, title, location);

-- Show current indexes (for verification)
-- SHOW INDEX FROM journals;
-- SHOW INDEX FROM journal_entries;
-- SHOW INDEX FROM users;
