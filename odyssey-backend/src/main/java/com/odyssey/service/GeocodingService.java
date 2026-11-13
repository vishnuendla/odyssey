package com.odyssey.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.odyssey.dto.GeocodingResultDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriBuilder;

import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Server-side proxy for Geoapify. Keeping the API key here means it never ends
 * up in the public JavaScript bundle, and quotas can be rate limited centrally.
 *
 * <p>Autocomplete runs on every pause while someone types, so the same prefixes
 * are requested over and over. Results are cached for a short window and queries
 * shorter than {@link #MIN_QUERY_LENGTH} never reach the provider, which keeps
 * the upstream quota for real lookups.</p>
 */
@Service
public class GeocodingService {

    private static final Logger log = LoggerFactory.getLogger(GeocodingService.class);

    /** Shortest query worth sending upstream; mirrors the client-side threshold. */
    static final int MIN_QUERY_LENGTH = 3;
    /** Upper bound so a huge query string cannot inflate the cache keys. */
    static final int MAX_QUERY_LENGTH = 120;
    static final int CACHE_MAX_ENTRIES = 512;
    static final Duration CACHE_TTL = Duration.ofMinutes(10);

    private final RestClient client;
    private final String apiKey;
    private final ObjectMapper objectMapper;
    private final AtomicLong providerCalls = new AtomicLong();
    private final Map<String, CacheEntry> cache = new LinkedHashMap<>(CACHE_MAX_ENTRIES, 0.75f, true) {
        @Override
        protected boolean removeEldestEntry(Map.Entry<String, CacheEntry> eldest) {
            return size() > CACHE_MAX_ENTRIES;
        }
    };

    public GeocodingService(@Value("${app.geoapify.api-key:}") String apiKey,
                            @Value("${app.geoapify.base-url:https://api.geoapify.com}") String baseUrl,
                            ObjectMapper objectMapper) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.objectMapper = objectMapper;
        this.client = RestClient.builder().baseUrl(baseUrl).build();
    }

    public boolean isConfigured() {
        return !apiKey.isEmpty();
    }

    public List<GeocodingResultDto> autocomplete(String text, int limit) {
        return query("/v1/geocode/autocomplete", text, limit);
    }

    public List<GeocodingResultDto> geocode(String text, int limit) {
        return query("/v1/geocode/search", text, limit);
    }

    private List<GeocodingResultDto> query(String path, String text, int limit) {
        String normalised = normalise(text);
        if (!isConfigured() || normalised.length() < MIN_QUERY_LENGTH) {
            return List.of();
        }

        int cappedLimit = Math.min(Math.max(limit, 1), 10);
        String cacheKey = path + '|' + normalised + '|' + cappedLimit;

        CacheEntry cached = getFromCache(cacheKey);
        if (cached != null) {
            return cached.results();
        }

        String body;
        try {
            providerCalls.incrementAndGet();
            body = fetch(path, normalised, cappedLimit);
        } catch (RestClientException ex) {
            log.warn("Geocoding lookup failed: {}", ex.getMessage());
            return List.of();
        }
        if (body == null || body.isBlank()) {
            return List.of();
        }

        try {
            List<GeocodingResultDto> results = List.copyOf(parse(body));
            if (!results.isEmpty()) {
                putInCache(cacheKey, results);
            }
            return results;
        } catch (Exception ex) {
            log.warn("Could not parse geocoding response: {}", ex.getMessage());
            return List.of();
        }
    }

    /** Seam for tests; the real implementation calls Geoapify. */
    protected String fetch(String path, String text, int limit) {
        return client.get()
                .uri(uriBuilder -> buildQuery(uriBuilder, path, text, limit))
                .retrieve()
                .body(String.class);
    }

    private String normalise(String text) {
        if (text == null) {
            return "";
        }
        String trimmed = text.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        return trimmed.length() > MAX_QUERY_LENGTH ? "" : trimmed;
    }

    private synchronized CacheEntry getFromCache(String key) {
        CacheEntry entry = cache.get(key);
        if (entry == null) {
            return null;
        }
        if (entry.expiresAt() < System.currentTimeMillis()) {
            cache.remove(key);
            return null;
        }
        return entry;
    }

    private synchronized void putInCache(String key, List<GeocodingResultDto> results) {
        cache.put(key, new CacheEntry(results, System.currentTimeMillis() + CACHE_TTL.toMillis()));
    }

    /** Visible for tests: how many lookups actually reached the provider. */
    long providerCallCount() {
        return providerCalls.get();
    }

    /** Visible for tests: current number of live cache entries. */
    synchronized int cachedEntryCount() {
        return cache.size();
    }

    private URI buildQuery(UriBuilder builder, String path, String text, int limit) {
        // No format parameter: Geoapify's default GeoJSON response is what we parse.
        return builder.path(path)
                .queryParam("text", text)
                .queryParam("limit", limit)
                .queryParam("apiKey", apiKey)
                .build();
    }

    /**
     * Accepts both response shapes Geoapify can return. The default is GeoJSON
     * ({@code features}); {@code format=json} returns the flatter
     * {@code results} array. Reading only one of them silently produced empty
     * suggestions for every query, so both are handled here.
     */
    private List<GeocodingResultDto> parse(String body) throws Exception {
        JsonNode root = objectMapper.readTree(body);
        List<GeocodingResultDto> results = new ArrayList<>();

        JsonNode features = root.path("features");
        if (features.isArray()) {
            for (JsonNode feature : features) {
                GeocodingResultDto dto = toResult(
                        feature.path("properties"),
                        feature.path("geometry").path("coordinates"));
                if (dto != null) {
                    results.add(dto);
                }
            }
            return results;
        }

        for (JsonNode result : root.path("results")) {
            GeocodingResultDto dto = toResult(result, result.path("geometry").path("coordinates"));
            if (dto != null) {
                results.add(dto);
            }
        }
        return results;
    }

    private GeocodingResultDto toResult(JsonNode properties, JsonNode coordinates) {
        GeocodingResultDto dto = new GeocodingResultDto();
        dto.setFormatted(properties.path("formatted").asText(null));
        dto.setCountry(properties.path("country").asText(null));
        dto.setCity(properties.path("city").asText(null));
        dto.setState(properties.path("state").asText(null));
        dto.setPlaceId(properties.path("place_id").asText(null));

        if (properties.hasNonNull("lat") && properties.hasNonNull("lon")) {
            dto.setLatitude(properties.get("lat").asDouble());
            dto.setLongitude(properties.get("lon").asDouble());
        } else if (coordinates.isArray() && coordinates.size() >= 2) {
            dto.setLongitude(coordinates.get(0).asDouble());
            dto.setLatitude(coordinates.get(1).asDouble());
        } else {
            return null;
        }
        return dto;
    }

    private record CacheEntry(List<GeocodingResultDto> results, long expiresAt) {
    }
}
