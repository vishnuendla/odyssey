-- Relevance-ranked search. MySQL's InnoDB FULLTEXT index on the two searched
-- columns lets MATCH ... AGAINST replace the leading-wildcard LIKE scans, which
-- read every row and could never rank results.

ALTER TABLE journals ADD FULLTEXT INDEX ft_journals_title (title);
ALTER TABLE journals ADD FULLTEXT INDEX ft_journals_content (content);
-- Used by the WHERE clause when filtering by match; the two single-column
-- indexes above are what the weighted scoring expressions read.
ALTER TABLE journals ADD FULLTEXT INDEX ft_journals_text (title, content);
