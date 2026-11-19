
package com.odyssey.service;

import com.odyssey.dto.LocationDto;
import com.odyssey.entity.Location;
import com.odyssey.repository.LocationRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LocationService {

    /** Keeps the public suggestion endpoint cheap and bounded. */
    private static final int MAX_RESULTS = 10;
    private static final int MIN_QUERY_LENGTH = 2;

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    public List<LocationDto> searchLocations(String query) {
        if (query == null || query.trim().length() < MIN_QUERY_LENGTH) {
            // A blank query used to dump the whole table; keep it empty instead.
            return List.of();
        }
        return locationRepository
                .searchVisibleByQuery(query.trim(), PageRequest.of(0, MAX_RESULTS))
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private LocationDto convertToDto(Location location) {
        LocationDto dto = new LocationDto();
        dto.setId(location.getId());
        dto.setName(location.getName());
        dto.setLatitude(location.getLatitude());
        dto.setLongitude(location.getLongitude());
        dto.setCountry(location.getCountry());
        dto.setCity(location.getCity());
        return dto;
    }
}
