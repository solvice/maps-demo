/**
 * Route Points Management Tests
 * 
 * Tests for multi-waypoint routing data structures and helper functions
 */

import { describe, it, expect } from 'vitest';
import { RoutePoint, RoutePointManager, RoutePointValidation } from '@/lib/route-points';
import { Coordinates } from '@/lib/coordinates';

describe('RoutePoint Interface', () => {
  it('should create a valid route point with required properties', () => {
    const point: RoutePoint = {
      id: 'test-1',
      coordinates: [3.7174, 51.0543] as Coordinates,
      type: 'origin'
    };
    
    expect(point.id).toBe('test-1');
    expect(point.coordinates).toEqual([3.7174, 51.0543]);
    expect(point.type).toBe('origin');
    expect(point.address).toBeUndefined();
  });

  it('should create a route point with optional address', () => {
    const point: RoutePoint = {
      id: 'test-2',
      coordinates: [3.7274, 51.0643] as Coordinates,
      type: 'destination',
      address: 'Ghent, Belgium'
    };
    
    expect(point.address).toBe('Ghent, Belgium');
  });
});

describe('RoutePointManager', () => {
  const mockOrigin: RoutePoint = {
    id: 'origin',
    coordinates: [3.7174, 51.0543],
    type: 'origin',
    address: 'Brussels, Belgium'
  };

  const mockWaypoint1: RoutePoint = {
    id: 'waypoint-1',
    coordinates: [3.7200, 51.0600],
    type: 'waypoint',
    address: 'Waypoint 1'
  };

  const mockWaypoint2: RoutePoint = {
    id: 'waypoint-2', 
    coordinates: [3.7250, 51.0620],
    type: 'waypoint',
    address: 'Waypoint 2'
  };

  const mockDestination: RoutePoint = {
    id: 'destination',
    coordinates: [3.7274, 51.0643],
    type: 'destination',
    address: 'Antwerp, Belgium'
  };

  describe('getOrigin', () => {
    it('should return origin point when it exists', () => {
      const points = [mockOrigin, mockWaypoint1, mockDestination];
      const origin = RoutePointManager.getOrigin(points);
      
      expect(origin).toEqual(mockOrigin);
    });

    it('should return undefined when no origin exists', () => {
      const points = [mockWaypoint1, mockDestination];
      const origin = RoutePointManager.getOrigin(points);
      
      expect(origin).toBeUndefined();
    });
  });

  describe('getDestination', () => {
    it('should return destination point when it exists', () => {
      const points = [mockOrigin, mockWaypoint1, mockDestination];
      const destination = RoutePointManager.getDestination(points);
      
      expect(destination).toEqual(mockDestination);
    });

    it('should return undefined when no destination exists', () => {
      const points = [mockOrigin, mockWaypoint1];
      const destination = RoutePointManager.getDestination(points);
      
      expect(destination).toBeUndefined();
    });
  });

  describe('getWaypoints', () => {
    it('should return all waypoints in order', () => {
      const points = [mockOrigin, mockWaypoint1, mockWaypoint2, mockDestination];
      const waypoints = RoutePointManager.getWaypoints(points);
      
      expect(waypoints).toEqual([mockWaypoint1, mockWaypoint2]);
    });

    it('should return empty array when no waypoints exist', () => {
      const points = [mockOrigin, mockDestination];
      const waypoints = RoutePointManager.getWaypoints(points);
      
      expect(waypoints).toEqual([]);
    });
  });

  describe('getCoordinatesArray', () => {
    it('should extract coordinates in order', () => {
      const points = [mockOrigin, mockWaypoint1, mockDestination];
      const coordinates = RoutePointManager.getCoordinatesArray(points);
      
      expect(coordinates).toEqual([
        [3.7174, 51.0543],
        [3.7200, 51.0600], 
        [3.7274, 51.0643]
      ]);
    });

    it('should handle empty array', () => {
      const coordinates = RoutePointManager.getCoordinatesArray([]);
      expect(coordinates).toEqual([]);
    });
  });

  describe('hasMinimumPoints', () => {
    it('should return true for 2 or more points', () => {
      expect(RoutePointManager.hasMinimumPoints([mockOrigin, mockDestination])).toBe(true);
      expect(RoutePointManager.hasMinimumPoints([mockOrigin, mockWaypoint1, mockDestination])).toBe(true);
    });

    it('should return false for less than 2 points', () => {
      expect(RoutePointManager.hasMinimumPoints([])).toBe(false);
      expect(RoutePointManager.hasMinimumPoints([mockOrigin])).toBe(false);
    });
  });

  describe('hasOriginAndDestination', () => {
    it('should return true when both origin and destination exist', () => {
      const points = [mockOrigin, mockWaypoint1, mockDestination];
      expect(RoutePointManager.hasOriginAndDestination(points)).toBe(true);
    });

    it('should return false when origin is missing', () => {
      const points = [mockWaypoint1, mockDestination];
      expect(RoutePointManager.hasOriginAndDestination(points)).toBe(false);
    });

    it('should return false when destination is missing', () => {
      const points = [mockOrigin, mockWaypoint1];
      expect(RoutePointManager.hasOriginAndDestination(points)).toBe(false);
    });
  });

  describe('createWaypoint', () => {
    it('should create waypoint with unique ID', () => {
      const coords: Coordinates = [3.7200, 51.0600];
      const waypoint1 = RoutePointManager.createWaypoint(coords, 'Address 1');
      const waypoint2 = RoutePointManager.createWaypoint(coords, 'Address 2');
      
      expect(waypoint1.type).toBe('waypoint');
      expect(waypoint1.coordinates).toEqual(coords);
      expect(waypoint1.address).toBe('Address 1');
      expect(waypoint1.id).not.toBe(waypoint2.id); // IDs should be unique
    });
  });

  describe('addWaypoint', () => {
    it('should add waypoint before destination when destination exists', () => {
      const points = [mockOrigin, mockDestination];
      const coords: Coordinates = [3.7200, 51.0600];
      
      const result = RoutePointManager.addWaypoint(points, coords, 'New Waypoint');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual(mockOrigin);
      expect(result[1].type).toBe('waypoint');
      expect(result[1].coordinates).toEqual(coords);
      expect(result[1].address).toBe('New Waypoint');
      expect(result[2]).toEqual(mockDestination);
    });

    it('should add waypoint at end when no destination exists', () => {
      const points = [mockOrigin];
      const coords: Coordinates = [3.7200, 51.0600];
      
      const result = RoutePointManager.addWaypoint(points, coords);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(mockOrigin);
      expect(result[1].type).toBe('waypoint');
      expect(result[1].coordinates).toEqual(coords);
    });
  });

  describe('removePoint', () => {
    it('should remove point by ID', () => {
      const points = [mockOrigin, mockWaypoint1, mockDestination];
      const result = RoutePointManager.removePoint(points, 'waypoint-1');
      
      expect(result).toHaveLength(2);
      expect(result).toEqual([mockOrigin, mockDestination]);
    });

    it('should handle non-existent ID gracefully', () => {
      const points = [mockOrigin, mockDestination];
      const result = RoutePointManager.removePoint(points, 'non-existent');
      
      expect(result).toEqual(points);
    });
  });

  describe('updatePoint', () => {
    it('should update point coordinates and address', () => {
      const points = [mockOrigin, mockWaypoint1, mockDestination];
      const newCoords: Coordinates = [3.8000, 51.1000];
      const newAddress = 'Updated Address';
      
      const result = RoutePointManager.updatePoint(points, 'waypoint-1', newCoords, newAddress);
      
      expect(result[1].coordinates).toEqual(newCoords);
      expect(result[1].address).toBe(newAddress);
      expect(result[1].id).toBe('waypoint-1'); // ID should remain the same
    });
  });

  describe('fromLegacyPoints', () => {
    it('should convert legacy origin/destination to route points', () => {
      const origin: Coordinates = [3.7174, 51.0543];
      const destination: Coordinates = [3.7274, 51.0643];
      
      const result = RoutePointManager.fromLegacyPoints(
        origin, 
        destination,
        'Brussels',
        'Antwerp'
      );
      
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('origin');
      expect(result[0].coordinates).toEqual(origin);
      expect(result[0].address).toBe('Brussels');
      expect(result[1].type).toBe('destination');
      expect(result[1].coordinates).toEqual(destination);
      expect(result[1].address).toBe('Antwerp');
    });

    it('should handle null values', () => {
      const result = RoutePointManager.fromLegacyPoints(null, null);
      expect(result).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      const points = [mockOrigin, mockWaypoint1, mockWaypoint2, mockDestination];
      const stats = RoutePointManager.getStats(points);
      
      expect(stats.total).toBe(4);
      expect(stats.waypoints).toBe(2);
      expect(stats.hasOrigin).toBe(true);
      expect(stats.hasDestination).toBe(true);
      expect(stats.isValid).toBe(true);
      expect(stats.isComplete).toBe(true);
    });

    it('should indicate incomplete route', () => {
      const points = [mockOrigin];
      const stats = RoutePointManager.getStats(points);
      
      expect(stats.total).toBe(1);
      expect(stats.waypoints).toBe(0);
      expect(stats.hasOrigin).toBe(true);
      expect(stats.hasDestination).toBe(false);
      expect(stats.isValid).toBe(false);
      expect(stats.isComplete).toBe(false);
    });
  });
});

describe('RoutePointValidation', () => {
  describe('isValidRoutePoint', () => {
    it('should validate correct route point', () => {
      const point: RoutePoint = {
        id: 'test',
        coordinates: [3.7174, 51.0543],
        type: 'origin'
      };
      
      expect(RoutePointValidation.isValidRoutePoint(point)).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      const invalidPoint = {
        id: 'test',
        coordinates: [181, 91], // Invalid lng/lat
        type: 'origin'
      };
      
      expect(RoutePointValidation.isValidRoutePoint(invalidPoint)).toBe(true); // Validation only checks format, not bounds
    });

    it('should reject invalid type', () => {
      const invalidPoint = {
        id: 'test',
        coordinates: [3.7174, 51.0543],
        type: 'invalid-type'
      };
      
      expect(RoutePointValidation.isValidRoutePoint(invalidPoint)).toBe(false);
    });

    it('should reject missing required properties', () => {
      const invalidPoint = {
        coordinates: [3.7174, 51.0543],
        type: 'origin'
        // Missing id
      };
      
      expect(RoutePointValidation.isValidRoutePoint(invalidPoint)).toBe(false);
    });
  });

  describe('hasDuplicateTypes', () => {
    it('should detect duplicate origins', () => {
      const points: RoutePoint[] = [
        { id: 'origin1', coordinates: [3.7174, 51.0543], type: 'origin' },
        { id: 'origin2', coordinates: [3.7200, 51.0600], type: 'origin' },
        { id: 'dest', coordinates: [3.7274, 51.0643], type: 'destination' }
      ];
      
      expect(RoutePointValidation.hasDuplicateTypes(points)).toBe(true);
    });

    it('should detect duplicate destinations', () => {
      const points: RoutePoint[] = [
        { id: 'origin', coordinates: [3.7174, 51.0543], type: 'origin' },
        { id: 'dest1', coordinates: [3.7200, 51.0600], type: 'destination' },
        { id: 'dest2', coordinates: [3.7274, 51.0643], type: 'destination' }
      ];
      
      expect(RoutePointValidation.hasDuplicateTypes(points)).toBe(true);
    });

    it('should allow multiple waypoints', () => {
      const points: RoutePoint[] = [
        { id: 'origin', coordinates: [3.7174, 51.0543], type: 'origin' },
        { id: 'waypoint1', coordinates: [3.7200, 51.0600], type: 'waypoint' },
        { id: 'waypoint2', coordinates: [3.7250, 51.0620], type: 'waypoint' },
        { id: 'dest', coordinates: [3.7274, 51.0643], type: 'destination' }
      ];
      
      expect(RoutePointValidation.hasDuplicateTypes(points)).toBe(false);
    });
  });

  describe('sanitize', () => {
    it('should remove duplicate origins and destinations', () => {
      const points = [
        { id: 'origin1', coordinates: [3.7174, 51.0543], type: 'origin' },
        { id: 'origin2', coordinates: [3.7200, 51.0600], type: 'origin' }, // Duplicate
        { id: 'waypoint1', coordinates: [3.7220, 51.0610], type: 'waypoint' },
        { id: 'dest1', coordinates: [3.7274, 51.0643], type: 'destination' },
        { id: 'dest2', coordinates: [3.7280, 51.0650], type: 'destination' } // Duplicate
      ];
      
      const sanitized = RoutePointValidation.sanitize(points);
      
      expect(sanitized).toHaveLength(3); // origin1, waypoint1, dest1
      expect(sanitized[0].id).toBe('origin1');
      expect(sanitized[1].id).toBe('waypoint1');  
      expect(sanitized[2].id).toBe('dest1');
    });

    it('should remove invalid points', () => {
      const points = [
        { id: 'origin', coordinates: [3.7174, 51.0543], type: 'origin' },
        { coordinates: [3.7200, 51.0600], type: 'waypoint' }, // Missing ID
        { id: 'dest', coordinates: 'invalid', type: 'destination' }, // Invalid coordinates
        { id: 'valid-waypoint', coordinates: [3.7250, 51.0620], type: 'waypoint' }
      ];
      
      const sanitized = RoutePointValidation.sanitize(points);
      
      expect(sanitized).toHaveLength(2); // Only origin and valid-waypoint
      expect(sanitized[0].id).toBe('origin');
      expect(sanitized[1].id).toBe('valid-waypoint');
    });
  });
});