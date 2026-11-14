package com.odyssey.dto;

/**
 * One cited excerpt behind an AI answer. {@code index} is the 1-based number
 * the answer cites as [n]; {@code snippet} is the beginning of the chunk.
 */
public record SourceRef(
        int index,
        String journalId,
        String journalTitle,
        int chunkIndex,
        String snippet) {
}
