import { Coordinates, isValidCoordinates } from './coordinates';

interface GeocodingResult {
  coordinates: Coordinates;
  address: string;
  confidence: number;
  placeId?: string;
}

/**
 * Convert coordinates to a human-readable address (reverse geocoding)
 */
export async function reverseGeocode(coordinates: Coordinates): Promise<string> {
  if (!isValidCoordinates(coordinates)) {
    throw new Error('Invalid coordinates provided');
  }

  try {
    const [lng, lat] = coordinates;
    const result = await reverseGeocodeCoordinates(coordinates);
    return result || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    // Fallback to coordinate display
    const [lng, lat] = coordinates;
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

/**
 * Google Geocoding API reverse geocoding implementation
 */
export async function reverseGeocodeCoordinates(coordinates: Coordinates): Promise<string | null> {
  if (!coordinates || !Array.isArray(coordinates)) {
    throw new Error('Coordinates are required');
  }
  
  if (coordinates.length !== 2) {
    throw new Error('Coordinates must be an array of [lng, lat]');
  }

  if (!isValidCoordinates(coordinates)) {
    const [lng, lat] = coordinates;
    if (lng < -180 || lng > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }
    if (lat < -90 || lat > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }
    throw new Error('Coordinates must be an array of [lng, lat]');
  }

  try {
    const response = await fetch('/api/geocoding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'reverse',
        coordinates
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reverse geocode coordinates');
    }

    const data = await response.json();
    return data.address;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred during reverse geocoding');
  }
}

/**
 * Enhanced reverse geocoding with error handling (used by hooks)
 */
export async function getAddressFromCoordinates(coordinates: Coordinates): Promise<string | null> {
  try {
    // Validate coordinates first
    if (!isValidCoordinates(coordinates)) {
      return null;
    }
    return await reverseGeocode(coordinates);
  } catch (error) {
    console.error('Failed to get address from coordinates:', error);
    return null;
  }
}

/**
 * Convert an address to coordinates (forward geocoding)
 */
export async function forwardGeocode(address: string): Promise<Coordinates> {
  if (!address || address.trim().length === 0) {
    throw new Error('Address cannot be empty');
  }

  try {
    const result = await geocodeAddress(address);
    if (result) {
      return result;
    }
    throw new Error('Address not found');
  } catch (error) {
    console.error('Forward geocoding failed:', error);
    throw error;
  }
}

/**
 * Google Geocoding API forward geocoding implementation
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  if (!address || typeof address !== 'string' || address.trim().length === 0) {
    throw new Error('Address is required');
  }

  try {
    const response = await fetch('/api/geocoding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'forward',
        query: address.trim()
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to geocode address');
    }

    const data = await response.json();
    return data.coordinates;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred during geocoding');
  }
}

/**
 * Enhanced forward geocoding with error handling (used by hooks)
 */
export async function getCoordinatesFromAddress(address: string): Promise<Coordinates | null> {
  try {
    return await forwardGeocode(address);
  } catch (error) {
    console.error('Failed to get coordinates from address:', error);
    return null;
  }
}

/**
 * Search for addresses with partial matching (for autocomplete)
 */
export async function searchAddresses(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    const response = await fetch('/api/geocoding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'autocomplete',
        query: query.trim()
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to search addresses');
    }

    const data = await response.json();
    return data.predictions || [];
  } catch (error) {
    console.error('Address search failed:', error);
    
    // Fallback to mock data if Google API fails
    console.log('Falling back to mock geocoding data');
    const normalizedQuery = query.toLowerCase().trim();
    const results: GeocodingResult[] = [];
    
    if (normalizedQuery.includes('bru') || 'brussels'.includes(normalizedQuery)) {
      results.push({
        coordinates: [4.3517, 50.8503],
        address: 'Brussels, Belgium',
        confidence: 0.9
      });
    }
    
    if (normalizedQuery.includes('ant') || 'antwerp'.includes(normalizedQuery)) {
      results.push({
        coordinates: [4.4025, 51.2194],
        address: 'Antwerp, Belgium',
        confidence: 0.85
      });
    }
    
    if (normalizedQuery.includes('ghe') || 'ghent'.includes(normalizedQuery)) {
      results.push({
        coordinates: [3.7174, 51.0543],
        address: 'Ghent, Belgium',
        confidence: 0.8
      });
    }
    
    return results.sort((a, b) => b.confidence - a.confidence);
  }
}