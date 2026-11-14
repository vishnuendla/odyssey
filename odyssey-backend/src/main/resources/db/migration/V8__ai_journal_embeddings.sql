-- Retrieval-augmented answers over a user's own journals. Each journal body is
-- split into paragraph chunks, embedded by the configured provider and stored
-- as a JSON float array; cosine similarity is computed in the service, which is
-- more than fast enough at personal-journal scale.

CREATE TABLE IF NOT EXISTS journal_embeddings (
    id VARCHAR(36) NOT NULL,
    journal_id VARCHAR(36) NOT NULL,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding TEXT NOT NULL,
    model VARCHAR(100) NOT NULL,
    dimensions INT NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_journal_embeddings_chunk (journal_id, chunk_index),
    KEY idx_journal_embeddings_journal (journal_id),
    CONSTRAINT fk_journal_embeddings_journal FOREIGN KEY (journal_id) REFERENCES journals (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
