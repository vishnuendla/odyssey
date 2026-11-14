package com.odyssey.service;

import java.util.ArrayList;
import java.util.List;

/**
 * Splits a journal body into paragraph-sized chunks small enough to embed
 * meaningfully: single paragraphs are kept whole, long ones are split on
 * sentence boundaries, and short neighbours are merged (even across a blank
 * line) until they reach the minimum size, because tiny chunks embed poorly.
 */
final class TextChunker {

    static final int MAX_CHUNK_LENGTH = 800;
    static final int MIN_CHUNK_LENGTH = 40;
    static final int MAX_CHUNKS = 40;

    private TextChunker() {
    }

    static List<String> chunk(String content) {
        List<String> chunks = new ArrayList<>();
        if (content == null || content.isBlank()) {
            return chunks;
        }
        for (String paragraph : content.split("\\R\\s*\\R")) {
            String trimmed = paragraph.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            if (trimmed.length() <= MAX_CHUNK_LENGTH) {
                chunks.add(trimmed);
            } else {
                chunks.addAll(splitLongParagraph(trimmed));
            }
        }
        List<String> merged = mergeShortChunks(chunks);
        if (merged.size() > MAX_CHUNKS) {
            merged = merged.subList(0, MAX_CHUNKS);
        }
        return merged;
    }

    private static List<String> splitLongParagraph(String paragraph) {
        List<String> pieces = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String sentence : paragraph.split("(?<=([.!?]))\\s+")) {
            if (current.length() + sentence.length() + 1 > MAX_CHUNK_LENGTH && current.length() > 0) {
                pieces.add(current.toString().trim());
                current.setLength(0);
            }
            if (sentence.length() > MAX_CHUNK_LENGTH) {
                // Pathological unbroken text: hard-split it.
                for (int i = 0; i < sentence.length(); i += MAX_CHUNK_LENGTH) {
                    pieces.add(sentence.substring(i, Math.min(sentence.length(), i + MAX_CHUNK_LENGTH)));
                }
            } else {
                if (current.length() > 0) {
                    current.append(' ');
                }
                current.append(sentence);
            }
        }
        if (current.length() > 0) {
            pieces.add(current.toString().trim());
        }
        return pieces;
    }

    private static List<String> mergeShortChunks(List<String> chunks) {
        List<String> merged = new ArrayList<>();
        StringBuilder pending = new StringBuilder();
        for (String chunk : chunks) {
            if (pending.length() > 0 && pending.length() + chunk.length() + 2 > MAX_CHUNK_LENGTH) {
                merged.add(pending.toString().trim());
                pending.setLength(0);
            }
            if (pending.length() > 0) {
                pending.append("\n\n");
            }
            pending.append(chunk);
            if (pending.length() >= MIN_CHUNK_LENGTH) {
                merged.add(pending.toString().trim());
                pending.setLength(0);
            }
        }
        if (pending.length() > 0) {
            merged.add(pending.toString().trim());
        }
        return merged;
    }
}
