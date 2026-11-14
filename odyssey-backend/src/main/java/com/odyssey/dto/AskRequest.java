package com.odyssey.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Body of POST /api/ai/ask. */
public record AskRequest(
        @NotBlank
        @Size(max = 500, message = "Question must be 500 characters or fewer")
        String question) {
}
