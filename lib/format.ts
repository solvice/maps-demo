/**
 * Utility functions for formatting distance and duration
 */

/**
 * Format distance from meters to kilometers
 */
export function formatDistance(distanceInMeters: number): string {
  const kilometers = distanceInMeters / 1000;
  return `${kilometers.toFixed(1)} km`;
}

/**
 * Format duration from seconds to human readable format
 */
export function formatDuration(durationInSeconds: number): string {
  const minutes = Math.round(durationInSeconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}min`;
}