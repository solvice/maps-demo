/**
 * Route Points Management
 * 
 * This module defines the data structures and helper functions for managing
 * multi-waypoint routes in the Solvice Maps demo application.
 */

import { Coordinates } from './coordinates';

/**
 * Represents a single point in a route (origin, waypoint, or destination)
 */
export interface RoutePoint {
  /** Unique identifier for React keys and state management */
  id: string;
  /** Geographic coordinates [longitude, latitude] */
  coordinates: Coordinates;
  /** Type of point in the route */
  type: 'origin' | 'waypoint' | 'destination';
  /** Human-readable address (optional, obtained via geocoding) */
  address?: string;
}

/**
 * Helper functions for route point management
 */
export class RoutePointManager {
  /**
   * Find the origin point in a route
   */
  static getOrigin(routePoints: RoutePoint[]): RoutePoint | undefined {
    return routePoints.find(point => point.type === 'origin');
  }

  /**
   * Find the destination point in a route
   */
  static getDestination(routePoints: RoutePoint[]): RoutePoint | undefined {
    return routePoints.find(point => point.type === 'destination');
  }

  /**
   * Get all waypoints in order
   */
  static getWaypoints(routePoints: RoutePoint[]): RoutePoint[] {
    return routePoints.filter(point => point.type === 'waypoint');
  }

  /**
   * Get all coordinates in route order for API calls
   */
  static getCoordinatesArray(routePoints: RoutePoint[]): Coordinates[] {
    return routePoints.map(point => point.coordinates);
  }

  /**
   * Check if route has minimum points needed for calculation
   */
  static hasMinimumPoints(routePoints: RoutePoint[]): boolean {
    return routePoints.length >= 2;
  }

  /**
   * Check if route has both origin and destination
   */
  static hasOriginAndDestination(routePoints: RoutePoint[]): boolean {
    const hasOrigin = routePoints.some(point => point.type === 'origin');
    const hasDestination = routePoints.some(point => point.type === 'destination');
    return hasOrigin && hasDestination;
  }

  /**
   * Create a new origin point
   */
  static createOrigin(coordinates: Coordinates, address?: string): RoutePoint {
    return {
      id: 'origin',
      coordinates,
      type: 'origin',
      address,
    };
  }

  /**
   * Create a new destination point
   */
  static createDestination(coordinates: Coordinates, address?: string): RoutePoint {
    return {
      id: 'destination',
      coordinates,
      type: 'destination',
      address,
    };
  }

  /**
   * Create a new waypoint with unique ID
   */
  static createWaypoint(coordinates: Coordinates, address?: string): RoutePoint {
    return {
      id: `waypoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      coordinates,
      type: 'waypoint',
      address,
    };
  }

  /**
   * Add a waypoint before the destination (or at the end if no destination)
   */
  static addWaypoint(
    routePoints: RoutePoint[], 
    coordinates: Coordinates, 
    address?: string
  ): RoutePoint[] {
    const newWaypoint = this.createWaypoint(coordinates, address);
    
    // Find destination index
    const destinationIndex = routePoints.findIndex(point => point.type === 'destination');
    
    if (destinationIndex === -1) {
      // No destination, add waypoint at the end
      return [...routePoints, newWaypoint];
    } else {
      // Insert waypoint before destination
      const newPoints = [...routePoints];
      newPoints.splice(destinationIndex, 0, newWaypoint);
      return newPoints;
    }
  }

  /**
   * Remove a point by ID
   */
  static removePoint(routePoints: RoutePoint[], pointId: string): RoutePoint[] {
    return routePoints.filter(point => point.id !== pointId);
  }

  /**
   * Update a point's coordinates and optionally its address
   */
  static updatePoint(
    routePoints: RoutePoint[], 
    pointId: string, 
    coordinates: Coordinates, 
    address?: string
  ): RoutePoint[] {
    return routePoints.map(point => 
      point.id === pointId 
        ? { ...point, coordinates, address: address ?? point.address }
        : point
    );
  }

  /**
   * Set the origin point, replacing any existing origin
   */
  static setOrigin(
    routePoints: RoutePoint[], 
    coordinates: Coordinates, 
    address?: string
  ): RoutePoint[] {
    const withoutOrigin = routePoints.filter(point => point.type !== 'origin');
    const newOrigin = this.createOrigin(coordinates, address);
    
    // Insert origin at the beginning
    return [newOrigin, ...withoutOrigin];
  }

  /**
   * Set the destination point, replacing any existing destination
   */
  static setDestination(
    routePoints: RoutePoint[], 
    coordinates: Coordinates, 
    address?: string
  ): RoutePoint[] {
    const withoutDestination = routePoints.filter(point => point.type !== 'destination');
    const newDestination = this.createDestination(coordinates, address);
    
    // Add destination at the end
    return [...withoutDestination, newDestination];
  }

  /**
   * Clear all route points
   */
  static clearAll(): RoutePoint[] {
    return [];
  }

  /**
   * Get route point statistics
   */
  static getStats(routePoints: RoutePoint[]) {
    const waypoints = this.getWaypoints(routePoints);
    const hasOrigin = this.getOrigin(routePoints) !== undefined;
    const hasDestination = this.getDestination(routePoints) !== undefined;
    
    return {
      total: routePoints.length,
      waypoints: waypoints.length,
      hasOrigin,
      hasDestination,
      isValid: this.hasMinimumPoints(routePoints),
      isComplete: hasOrigin && hasDestination,
    };
  }

  /**
   * Convert legacy origin/destination to route points array
   */
  static fromLegacyPoints(
    origin: Coordinates | null, 
    destination: Coordinates | null,
    originAddress?: string,
    destinationAddress?: string
  ): RoutePoint[] {
    const points: RoutePoint[] = [];
    
    if (origin) {
      points.push(this.createOrigin(origin, originAddress));
    }
    
    if (destination) {
      points.push(this.createDestination(destination, destinationAddress));
    }
    
    return points;
  }

  /**
   * Convert route points back to legacy format (for backward compatibility)
   */
  static toLegacyPoints(routePoints: RoutePoint[]): {
    origin: Coordinates | null;
    destination: Coordinates | null;
    originAddress?: string;
    destinationAddress?: string;
  } {
    const origin = this.getOrigin(routePoints);
    const destination = this.getDestination(routePoints);
    
    return {
      origin: origin?.coordinates || null,
      destination: destination?.coordinates || null,
      originAddress: origin?.address,
      destinationAddress: destination?.address,
    };
  }
}

/**
 * Validation functions
 */
export const RoutePointValidation = {
  /**
   * Validate a route point object
   */
  isValidRoutePoint(point: unknown): point is RoutePoint {
    if (typeof point !== 'object' || point === null) {
      return false;
    }
    
    const p = point as Record<string, unknown>;
    
    return (
      typeof p.id === 'string' &&
      Array.isArray(p.coordinates) &&
      p.coordinates.length === 2 &&
      typeof p.coordinates[0] === 'number' &&
      typeof p.coordinates[1] === 'number' &&
      ['origin', 'waypoint', 'destination'].includes(p.type as string) &&
      (p.address === undefined || typeof p.address === 'string')
    );
  },

  /**
   * Validate an array of route points
   */
  isValidRoutePointArray(points: unknown): points is RoutePoint[] {
    return (
      Array.isArray(points) &&
      points.every(point => this.isValidRoutePoint(point))
    );
  },

  /**
   * Check for duplicate point types (should only have one origin and one destination)
   */
  hasDuplicateTypes(routePoints: RoutePoint[]): boolean {
    const origins = routePoints.filter(p => p.type === 'origin');
    const destinations = routePoints.filter(p => p.type === 'destination');
    return origins.length > 1 || destinations.length > 1;
  },

  /**
   * Sanitize route points array by removing duplicates and invalid points
   */
  sanitize(points: unknown[]): RoutePoint[] {
    const validPoints = points.filter(point => this.isValidRoutePoint(point));
    
    // Ensure only one origin and one destination
    const origins = validPoints.filter(p => p.type === 'origin');
    const destinations = validPoints.filter(p => p.type === 'destination');
    const waypoints = validPoints.filter(p => p.type === 'waypoint');
    
    return [
      ...(origins.length > 0 ? [origins[0]] : []), // Keep first origin only
      ...waypoints,
      ...(destinations.length > 0 ? [destinations[0]] : []), // Keep first destination only
    ];
  },
};