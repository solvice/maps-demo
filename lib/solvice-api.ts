import { Coordinates, isValidCoordinates } from './coordinates';

// Response format matches Solvice API OpenAPI spec (RouteDto schema)
export interface RouteResponse {
  routes: {
    distance?: number;
    duration?: number;
    geometry?: string;
    legs?: {
      summary?: string;
      distance?: number;
      duration?: number;
      weight?: number;
      steps?: unknown[];
    }[];
    weight_name?: string;
    weight?: number;
  }[];
  waypoints: {
    hint?: string;
    distance?: number;
    name?: string;
    location: [number, number];
  }[];
}

export interface CreateRouteOptions {
  bearings?: number[][];
  radiuses?: number[];
  hints?: string[];
  generate_hints?: boolean;
  alternatives?: number;
  steps?: boolean;
  annotations?: string[];
  geometries?: 'polyline' | 'geojson' | 'polyline6';
  overview?: 'full' | 'simplified' | 'false';
  continue_straight?: boolean;
  approaches?: string[];
  waypoints?: number[];
  snapping?: 'default' | 'any';
  vehicleType?: 'CAR' | 'BIKE' | 'TRUCK' | 'ELECTRIC_CAR' | 'ELECTRIC_BIKE';
  routingEngine?: 'OSM' | 'TOMTOM' | 'GOOGLE' | 'ANYMAP';
  departureTime?: string;
  interpolate?: boolean;
}

export async function calculateRoute(
  origin: Coordinates,
  destination: Coordinates,
  options?: CreateRouteOptions
): Promise<RouteResponse> {
  // Validate coordinates before making API call
  if (!isValidCoordinates(origin)) {
    throw new Error('Invalid coordinates');
  }
  
  if (!isValidCoordinates(destination)) {
    throw new Error('Invalid coordinates');
  }

  try {
    // Call our secure server API endpoint
    const response = await fetch('/api/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coordinates: [origin, destination],
        overview: 'full',
        ...options
      })
    });

    if (!response.ok) {
      // Handle specific HTTP status codes
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || `Route calculation failed: ${response.status} ${response.statusText}`;
      } catch {
        errorMessage = `Route calculation failed: ${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    let data: RouteResponse;
    try {
      data = await response.json();
    } catch {
      throw new Error('Failed to parse route response - invalid JSON');
    }

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid route response format');
    }
    
    if (!data.routes || !Array.isArray(data.routes) || data.routes.length === 0) {
      throw new Error('No routes found for the given coordinates');
    }

    return data;
  } catch (error) {
    // Re-throw known errors as-is
    if (error instanceof Error) {
      // Network errors (fetch failures)
      if (error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
      }
      
      // Already formatted errors
      if (error.message.startsWith('Route calculation failed:') || 
          error.message.startsWith('Invalid coordinates') ||
          error.message.startsWith('Rate limit exceeded') ||
          error.message.startsWith('Failed to parse route response') ||
          error.message.startsWith('No routes found') ||
          error.message.startsWith('Network error') ||
          error.message.startsWith('Invalid route response')) {
        throw error;
      }
      
      // Wrap unknown errors
      throw new Error(`Route calculation failed: ${error.message}`);
    }
    
    // Fallback for non-Error objects
    throw new Error('Route calculation failed: Unknown error');
  }
}