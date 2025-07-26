/**
 * RoutePoint interface and utility functions for multi-waypoint routing
 */

import { Coordinates } from './coordinates';

export interface RoutePoint {
  id: string;                    // Unique ID for React keys
  coordinates: Coordinates;      // [lng, lat]
  type: 'origin' | 'waypoint' | 'destination';
  address?: string;              // Geocoded address
}

/**
 * Helper function to get origin from route points array
 */
export function getOrigin(routePoints: RoutePoint[]): RoutePoint | undefined {
  return routePoints.find(p => p.type === 'origin');
}

/**
 * Helper function to get destination from route points array
 */
export function getDestination(routePoints: RoutePoint[]): RoutePoint | undefined {
  return routePoints.find(p => p.type === 'destination');
}

/**
 * Helper function to get waypoints from route points array
 */
export function getWaypoints(routePoints: RoutePoint[]): RoutePoint[] {
  return routePoints.filter(p => p.type === 'waypoint');
}

/**
 * Helper function to get all coordinates in order (origin -> waypoints -> destination)
 */
export function getCoordinatesInOrder(routePoints: RoutePoint[]): Coordinates[] {
  const origin = getOrigin(routePoints);
  const destination = getDestination(routePoints);
  const waypoints = getWaypoints(routePoints);
  
  const result: Coordinates[] = [];
  
  if (origin) {
    result.push(origin.coordinates);
  }
  
  // Add waypoints in order
  waypoints.forEach(waypoint => {
    result.push(waypoint.coordinates);
  });
  
  if (destination) {
    result.push(destination.coordinates);
  }
  
  return result;
}

/**
 * Helper function to add a waypoint before the destination
 */
export function insertWaypoint(
  routePoints: RoutePoint[], 
  coordinates: Coordinates, 
  address?: string
): RoutePoint[] {
  const newWaypoint: RoutePoint = {
    id: `waypoint-${Date.now()}`,
    coordinates,
    type: 'waypoint',
    address,
  };
  
  const origin = routePoints.find(p => p.type === 'origin');
  const destination = routePoints.find(p => p.type === 'destination');
  const waypoints = routePoints.filter(p => p.type === 'waypoint');
  
  // Insert waypoint before destination
  return [
    ...(origin ? [origin] : []),
    ...waypoints,
    newWaypoint,
    ...(destination ? [destination] : [])
  ];
}

/**
 * Helper function to remove a waypoint by ID
 */
export function removeWaypoint(routePoints: RoutePoint[], waypointId: string): RoutePoint[] {
  return routePoints.filter(p => p.id !== waypointId);
}

/**
 * Helper function to update a route point by ID
 */
export function updateRoutePoint(
  routePoints: RoutePoint[], 
  pointId: string, 
  updates: Partial<Omit<RoutePoint, 'id'>>
): RoutePoint[] {
  return routePoints.map(point => 
    point.id === pointId 
      ? { ...point, ...updates }
      : point
  );
}

/**
 * Helper function to set origin, clearing any existing origin
 */
export function setOrigin(
  routePoints: RoutePoint[], 
  coordinates: Coordinates, 
  address?: string
): RoutePoint[] {
  const newOrigin: RoutePoint = {
    id: 'origin',
    coordinates,
    type: 'origin',
    address,
  };
  
  // Remove any existing origin and add new one at the beginning
  const withoutOrigin = routePoints.filter(p => p.type !== 'origin');
  return [newOrigin, ...withoutOrigin];
}

/**
 * Helper function to set destination, clearing any existing destination
 */
export function setDestination(
  routePoints: RoutePoint[], 
  coordinates: Coordinates, 
  address?: string
): RoutePoint[] {
  const newDestination: RoutePoint = {
    id: 'destination',
    coordinates,
    type: 'destination',
    address,
  };
  
  // Remove any existing destination and add new one at the end
  const withoutDestination = routePoints.filter(p => p.type !== 'destination');
  return [...withoutDestination, newDestination];
}

/**
 * Helper function to check if route points are sufficient for calculation (minimum 2 points)
 */
export function isRouteCalculable(routePoints: RoutePoint[]): boolean {
  return routePoints.length >= 2;
}

/**
 * Helper function to get marker color based on point type
 */
export function getPointColor(type: RoutePoint['type']): string {
  switch (type) {
    case 'origin': return 'bg-green-500';
    case 'destination': return 'bg-red-500';
    case 'waypoint': return 'bg-blue-500';
  }
}

/**
 * Helper function to get marker content based on point type and index
 */
export function getMarkerContent(
  type: RoutePoint['type'], 
  waypointIndex?: number
): string {
  switch (type) {
    case 'origin': return 'A';
    case 'destination': return 'B';
    case 'waypoint': return waypointIndex !== undefined ? (waypointIndex + 1).toString() : '•';
  }
}