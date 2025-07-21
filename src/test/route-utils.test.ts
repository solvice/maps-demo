import { describe, it, expect } from 'vitest';
import { 
  extractRouteCoordinates, 
  getRouteBounds,
  calculateTrafficDifference,
  formatTrafficDifference,
  shouldEnableTrafficComparison,
  createTrafficRouteConfig
} from '@/lib/route-utils';
import { RouteResponse } from '@/lib/solvice-api';
import { RouteConfig } from '@/components/route-control-panel';

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

describe('Traffic Comparison Utilities', () => {
  const mockRegularRoute: RouteResponse = {
    code: 'Ok',
    routes: [
      {
        distance: 1000,
        duration: 1380, // 23 minutes
        geometry: 'mock-geometry',
        weight: 100,
        weight_name: 'routability',
        legs: []
      }
    ],
    waypoints: []
  };

  const mockTrafficRoute: RouteResponse = {
    code: 'Ok',
    routes: [
      {
        distance: 1000,
        duration: 1560, // 26 minutes
        geometry: 'mock-geometry',
        weight: 100,
        weight_name: 'routability',
        legs: []
      }
    ],
    waypoints: []
  };

  describe('calculateTrafficDifference', () => {
    it('should calculate positive traffic difference correctly', () => {
      const difference = calculateTrafficDifference(mockRegularRoute, mockTrafficRoute);
      expect(difference).toBe(180); // 3 minutes difference
    });

    it('should return 0 for same duration', () => {
      const difference = calculateTrafficDifference(mockRegularRoute, mockRegularRoute);
      expect(difference).toBe(0);
    });

    it('should handle negative difference (traffic savings)', () => {
      const fasterTrafficRoute = {
        ...mockTrafficRoute,
        routes: [{ ...mockTrafficRoute.routes[0], duration: 1200 }] // 20 minutes
      };
      const difference = calculateTrafficDifference(mockRegularRoute, fasterTrafficRoute);
      expect(difference).toBe(-180); // 3 minutes saved
    });

    it('should return null for undefined regular route', () => {
      const difference = calculateTrafficDifference(undefined, mockTrafficRoute);
      expect(difference).toBeNull();
    });

    it('should return null for undefined traffic route', () => {
      const difference = calculateTrafficDifference(mockRegularRoute, undefined);
      expect(difference).toBeNull();
    });

    it('should return null for route with no routes array', () => {
      const emptyRoute = { ...mockRegularRoute, routes: [] };
      const difference = calculateTrafficDifference(emptyRoute, mockTrafficRoute);
      expect(difference).toBeNull();
    });

    it('should return null for route with undefined duration', () => {
      const routeWithoutDuration = {
        ...mockRegularRoute,
        routes: [{ ...mockRegularRoute.routes[0], duration: undefined }]
      };
      const difference = calculateTrafficDifference(routeWithoutDuration, mockTrafficRoute);
      expect(difference).toBeNull();
    });
  });

  describe('formatTrafficDifference', () => {
    it('should format positive differences correctly', () => {
      expect(formatTrafficDifference(180)).toBe('+3 min'); // 3 minutes
      expect(formatTrafficDifference(60)).toBe('+1 min'); // 1 minute
      expect(formatTrafficDifference(120)).toBe('+2 min'); // 2 minutes
    });

    it('should format large positive differences with hours', () => {
      expect(formatTrafficDifference(3900)).toBe('+1h 5m'); // 1 hour 5 minutes
      expect(formatTrafficDifference(3600)).toBe('+1h'); // 1 hour exactly
      expect(formatTrafficDifference(7320)).toBe('+2h 2m'); // 2 hours 2 minutes
    });

    it('should format negative differences (savings)', () => {
      expect(formatTrafficDifference(-180)).toBe('-3 min'); // 3 minutes saved
      expect(formatTrafficDifference(-60)).toBe('-1 min'); // 1 minute saved
      expect(formatTrafficDifference(-3900)).toBe('-1h 5m'); // 1 hour 5 minutes saved
    });

    it('should format zero difference', () => {
      expect(formatTrafficDifference(0)).toBe('No delay');
    });

    it('should round seconds to nearest minute', () => {
      expect(formatTrafficDifference(89)).toBe('+1 min'); // 89 seconds rounds to 1 minute
      expect(formatTrafficDifference(30)).toBe('No delay'); // 30 seconds rounds to 0
      expect(formatTrafficDifference(150)).toBe('+3 min'); // 150 seconds rounds to 3 minutes
    });

    it('should handle null input', () => {
      expect(formatTrafficDifference(null)).toBe(''); // Empty string for null
    });
  });

  describe('shouldEnableTrafficComparison', () => {
    it('should return true when routing engine is OSM', () => {
      const config: RouteConfig = {
        routingEngine: 'OSM'
      };
      expect(shouldEnableTrafficComparison(config)).toBe(true);
    });

    it('should return true when routing engine is GOOGLE', () => {
      const config: RouteConfig = {
        routingEngine: 'GOOGLE'
      };
      expect(shouldEnableTrafficComparison(config)).toBe(true);
    });

    it('should return true when routing engine is ANYMAP', () => {
      const config: RouteConfig = {
        routingEngine: 'ANYMAP'
      };
      expect(shouldEnableTrafficComparison(config)).toBe(true);
    });

    it('should return true when routing engine is TOMTOM without departureTime', () => {
      const config: RouteConfig = {
        routingEngine: 'TOMTOM'
      };
      expect(shouldEnableTrafficComparison(config)).toBe(true);
    });

    it('should return true when routing engine is TOMTOM with departureTime (traffic always enabled)', () => {
      const config: RouteConfig = {
        routingEngine: 'TOMTOM',
        departureTime: new Date().toISOString()
      };
      expect(shouldEnableTrafficComparison(config)).toBe(true);
    });

    it('should return true when routing engine is undefined', () => {
      const config: RouteConfig = {};
      expect(shouldEnableTrafficComparison(config)).toBe(true);
    });

    it('should return true for null config (traffic always enabled)', () => {
      expect(shouldEnableTrafficComparison(null)).toBe(true);
    });

    it('should return true for undefined config (traffic always enabled)', () => {
      expect(shouldEnableTrafficComparison(undefined)).toBe(true);
    });
  });

  describe('createTrafficRouteConfig', () => {
    it('should create TOMTOM config with departureTime', () => {
      const baseConfig: RouteConfig = {
        routingEngine: 'OSM',
        alternatives: 2,
        steps: true
      };

      const trafficConfig = createTrafficRouteConfig(baseConfig);

      expect(trafficConfig.routingEngine).toBe('TOMTOM');
      expect(trafficConfig.departureTime).toBeDefined();
      expect(typeof trafficConfig.departureTime).toBe('string');
      expect(trafficConfig.alternatives).toBe(2); // Preserves other properties
      expect(trafficConfig.steps).toBe(true); // Preserves other properties
    });

    it('should override existing TOMTOM engine', () => {
      const baseConfig: RouteConfig = {
        routingEngine: 'TOMTOM',
        departureTime: '2023-01-01T00:00:00.000Z'
      };

      const trafficConfig = createTrafficRouteConfig(baseConfig);

      expect(trafficConfig.routingEngine).toBe('TOMTOM');
      expect(trafficConfig.departureTime).not.toBe('2023-01-01T00:00:00.000Z');
      expect(new Date(trafficConfig.departureTime!).getTime()).toBeGreaterThan(
        new Date('2023-01-01T00:00:00.000Z').getTime()
      );
    });

    it('should preserve all other config properties', () => {
      const baseConfig: RouteConfig = {
        routingEngine: 'OSM',
        alternatives: 3,
        steps: false,
        annotations: ['duration', 'distance'],
        geometries: 'geojson',
        overview: 'full',
        continue_straight: true,
        snapping: 'any',
        vehicleType: 'CAR',
        interpolate: true,
        generate_hints: false
      };

      const trafficConfig = createTrafficRouteConfig(baseConfig);

      expect(trafficConfig.routingEngine).toBe('TOMTOM');
      expect(trafficConfig.departureTime).toBeDefined();
      expect(trafficConfig.alternatives).toBe(3);
      expect(trafficConfig.steps).toBe(false);
      expect(trafficConfig.annotations).toEqual(['duration', 'distance']);
      expect(trafficConfig.geometries).toBe('geojson');
      expect(trafficConfig.overview).toBe('full');
      expect(trafficConfig.continue_straight).toBe(true);
      expect(trafficConfig.snapping).toBe('any');
      expect(trafficConfig.vehicleType).toBe('CAR');
      expect(trafficConfig.interpolate).toBe(true);
      expect(trafficConfig.generate_hints).toBe(false);
    });

    it('should handle empty config', () => {
      const baseConfig: RouteConfig = {};
      const trafficConfig = createTrafficRouteConfig(baseConfig);

      expect(trafficConfig.routingEngine).toBe('TOMTOM');
      expect(trafficConfig.departureTime).toBeDefined();
      expect(Object.keys(trafficConfig)).toEqual(['routingEngine', 'departureTime']);
    });

    it('should generate current time for departureTime', () => {
      const beforeTime = Date.now();
      const baseConfig: RouteConfig = { routingEngine: 'OSM' };
      const trafficConfig = createTrafficRouteConfig(baseConfig);
      const afterTime = Date.now();

      const departureTime = new Date(trafficConfig.departureTime!).getTime();
      expect(departureTime).toBeGreaterThanOrEqual(beforeTime);
      expect(departureTime).toBeLessThanOrEqual(afterTime);
    });

    it('should handle null config', () => {
      const trafficConfig = createTrafficRouteConfig(null);
      expect(trafficConfig.routingEngine).toBe('TOMTOM');
      expect(trafficConfig.departureTime).toBeDefined();
    });

    it('should handle undefined config', () => {
      const trafficConfig = createTrafficRouteConfig(undefined);
      expect(trafficConfig.routingEngine).toBe('TOMTOM');
      expect(trafficConfig.departureTime).toBeDefined();
    });
  });
});