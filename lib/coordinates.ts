/**
 * Coordinate management utilities
 * Handles conversion between different coordinate formats and validation
 */

export type Coordinates = [number, number]; // [longitude, latitude]
export type LatLng = [number, number]; // [latitude, longitude]

export interface CoordinatePoint {
  longitude: number;
  latitude: number;
}

/**
 * Validates if coordinates are within valid ranges
 * Longitude: -180 to 180
 * Latitude: -90 to 90
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  // Must be an array with exactly 2 elements
  if (!Array.isArray(coords) || coords.length !== 2) {
    return false;
  }
  
  const [longitude, latitude] = coords;
  return (
    typeof longitude === 'number' &&
    typeof latitude === 'number' &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90 &&
    !isNaN(longitude) &&
    !isNaN(latitude)
  );
}

/**
 * Converts longitude-latitude to latitude-longitude format
 */
export function lonLatToLatLng(coords: Coordinates): LatLng {
  const [longitude, latitude] = coords;
  return [latitude, longitude];
}

/**
 * Converts latitude-longitude to longitude-latitude format
 */
export function latLngToLonLat(coords: LatLng): Coordinates {
  const [latitude, longitude] = coords;
  return [longitude, latitude];
}

/**
 * Converts coordinates to CoordinatePoint object
 */
export function coordinatesToPoint(coords: Coordinates): CoordinatePoint {
  const [longitude, latitude] = coords;
  return { longitude, latitude };
}

/**
 * Converts CoordinatePoint object to coordinates array
 */
export function pointToCoordinates(point: CoordinatePoint): Coordinates {
  return [point.longitude, point.latitude];
}

/**
 * Formats coordinates for display (with specified decimal places)
 */
export function formatCoordinates(coords: Coordinates, decimals: number = 6): string {
  const [longitude, latitude] = coords;
  return `${latitude.toFixed(decimals)}, ${longitude.toFixed(decimals)}`;
}

/**
 * Calculates the distance between two coordinate points using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;
  
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Finds the closest coordinate from an array to a target coordinate
 */
export function findClosestCoordinate(
  target: Coordinates,
  coordinates: Coordinates[]
): { coordinate: Coordinates; index: number; distance: number } | null {
  if (coordinates.length === 0) return null;

  let closestIndex = 0;
  let closestDistance = calculateDistance(target, coordinates[0]);

  for (let i = 1; i < coordinates.length; i++) {
    const distance = calculateDistance(target, coordinates[i]);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = i;
    }
  }

  return {
    coordinate: coordinates[closestIndex],
    index: closestIndex,
    distance: closestDistance,
  };
}

/**
 * Ghent coordinates as fallback
 */
export const GHENT_COORDINATES: Coordinates = [3.7174, 51.0543];

/**
 * Default zoom levels for different map contexts
 */
export const DEFAULT_ZOOM = {
  CITY: 12,
  STREET: 16,
  BUILDING: 18,
} as const;