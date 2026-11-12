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
import java.util.ArrayList;
import java.util.List;

/**
 * Server-side proxy for Geoapify. Keeping the API key here means it never ends
 * up in the public JavaScript bundle, and quotas can be rate limited centrally.
 */
@Service
public class GeocodingService {

    private static final Logger log = LoggerFactory.getLogger(GeocodingService.class);

    private final RestClient client;
    private final String apiKey;
    private final ObjectMapper objectMapper;

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
        if (!isConfigured() || text == null || text.isBlank()) {
            return List.of();
        }

        String body;
        try {
            body = client.get()
                    .uri(uriBuilder -> buildQuery(uriBuilder, path, text, limit))
                    .retrieve()
                    .body(String.class);
        } catch (RestClientException ex) {
            log.warn("Geocoding lookup failed: {}", ex.getMessage());
            return List.of();
        }
        if (body == null || body.isBlank()) {
            return List.of();
        }

        try {
            return parse(body);
        } catch (Exception ex) {
            log.warn("Could not parse geocoding response: {}", ex.getMessage());
            return List.of();
        }
    }

    private URI buildQuery(UriBuilder builder, String path, String text, int limit) {
        return builder.path(path)
                .queryParam("text", text)
                .queryParam("format", "json")
                .queryParam("limit", Math.min(Math.max(limit, 1), 10))
                .queryParam("apiKey", apiKey)
                .build();
    }

    private List<GeocodingResultDto> parse(String body) throws Exception {
        JsonNode root = objectMapper.readTree(body);
        JsonNode features = root.path("features");
        List<GeocodingResultDto> results = new ArrayList<>();
        for (JsonNode feature : features) {
            JsonNode properties = feature.path("properties");
            JsonNode coordinates = feature.path("geometry").path("coordinates");

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
                continue;
            }
            results.add(dto);
        }
        return results;
    }
}
