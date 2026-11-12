package com.odyssey.controller;

import com.odyssey.dto.GeocodingResultDto;
import com.odyssey.dto.LocationDto;
import com.odyssey.service.GeocodingService;
import com.odyssey.service.LocationService;
import com.odyssey.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/locations")
public class LocationController {

    private final LocationService locationService;
    private final GeocodingService geocodingService;
    private final RateLimitService rateLimitService;

    public LocationController(LocationService locationService,
                              GeocodingService geocodingService,
                              RateLimitService rateLimitService) {
        this.locationService = locationService;
        this.geocodingService = geocodingService;
        this.rateLimitService = rateLimitService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<LocationDto>> searchLocations(@RequestParam("q") String query) {
        return ResponseEntity.ok(locationService.searchLocations(query));
    }

    @GetMapping("/autocomplete")
    public ResponseEntity<List<GeocodingResultDto>> autocomplete(
            @RequestParam("text") String text,
            @RequestParam(defaultValue = "5") int limit,
            HttpServletRequest request) {
        rateLimitService.check("geocode:" + clientIp(request), 120, 60);
        return ResponseEntity.ok(geocodingService.autocomplete(text, limit));
    }

    @GetMapping("/geocode")
    public ResponseEntity<List<GeocodingResultDto>> geocode(
            @RequestParam("text") String text,
            @RequestParam(defaultValue = "1") int limit,
            HttpServletRequest request) {
        rateLimitService.check("geocode:" + clientIp(request), 120, 60);
        return ResponseEntity.ok(geocodingService.geocode(text, limit));
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            String[] hops = forwarded.split(",");
            return hops[hops.length - 1].trim();
        }
        return request.getRemoteAddr();
    }
}
