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
  // Validate coordinates
  if (!isValidCoordinates(origin)) {
    throw new Error('Invalid origin coordinates');
  }
  
  if (!isValidCoordinates(destination)) {
    throw new Error('Invalid destination coordinates');
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
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || `Server error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    let data: RouteResponse;
    try {
      data = await response.json();
    } catch (error) {
      throw new Error('Failed to parse route response');
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes found');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith('Server error:') || 
          error.message.startsWith('Failed to parse route response') ||
          error.message === 'No routes found' ||
          error.message.includes('Route calculation')) {
        throw error;
      }
      throw new Error(`Failed to calculate route: ${error.message}`);
    }
    throw new Error('Failed to calculate route: Unknown error');
  }
}