package com.odyssey.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

/**
 * Embeddings through any OpenAI-compatible provider: OpenAI, OpenRouter, or a
 * local Ollama (base URL ending in /v1). The API key never leaves the backend
 * and the browser keeps talking only to the Odyssey API, exactly like the
 * Geoapify proxy.
 */
@Service
public class EmbeddingService {

    private static final Logger log = LoggerFactory.getLogger(EmbeddingService.class);
    private static final int BATCH_SIZE = 32;

    private final RestClient client;
    private final String apiKey;
    private final String model;
    private final ObjectMapper objectMapper;

    public EmbeddingService(@Value("${app.ai.openai.api-key:}") String apiKey,
                            @Value("${app.ai.openai.base-url:https://api.openai.com}") String baseUrl,
                            @Value("${app.ai.openai.embedding-model:text-embedding-3-small}") String model,
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

    /** Embeds texts in bounded batches; order of the output matches the input. */
    public List<float[]> embedAll(List<String> texts) {
        if (!isConfigured() || texts.isEmpty()) {
            return List.of();
        }
        List<float[]> vectors = new ArrayList<>(texts.size());
        for (int start = 0; start < texts.size(); start += BATCH_SIZE) {
            List<String> batch = texts.subList(start, Math.min(texts.size(), start + BATCH_SIZE));
            vectors.addAll(embedBatch(batch));
        }
        return vectors;
    }

    public float[] embed(String text) {
        List<float[]> vectors = embedAll(List.of(text));
        return vectors.isEmpty() ? null : vectors.get(0);
    }

    private List<float[]> embedBatch(List<String> batch) {
        String body;
        try {
            body = fetch("/v1/embeddings", batch);
        } catch (Exception ex) {
            log.warn("Embedding request failed: {}", ex.getMessage());
            throw new IllegalStateException("Embedding provider call failed", ex);
        }
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode data = root.path("data");
            List<float[]> vectors = new ArrayList<>(data.size());
            for (JsonNode item : data) {
                JsonNode array = item.path("embedding");
                float[] vector = new float[array.size()];
                for (int i = 0; i < array.size(); i++) {
                    vector[i] = (float) array.get(i).asDouble();
                }
                vectors.add(vector);
            }
            return vectors;
        } catch (Exception ex) {
            log.warn("Could not parse embedding response: {}", ex.getMessage());
            throw new IllegalStateException("Embedding provider response unreadable", ex);
        }
    }

    /** Seam for tests; the real implementation calls the provider. */
    protected String fetch(String path, List<String> texts) {
        return client.post()
                .uri(uriBuilder -> uriBuilder.path(path).build())
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .body(java.util.Map.of("model", model, "input", texts))
                .retrieve()
                .body(String.class);
    }
}
