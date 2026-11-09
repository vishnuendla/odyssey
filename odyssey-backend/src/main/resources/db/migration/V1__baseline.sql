-- Baseline schema for a fresh Odyssey database.
-- Existing installations are baselined at version 1 by Flyway and only run V2+.

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    bio VARCHAR(255) DEFAULT NULL,
    created_at DATETIME(6) DEFAULT NULL,
    email VARCHAR(255) NOT NULL,
    location VARCHAR(255) DEFAULT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS journals (
    id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME(6) DEFAULT NULL,
    is_public BIT(1) DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    updated_at DATETIME(6) DEFAULT NULL,
    user_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_journals_user (user_id),
    CONSTRAINT fk_journals_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(255) NOT NULL,
    city VARCHAR(255) DEFAULT NULL,
    country VARCHAR(255) DEFAULT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    name VARCHAR(255) NOT NULL,
    journal_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_locations_journal (journal_id),
    CONSTRAINT fk_locations_journal FOREIGN KEY (journal_id) REFERENCES journals (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS images (
    id VARCHAR(255) NOT NULL,
    url VARCHAR(255) NOT NULL,
    journal_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_images_journal (journal_id),
    CONSTRAINT fk_images_journal FOREIGN KEY (journal_id) REFERENCES journals (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS comments (
    id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME(6) DEFAULT NULL,
    journal_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_comments_journal (journal_id),
    KEY idx_comments_user (user_id),
    CONSTRAINT fk_comments_journal FOREIGN KEY (journal_id) REFERENCES journals (id),
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS reactions (
    id VARCHAR(255) NOT NULL,
    type ENUM('LIKE', 'LOVE', 'WOW', 'GLOBE') NOT NULL,
    journal_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_reactions_journal (journal_id),
    KEY idx_reactions_user (user_id),
    CONSTRAINT fk_reactions_journal FOREIGN KEY (journal_id) REFERENCES journals (id),
    CONSTRAINT fk_reactions_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
