package com.odyssey.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Body of POST /api/ai/search. */
public record SearchRequest(
        @NotBlank
        @Size(max = 500, message = "Query must be 500 characters or fewer")
        String query) {
}
