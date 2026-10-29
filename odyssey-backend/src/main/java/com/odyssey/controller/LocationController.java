
package com.odyssey.controller;

import com.odyssey.dto.LocationDto;
import com.odyssey.service.LocationService;
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

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping("/search")
    public ResponseEntity<List<LocationDto>> searchLocations(@RequestParam("q") String query) {
        return ResponseEntity.ok(locationService.searchLocations(query));
    }
}
