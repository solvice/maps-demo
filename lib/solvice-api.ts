import { Coordinates, isValidCoordinates } from './coordinates';
import { RoutePoint, RoutePointManager } from './route-points';

// Response format matches Solvice API OpenAPI spec (RouteDto schema)
export interface StepManeuver {
  location: [number, number];
  bearing_before: number;
  bearing_after: number;
  type: string;
  modifier?: string;
}

export interface Intersection {
  location: [number, number];
  bearings: number[];
  classes: string[];
  entry: string[];
  in?: number;
  out?: number;
}

export interface RouteStep {
  distance: number;
  duration: number;
  geometry: string;
  weight: number;
  name: string;
  ref?: string;
  pronunciation?: string;
  destinations?: string;
  exits?: string;
  mode: string;
  maneuver: StepManeuver;
  intersections: Intersection[];
  rotary_name?: string;
  rotary_pronunciation?: string;
}

export interface Annotation {
  distance: number[];
  duration: number[];
  datasources: number[];
  nodes: number[];
  weight: number[];
  speed: number[];
}

export interface RouteLeg {
  distance: number;
  duration: number;
  weight: number;
  summary: string;
  steps: RouteStep[];
  annotation: Annotation;
}

export interface Route {
  distance: number;
  duration: number;
  geometry?: string;
  weight: number;
  weight_name: string;
  legs: RouteLeg[];
}

export interface Waypoint {
  distance: number;
  name: string;
  location: [number, number];
  hint: string;
}

export interface RouteResponse {
  code: string;
  routes: Route[];
  waypoints: Waypoint[];
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

/**
 * Calculate route for multiple points (supports both legacy and multi-waypoint)
 * @param routePoints Array of route points or legacy origin/destination coordinates
 * @param options Route calculation options
 * @returns Promise<RouteResponse>
 */
export async function calculateRoute(
  routePoints: RoutePoint[] | [Coordinates, Coordinates],
  options?: CreateRouteOptions
): Promise<RouteResponse> {
  let coordinates: Coordinates[];
  
  // Handle both legacy format and new RoutePoint array
  if (Array.isArray(routePoints) && routePoints.length >= 2) {
    if (typeof routePoints[0] === 'object' && 'type' in routePoints[0]) {
      // New format: RoutePoint array
      const points = routePoints as RoutePoint[];
      coordinates = RoutePointManager.getCoordinatesArray(points);
      
      // Validate each coordinate
      for (let i = 0; i < coordinates.length; i++) {
        if (!isValidCoordinates(coordinates[i])) {
          throw new Error(`Invalid coordinates at position ${i + 1}`);
        }
      }
    } else {
      // Legacy format: [origin, destination]
      const [origin, destination] = routePoints as [Coordinates, Coordinates];
      
      // Validate coordinates before making API call
      if (!isValidCoordinates(origin)) {
        throw new Error('Invalid origin coordinates');
      }
      
      if (!isValidCoordinates(destination)) {
        throw new Error('Invalid destination coordinates');
      }
      
      coordinates = [origin, destination];
    }
  } else {
    throw new Error('At least 2 route points are required');
  }

  try {
    console.log('Calculating route for coordinates:', coordinates);
    
    // Call our secure server API endpoint
    const response = await fetch('/api/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coordinates,
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

/**
 * Calculate multi-waypoint route (new API for multi-stop routing)
 * @param routePoints Array of RoutePoint objects
 * @param options Route calculation options
 * @returns Promise<RouteResponse>
 */
export async function calculateMultiWaypointRoute(
  routePoints: RoutePoint[],
  options?: CreateRouteOptions
): Promise<RouteResponse> {
  if (!routePoints || routePoints.length < 2) {
    throw new Error('At least 2 route points are required for multi-waypoint routing');
  }

  if (!RoutePointManager.hasMinimumPoints(routePoints)) {
    throw new Error('Route must have at least 2 points');
  }

  const coordinates = RoutePointManager.getCoordinatesArray(routePoints);
  
  // Validate each coordinate
  for (let i = 0; i < coordinates.length; i++) {
    if (!isValidCoordinates(coordinates[i])) {
      const point = routePoints[i];
      throw new Error(`Invalid coordinates for ${point.type} at position ${i + 1}: [${coordinates[i].join(', ')}]`);
    }
  }

  console.log('Calculating multi-waypoint route:', {
    points: routePoints.length,
    coordinates: coordinates.map(c => `[${c[0].toFixed(4)}, ${c[1].toFixed(4)}]`).join(' → '),
    types: routePoints.map(p => p.type).join(' → ')
  });

  try {
    // Call our secure server API endpoint
    const response = await fetch('/api/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coordinates,
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
        errorMessage = errorData.error || errorData.message || `Multi-waypoint route calculation failed: ${response.status} ${response.statusText}`;
      } catch {
        errorMessage = `Multi-waypoint route calculation failed: ${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    let data: RouteResponse;
    try {
      data = await response.json();
    } catch {
      throw new Error('Failed to parse multi-waypoint route response - invalid JSON');
    }

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid multi-waypoint route response format');
    }
    
    if (!data.routes || !Array.isArray(data.routes) || data.routes.length === 0) {
      throw new Error('No routes found for the given waypoints');
    }

    console.log('Multi-waypoint route calculation successful:', {
      routes: data.routes.length,
      distance: data.routes[0].distance ? `${(data.routes[0].distance / 1000).toFixed(2)}km` : 'unknown',
      duration: data.routes[0].duration ? `${Math.round(data.routes[0].duration / 60)}min` : 'unknown'
    });

    return data;
  } catch (error) {
    // Re-throw known errors as-is
    if (error instanceof Error) {
      // Network errors (fetch failures)
      if (error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
      }
      
      // Already formatted errors
      if (error.message.startsWith('Multi-waypoint route calculation failed:') || 
          error.message.startsWith('Invalid coordinates') ||
          error.message.startsWith('Route must have') ||
          error.message.startsWith('At least 2 route points') ||
          error.message.startsWith('Rate limit exceeded') ||
          error.message.startsWith('Failed to parse multi-waypoint') ||
          error.message.startsWith('No routes found') ||
          error.message.startsWith('Network error') ||
          error.message.startsWith('Invalid multi-waypoint route response')) {
        throw error;
      }
      
      // Wrap unknown errors
      throw new Error(`Multi-waypoint route calculation failed: ${error.message}`);
    }
    
    // Fallback for non-Error objects
    throw new Error('Multi-waypoint route calculation failed: Unknown error');
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use calculateRoute or calculateMultiWaypointRoute instead
 */
export async function calculateLegacyRoute(
  origin: Coordinates,
  destination: Coordinates,
  options?: CreateRouteOptions
): Promise<RouteResponse> {
  return calculateRoute([origin, destination], options);
}