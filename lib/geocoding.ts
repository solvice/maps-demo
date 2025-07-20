import { Coordinates, isValidCoordinates } from './coordinates';

// For now, we'll use a simple mock geocoding service
// In a real implementation, this would use a service like Nominatim, Google Geocoding API, etc.

interface GeocodingResult {
  coordinates: Coordinates;
  address: string;
  confidence: number;
}

/**
 * Convert coordinates to a human-readable address (reverse geocoding)
 */
export async function reverseGeocode(coordinates: Coordinates): Promise<string> {
  if (!isValidCoordinates(coordinates)) {
    throw new Error('Invalid coordinates provided');
  }

  try {
    // For now, return a mock address based on known coordinates
    // In production, this would call a real geocoding service
    const [lng, lat] = coordinates;
    
    // Mock some known locations
    if (Math.abs(lng - 4.3517) < 0.01 && Math.abs(lat - 50.8503) < 0.01) {
      return 'Brussels, Belgium';
    }
    if (Math.abs(lng - 4.4025) < 0.01 && Math.abs(lat - 51.2194) < 0.01) {
      return 'Antwerp, Belgium';
    }
    if (Math.abs(lng - 3.7174) < 0.01 && Math.abs(lat - 51.0543) < 0.01) {
      return 'Ghent, Belgium';
    }
    
    // Fallback to coordinate display
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    // Fallback to coordinate display
    const [lng, lat] = coordinates;
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
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
    // For now, return mock coordinates based on known addresses
    // In production, this would call a real geocoding service
    const normalizedAddress = address.toLowerCase().trim();
    
    // Mock some known addresses
    if (normalizedAddress.includes('brussels')) {
      return [4.3517, 50.8503];
    }
    if (normalizedAddress.includes('antwerp')) {
      return [4.4025, 51.2194];
    }
    if (normalizedAddress.includes('ghent')) {
      return [3.7174, 51.0543];
    }
    
    // Try to parse coordinate string (lat, lng format)
    const coordMatch = normalizedAddress.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (isValidCoordinates([lng, lat])) {
        return [lng, lat];
      }
    }
    
    throw new Error('Address not found');
  } catch (error) {
    console.error('Forward geocoding failed:', error);
    throw error;
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
    // Simulate potential service failure for testing
    if (query.toLowerCase().includes('failservice')) {
      throw new Error('Geocoding service unavailable');
    }

    // For now, return mock search results
    // In production, this would call a real geocoding service with search/autocomplete
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
  } catch (error) {
    console.error('Address search failed:', error);
    if (error instanceof Error && error.message === 'Geocoding service unavailable') {
      throw error; // Re-throw service errors for proper handling
    }
    return [];
  }
}