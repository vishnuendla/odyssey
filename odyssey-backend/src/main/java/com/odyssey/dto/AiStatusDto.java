package com.odyssey.dto;

/** Response of GET /api/ai/status: whether AI features are usable. */
public record AiStatusDto(
        boolean configured,
        String embeddingModel,
        String chatModel) {
}
