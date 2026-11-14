package com.odyssey.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TextChunkerTest {

    @Test
    void splitsOnParagraphBreaks() {
        String content = "First paragraph about the pink city of Jaipur and its busy bazaars.\n\n"
                + "Second paragraph about the torii gates of Kyoto at quiet dawn.\n\n"
                + "Third paragraph about the long train ride home through the hills.";
        List<String> chunks = TextChunker.chunk(content);

        assertThat(chunks).hasSize(3);
        assertThat(chunks.get(0)).isEqualTo("First paragraph about the pink city of Jaipur and its busy bazaars.");
        assertThat(chunks.get(2)).isEqualTo("Third paragraph about the long train ride home through the hills.");
    }

    @Test
    void mergesShortParagraphsUntilTheMinimumLength() {
        String content = "Hi.\n\nThere.\n\nThis one paragraph is long enough to stand on its own two feet.";
        List<String> chunks = TextChunker.chunk(content);

        // Both tiny paragraphs merge with the next one until 40 chars are reached.
        assertThat(chunks).hasSize(1);
        assertThat(chunks.get(0)).startsWith("Hi.");
        assertThat(chunks.get(0)).endsWith("two feet.");
    }

    @Test
    void aChunkPastTheMinimumIsNeverMergedWithItsNeighbour() {
        String content = "A paragraph long enough to stand alone above the minimum length.\n\nShort.";
        List<String> chunks = TextChunker.chunk(content);

        assertThat(chunks).hasSize(2);
        assertThat(chunks.get(1)).isEqualTo("Short.");
    }

    @Test
    void longParagraphsAreSplitOnSentenceBoundaries() {
        String sentence = "The quick brown fox jumps over the lazy dog near the old stone bridge. ";
        String paragraph = sentence.repeat(20); // ~1360 chars, above the 800 cap.
        List<String> chunks = TextChunker.chunk(paragraph);

        assertThat(chunks.size()).isGreaterThanOrEqualTo(2);
        for (String chunk : chunks) {
            assertThat(chunk.length()).isLessThanOrEqualTo(TextChunker.MAX_CHUNK_LENGTH);
            assertThat(chunk).endsWith(".");
        }
    }

    @Test
    void capsTheTotalNumberOfChunks() {
        String content = "x".repeat(30);
        StringBuilder builder = new StringBuilder();
        for (int i = 0; i < 100; i++) {
            if (i > 0) {
                builder.append("\n\n");
            }
            builder.append("Paragraph ").append(i).append(" ").append(content);
        }
        assertThat(TextChunker.chunk(builder.toString())).hasSize(TextChunker.MAX_CHUNKS);
    }

    @Test
    void blankOrNullContentYieldsNoChunks() {
        assertThat(TextChunker.chunk(null)).isEmpty();
        assertThat(TextChunker.chunk("   \n\n  ")).isEmpty();
    }
}
