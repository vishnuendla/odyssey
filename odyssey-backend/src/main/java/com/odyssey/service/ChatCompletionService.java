package com.odyssey.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Chat completions through any OpenAI-compatible provider. Used to compose the
 * retrieved journal excerpts into a cited answer; answers may only come from
 * the provided context.
 */
@Service
public class ChatCompletionService {

    private static final Logger log = LoggerFactory.getLogger(ChatCompletionService.class);

    private final RestClient client;
    private final String apiKey;
    private final String model;
    private final ObjectMapper objectMapper;

    public ChatCompletionService(@Value("${app.ai.openai.api-key:}") String apiKey,
                                 @Value("${app.ai.openai.base-url:https://api.openai.com}") String baseUrl,
                                 @Value("${app.ai.openai.chat-model:gpt-4o-mini}") String model,
                                 ObjectMapper objectMapper) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.objectMapper = objectMapper;
        this.client = RestClient.builder().baseUrl(baseUrl).build();
    }

    public boolean isConfigured() {
        return !apiKey.isEmpty();
    }

    public String model() {
        return model;
    }

    public String complete(String systemPrompt, String userPrompt) {
        if (!isConfigured()) {
            throw new com.odyssey.exception.AiNotConfiguredException(
                    "AI features are not configured on this server.");
        }
        String body;
        try {
            body = fetch("/v1/chat/completions", systemPrompt, userPrompt);
        } catch (com.odyssey.exception.AiNotConfiguredException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Chat completion request failed: {}", ex.getMessage());
            throw new IllegalStateException("Chat provider call failed", ex);
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode content = root.path("choices").path(0).path("message").path("content");
            if (content.isMissingNode() || content.asText("").isBlank()) {
                throw new IllegalStateException("Chat provider returned an empty answer");
            }
            return content.asText();
        } catch (IllegalStateException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Could not parse chat response: {}", ex.getMessage());
            throw new IllegalStateException("Chat provider response unreadable", ex);
        }
    }

    /** Seam for tests; the real implementation calls the provider. */
    protected String fetch(String path, String systemPrompt, String userPrompt) {
        return client.post()
                .uri(uriBuilder -> uriBuilder.path(path).build())
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(Map.of(
                        "model", model,
                        "temperature", 0.3,
                        "max_tokens", 600,
                        "messages", List.of(
                                Map.of("role", "system", "content", systemPrompt),
                                Map.of("role", "user", "content", userPrompt))))
                .retrieve()
                .body(String.class);
    }
}
