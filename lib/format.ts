/**
 * Utility functions for formatting distance, duration, speed, coordinates, and percentages
 */

/**
 * Format distance from meters to kilometers
 * @param distanceInMeters - Distance in meters
 * @returns Formatted distance string (e.g., "1.5 km")
 */
export function formatDistance(distanceInMeters: number): string {
  // Handle null/undefined inputs gracefully
  if (distanceInMeters == null || !isFinite(distanceInMeters)) {
    return '0.0 km';
  }

  const kilometers = distanceInMeters / 1000;
  return `${kilometers.toFixed(1)} km`;
}

/**
 * Format duration from seconds to human readable format
 * @param durationInSeconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1h 30min" or "45 min")
 */
export function formatDuration(durationInSeconds: number): string {
  // Handle null/undefined inputs gracefully
  if (durationInSeconds == null || !isFinite(durationInSeconds)) {
    return '0 min';
  }

  const minutes = Math.round(durationInSeconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
}

/**
 * Format speed from m/s to km/h
 * @param speedInMps - Speed in meters per second
 * @returns Formatted speed string (e.g., "65.2 km/h")
 */
export function formatSpeed(speedInMps: number): string {
  // Handle null/undefined inputs gracefully
  if (speedInMps == null || !isFinite(speedInMps)) {
    return '0.0 km/h';
  }

  const speedInKmh = speedInMps * 3.6;
  return `${speedInKmh.toFixed(1)} km/h`;
}

/**
 * Format coordinates for display
 * @param coordinates - [longitude, latitude] array
 * @returns Formatted coordinates string (e.g., "4.3517°, 50.8503°")
 */
export function formatCoordinates(coordinates: [number, number]): string {
  // Handle null/undefined inputs gracefully
  if (!coordinates || coordinates.length !== 2 || !isFinite(coordinates[0]) || !isFinite(coordinates[1])) {
    return '0.0000°, 0.0000°';
  }

  const [lng, lat] = coordinates;
  return `${lng.toFixed(4)}°, ${lat.toFixed(4)}°`;
}

/**
 * Format percentage for efficiency calculations
 * @param percentage - Percentage value (0-100)
 * @returns Formatted percentage string (e.g., "85.2%")
 */
export function formatPercentage(percentage: number): string {
  // Handle null/undefined inputs gracefully
  if (percentage == null || !isFinite(percentage)) {
    return '0.0%';
  }

  return `${percentage.toFixed(1)}%`;
}