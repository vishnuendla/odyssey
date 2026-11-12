import { locationApi } from '@/services/api';
import type { GeocodingResult } from '@/types';

export interface LocationSuggestion {
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  city?: string;
  placeName: string;
}

/**
 * Geoapify is proxied by the backend so the API key never ships in the bundle.
 * The endpoint returns already-normalised results.
 */
const cleanName = (result: GeocodingResult): string => {
  if (!result.formatted) {
    return [result.city, result.country].filter(Boolean).join(', ');
  }
  return result.formatted
    .replace(/,?\s*\d{5,}/g, '')
    .replace(/,\s*,/g, ',')
    .trim();
};

export const getLocationSuggestions = async (query: string): Promise<LocationSuggestion[]> => {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    const results = await locationApi.autocomplete(query, 8);
    const seen = new Set<string>();
    const suggestions: LocationSuggestion[] = [];

    for (const result of results) {
      const name = cleanName(result);
      if (!name) {
        continue;
      }
      const key = `${result.city ?? ''}-${result.country ?? ''}-${name}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      suggestions.push({
        name,
        latitude: result.latitude,
        longitude: result.longitude,
        country: result.country,
        city: result.city,
        placeName: name,
      });

      if (suggestions.length >= 5) {
        break;
      }
    }

    return suggestions;
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    return [];
  }
};

export const getCoordinatesFromPlaceName = async (placeName: string) => {
  if (!placeName || placeName.trim().length === 0) {
    return null;
  }

  try {
    const results = await locationApi.geocode(placeName, 1);
    const result = results[0];
    if (!result) {
      console.warn('No coordinates found for:', placeName);
      return null;
    }

    return {
      latitude: result.latitude,
      longitude: result.longitude,
      placeName: result.formatted || placeName,
      country: result.country,
      city: result.city,
    };
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
};

export const debounce = <T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
