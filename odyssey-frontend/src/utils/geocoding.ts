const GEOAPIFY_API_KEY = import.meta.env.VITE_GEOAPIFY_API_KEY;

if (!GEOAPIFY_API_KEY) {
  console.error('VITE_GEOAPIFY_API_KEY is not set in environment variables. Please add it to your .env file.');
}

export interface GeoapifyLocation {
  formatted: string;
  lat: number;
  lon: number;
  country?: string;
  city?: string;
  state?: string;
  place_id?: string;
}

export interface LocationSuggestion {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  city?: string;
  placeName: string;
}

/**
 * Get autocomplete suggestions using Geoapify Autocomplete API
 */
export const getLocationSuggestions = async (query: string): Promise<LocationSuggestion[]> => {
  if (!GEOAPIFY_API_KEY) {
    console.error('Geoapify API key is not set');
    return [];
  }

  if (!query || query.length < 3) {
    return [];
  }

  console.log('Searching for:', query); // Debug log

  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=8&apiKey=${GEOAPIFY_API_KEY}`
    );

    console.log('API Response status:', response.status); // Debug log

    if (!response.ok) {
      throw new Error(`Geoapify API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('API Response data:', data); // Debug log
    
    if (!data.features || !Array.isArray(data.features)) {
      console.log('No features in response'); // Debug log
      return [];
    }

    // Filter and deduplicate results
    const seenLocations = new Set<string>();
    const uniqueResults: LocationSuggestion[] = [];

    for (const feature of data.features) {
      const props = feature.properties;
      
      // Create a clean, readable name
      let cleanName = '';
      if (props.name && props.city && props.country) {
        cleanName = `${props.name}, ${props.city}, ${props.country}`;
      } else if (props.city && props.country) {
        cleanName = `${props.city}, ${props.country}`;
      } else if (props.name && props.country) {
        cleanName = `${props.name}, ${props.country}`;
      } else if (props.formatted) {
        // Remove postal codes and excessive details
        cleanName = props.formatted
          .replace(/,?\s*\d{5,}/g, '') // Remove postal codes
          .replace(/,\s*,/g, ',') // Remove double commas
          .trim();
      } else {
        cleanName = props.name || query;
      }

      // Skip if we've already seen this location (deduplicate)
      const locationKey = `${props.name}-${props.city}-${props.country}`;
      if (seenLocations.has(locationKey)) {
        continue;
      }
      seenLocations.add(locationKey);

      uniqueResults.push({
        name: cleanName,
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        country: props.country,
        city: props.city || props.town || props.village,
        placeName: cleanName
      });

      // Limit to 5 unique results
      if (uniqueResults.length >= 5) {
        break;
      }
    }

    console.log('Returning suggestions:', uniqueResults); // Debug log
    return uniqueResults;
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return [];
  }
};

/**
 * Get precise coordinates for a location using Geoapify Geocoding API
 */
export const getCoordinatesFromPlaceName = async (placeName: string) => {
  if (!GEOAPIFY_API_KEY) {
    console.error('Geoapify API key is not set');
    return null;
  }

  if (!placeName || placeName.trim().length === 0) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(placeName)}&limit=1&apiKey=${GEOAPIFY_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Geoapify API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      console.warn('No coordinates found for:', placeName);
      return null;
    }

    const feature = data.features[0];
    const coordinates = feature.geometry.coordinates; // [lon, lat] in GeoJSON format

    return {
      latitude: coordinates[1],
      longitude: coordinates[0],
      placeName: feature.properties.formatted || placeName,
      country: feature.properties.country,
      city: feature.properties.city || feature.properties.town || feature.properties.village
    };
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}; 