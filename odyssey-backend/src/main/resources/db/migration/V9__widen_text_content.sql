-- MySQL TEXT holds 65,535 bytes, so a journal body within the API's 50,000
-- character limit could still fail at commit when written in multi-byte
-- scripts. MEDIUMTEXT removes that mismatch without loosening the validation.

ALTER TABLE journals MODIFY COLUMN content MEDIUMTEXT NOT NULL;
ALTER TABLE comments MODIFY COLUMN content MEDIUMTEXT NOT NULL;
