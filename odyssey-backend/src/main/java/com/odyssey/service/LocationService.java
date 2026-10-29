
package com.odyssey.service;

import com.odyssey.dto.LocationDto;
import com.odyssey.entity.Location;
import com.odyssey.repository.LocationRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class LocationService {

    private final LocationRepository locationRepository;

    public LocationService(LocationRepository locationRepository) {
        this.locationRepository = locationRepository;
    }

    public List<LocationDto> searchLocations(String query) {
        return locationRepository.searchByQuery(query).stream()
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
