package com.odyssey.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.odyssey.dto.GeocodingResultDto;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Autocomplete fires on every typing pause, so the proxy must not forward every
 * prefix to Geoapify. These tests pin the guarding behaviour: short queries never
 * leave the server, repeated prefixes are served from the short-lived cache, and
 * the cache cannot grow without bound.
 */
class GeocodingServiceTest {

    private static final String FEATURE_JSON = """
            {"features":[{"properties":{
              "formatted":"Hyderabad, India",
              "country":"India",
              "city":"Hyderabad",
              "state":"Telangana",
              "place_id":"abc123",
              "lat":17.385,
              "lon":78.4867}}]}
            """;

    /** Shape returned when Geoapify is asked for {@code format=json}. */
    private static final String RESULTS_JSON = """
            {"results":[{"formatted":"Paris, France",
              "country":"France",
              "city":"Paris",
              "state":"Ile-de-France",
              "place_id":"xyz789",
              "lat":48.8566,
              "lon":2.3522}]}
            """;

    private static final class CountingService extends GeocodingService {
        private final AtomicInteger calls = new AtomicInteger();
        private final String payload;

        CountingService(String apiKey, String payload) {
            super(apiKey, "https://geoapify.invalid", new ObjectMapper());
            this.payload = payload;
        }

        @Override
        protected String fetch(String path, String text, int limit) {
            calls.incrementAndGet();
            return payload;
        }
    }

    @Test
    void doesNotCallProviderWithoutAnApiKey() {
        CountingService service = new CountingService("", FEATURE_JSON);

        assertThat(service.autocomplete("Hyderabad", 5)).isEmpty();
        assertThat(service.cachedEntryCount()).isZero();
        assertThat(service.providerCallCount()).isZero();
    }

    @Test
    void doesNotCallProviderForQueriesShorterThanTheThreshold() {
        CountingService service = new CountingService("key", FEATURE_JSON);

        assertThat(service.autocomplete("Hy", 5)).isEmpty();
        assertThat(service.autocomplete("  h  ", 5)).isEmpty();
        assertThat(service.autocomplete("   ", 5)).isEmpty();
        assertThat(service.providerCallCount()).isZero();
    }

    @Test
    void servesRepeatedPrefixesFromTheCache() {
        CountingService service = new CountingService("key", FEATURE_JSON);

        List<GeocodingResultDto> first = service.autocomplete("Hyderabad", 5);
        List<GeocodingResultDto> second = service.autocomplete("  hyderabad ", 5);

        assertThat(first).hasSize(1);
        assertThat(second).hasSize(1);
        assertThat(second.get(0).getCity()).isEqualTo("Hyderabad");
        assertThat(service.providerCallCount()).isEqualTo(1);
        assertThat(service.cachedEntryCount()).isEqualTo(1);
    }

    @Test
    void keepsSeparateCacheEntriesPerResultLimit() {
        CountingService service = new CountingService("key", FEATURE_JSON);

        service.autocomplete("Hyderabad", 5);
        service.autocomplete("Hyderabad", 8);

        assertThat(service.providerCallCount()).isEqualTo(2);
        assertThat(service.cachedEntryCount()).isEqualTo(2);
    }

    @Test
    void doesNotCacheEmptyProviderResponses() {
        CountingService service = new CountingService("key", "{\"features\":[]}");

        assertThat(service.autocomplete("Atlantis", 5)).isEmpty();
        assertThat(service.autocomplete("Atlantis", 5)).isEmpty();

        assertThat(service.cachedEntryCount()).isZero();
        assertThat(service.providerCallCount()).isEqualTo(2);
    }

    @Test
    void rejectsOverlongQueriesWithoutCallingProvider() {
        CountingService service = new CountingService("key", FEATURE_JSON);
        String huge = "a".repeat(GeocodingService.MAX_QUERY_LENGTH + 1);

        assertThat(service.autocomplete(huge, 5)).isEmpty();
        assertThat(service.providerCallCount()).isZero();
    }

    @Test
    void boundsTheCacheSize() {
        CountingService service = new CountingService("key", FEATURE_JSON);

        int queries = GeocodingService.CACHE_MAX_ENTRIES + 40;
        for (int i = 0; i < queries; i++) {
            service.autocomplete("place " + i, 5);
        }

        assertThat(service.providerCallCount()).isEqualTo(queries);
        assertThat(service.cachedEntryCount()).isLessThanOrEqualTo(GeocodingService.CACHE_MAX_ENTRIES);
    }

    @Test
    void geocodeUsesTheSameGuards() {
        CountingService service = new CountingService("key", FEATURE_JSON);

        assertThat(service.geocode("Hyderabad", 1)).hasSize(1);
        assertThat(service.geocode("Hyderabad", 1)).hasSize(1);
        assertThat(service.providerCallCount()).isEqualTo(1);
    }

    @Test
    void parsesTheDefaultGeoJsonResponse() {
        CountingService service = new CountingService("key", FEATURE_JSON);

        List<GeocodingResultDto> results = service.autocomplete("Hyderabad", 5);

        assertThat(results).hasSize(1);
        GeocodingResultDto result = results.get(0);
        assertThat(result.getCity()).isEqualTo("Hyderabad");
        assertThat(result.getCountry()).isEqualTo("India");
        assertThat(result.getLatitude()).isEqualTo(17.385);
        assertThat(result.getLongitude()).isEqualTo(78.4867);
    }

    @Test
    void parsesTheJsonFormatResponse() {
        CountingService service = new CountingService("key", RESULTS_JSON);

        List<GeocodingResultDto> results = service.autocomplete("Paris", 5);

        assertThat(results).hasSize(1);
        GeocodingResultDto result = results.get(0);
        assertThat(result.getFormatted()).isEqualTo("Paris, France");
        assertThat(result.getLatitude()).isEqualTo(48.8566);
        assertThat(result.getLongitude()).isEqualTo(2.3522);
    }

    @Test
    void acceptsCoordinatesFromGeoJsonGeometry() {
        CountingService service = new CountingService("key", """
                {"features":[{"properties":{"formatted":"Nowhere"},
                  "geometry":{"coordinates":[78.4867,17.385]}}]}
                """);

        List<GeocodingResultDto> results = service.autocomplete("Nowhere", 5);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).getLongitude()).isEqualTo(78.4867);
        assertThat(results.get(0).getLatitude()).isEqualTo(17.385);
    }
}
