package com.odyssey.dto;

/** One row of POST /api/ai/search (semantic search over the user's journals). */
public record SemanticSearchHit(
        String journalId,
        String journalTitle,
        int chunkIndex,
        String snippet,
        double score) {
}
