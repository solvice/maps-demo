import { describe, it, expect } from 'vitest';
import { extractRouteCoordinates, getRouteBounds } from '@/lib/route-utils';
import { RouteResponse } from '@/lib/solvice-api';

describe('Route Utilities', () => {
  const mockRouteResponse: RouteResponse = {
    code: 'Ok',
    waypoints: [
      { distance: 0, name: 'Origin', location: [3.7174, 51.0543], hint: 'test' },
      { distance: 100, name: 'Destination', location: [3.7200, 51.0550], hint: 'test' }
    ],
    routes: [
      {
        distance: 1000,
        duration: 300,
        geometry: 'u{~vFvyys@fS]',  // Simple polyline encoding
        weight: 300,
        weight_name: 'routability',
        legs: [
          {
            distance: 1000,
            duration: 300,
            weight: 300,
            summary: 'Test route',
            steps: [],
            annotation: {
              distance: [500, 500],
              duration: [150, 150],
              datasources: [1, 1],
              nodes: [1, 2],
              weight: [150, 150],
              speed: [3.33, 3.33]
            }
          }
        ]
      }
    ]
  };

  describe('extractRouteCoordinates', () => {
    it('should extract coordinates from polyline geometry', () => {
      const coordinates = extractRouteCoordinates(mockRouteResponse, 'polyline');
      
      expect(Array.isArray(coordinates)).toBe(true);
      expect(coordinates.length).toBeGreaterThan(0);
      
      // Check that coordinates are in [lng, lat] format
      coordinates.forEach(([lng, lat]) => {
        expect(typeof lng).toBe('number');
        expect(typeof lat).toBe('number');
        expect(lng).toBeGreaterThan(-180);
        expect(lng).toBeLessThan(180);
        expect(lat).toBeGreaterThan(-90);
        expect(lat).toBeLessThan(90);
      });
    });

    it('should return empty array for empty route', () => {
      const emptyRoute: RouteResponse = {
        code: 'Ok',
        waypoints: [],
        routes: []
      };
      
      const coordinates = extractRouteCoordinates(emptyRoute);
      expect(coordinates).toEqual([]);
    });

    it('should handle route without geometry', () => {
      const routeWithoutGeometry: RouteResponse = {
        ...mockRouteResponse,
        routes: [
          {
            ...mockRouteResponse.routes[0],
            geometry: undefined
          }
        ]
      };
      
      const coordinates = extractRouteCoordinates(routeWithoutGeometry);
      expect(coordinates).toEqual([]);
    });
  });

  describe('getRouteBounds', () => {
    it('should calculate bounds for valid route', () => {
      const bounds = getRouteBounds(mockRouteResponse);
      
      expect(bounds).not.toBeNull();
      if (bounds) {
        const [[minLng, minLat], [maxLng, maxLat]] = bounds;
        
        expect(typeof minLng).toBe('number');
        expect(typeof minLat).toBe('number');
        expect(typeof maxLng).toBe('number');
        expect(typeof maxLat).toBe('number');
        
        expect(minLng).toBeLessThanOrEqual(maxLng);
        expect(minLat).toBeLessThanOrEqual(maxLat);
      }
    });

    it('should return null for empty route', () => {
      const emptyRoute: RouteResponse = {
        code: 'Ok',
        waypoints: [],
        routes: []
      };
      
      const bounds = getRouteBounds(emptyRoute);
      expect(bounds).toBeNull();
    });
  });
});