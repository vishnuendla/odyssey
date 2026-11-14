package com.odyssey.dto;

import java.util.List;

/** Response of POST /api/ai/ask: an answer plus the excerpts behind it. */
public record AskAnswer(
        String question,
        String answer,
        List<SourceRef> sources) {
}
