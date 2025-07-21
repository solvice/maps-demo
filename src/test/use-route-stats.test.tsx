import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRouteStats } from '@/hooks/use-route-stats';
import { RouteResponse } from '@/lib/solvice-api';
import { RouteConfig } from '@/components/route-control-panel';

// Mock the route-utils module
vi.mock('@/lib/route-utils', () => ({
  calculateTrafficDifference: vi.fn(),
  formatTrafficDifference: vi.fn()
}));

import { calculateTrafficDifference, formatTrafficDifference } from '@/lib/route-utils';

describe('useRouteStats', () => {
  const mockCalculateTrafficDifference = vi.mocked(calculateTrafficDifference);
  const mockFormatTrafficDifference = vi.mocked(formatTrafficDifference);
  
  const mockRouteResponse: RouteResponse = {
    code: 'Ok',
    routes: [{
      distance: 55000,
      duration: 1380,
      geometry: 'example_polyline',
      weight: 100,
      weight_name: 'routability',
      legs: []
    }],
    waypoints: []
  };

  const mockTrafficRouteResponse: RouteResponse = {
    code: 'Ok',
    routes: [{
      distance: 55000,
      duration: 1560,
      geometry: 'traffic_polyline',
      weight: 100,
      weight_name: 'routability',
      legs: []
    }],
    waypoints: []
  };

  const mockRouteConfig: RouteConfig = {
    routingEngine: 'OSM',
    vehicleType: 'CAR'
  };

  const mockCoordinates: [number, number] = [3.7174, 51.0543];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('route validation', () => {
    it('should return hasRoute as true when route has valid data', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: null,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(result.current.hasRoute).toBe(true);
    });

    it('should return hasRoute as false when route is null', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: null,
          trafficRoute: null,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(result.current.hasRoute).toBe(false);
    });

    it('should return hasRoute as false when route has no routes', () => {
      const emptyRoute: RouteResponse = { ...mockRouteResponse, routes: [] };
      
      const { result } = renderHook(() => 
        useRouteStats({
          route: emptyRoute,
          trafficRoute: null,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(result.current.hasRoute).toBe(false);
    });

    it('should return hasRoute as false when route has no distance or duration', () => {
      const invalidRoute: RouteResponse = {
        ...mockRouteResponse,
        routes: [{
          geometry: 'example_polyline',
          weight: 100,
          weight_name: 'routability',
          legs: []
        }]
      };
      
      const { result } = renderHook(() => 
        useRouteStats({
          route: invalidRoute,
          trafficRoute: null,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(result.current.hasRoute).toBe(false);
    });

    it('should return hasTrafficRoute as true when traffic route has valid data', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(result.current.hasTrafficRoute).toBe(true);
    });

    it('should return hasTrafficRoute as false when traffic route is null', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: null,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(result.current.hasTrafficRoute).toBe(false);
    });
  });

  describe('traffic difference calculations', () => {
    beforeEach(() => {
      mockCalculateTrafficDifference.mockReturnValue(180); // 3 minutes
      mockFormatTrafficDifference.mockReturnValue('+3 min');
    });

    it('should calculate traffic difference when both routes are available', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(mockCalculateTrafficDifference).toHaveBeenCalledWith(
        mockRouteResponse,
        mockTrafficRouteResponse
      );
      expect(result.current.trafficDifference).toBe(180);
    });

    it('should format traffic difference for display', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(mockFormatTrafficDifference).toHaveBeenCalledWith(180);
      expect(result.current.trafficDifferenceText).toBe('+3 min');
    });

    it('should return null traffic difference when route is missing', () => {
      mockCalculateTrafficDifference.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useRouteStats({
          route: null,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(result.current.trafficDifference).toBeNull();
      expect(result.current.trafficDifferenceText).toBe('');
    });

    it('should return null traffic difference when traffic route is missing', () => {
      mockCalculateTrafficDifference.mockReturnValue(null);
      
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: null,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(result.current.trafficDifference).toBeNull();
      expect(result.current.trafficDifferenceText).toBe('');
    });
  });

  describe('traffic difference styling', () => {
    it('should return empty string for null traffic difference', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: null,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(result.current.getTrafficDifferenceStyle(null)).toBe('');
    });

    it('should return green color for no delay', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(result.current.getTrafficDifferenceStyle(0)).toBe('text-green-600');
    });

    it('should return green color for traffic savings (negative delay)', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(result.current.getTrafficDifferenceStyle(-120)).toBe('text-green-600');
    });

    it('should return yellow color for small delay (< 15 min)', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(result.current.getTrafficDifferenceStyle(600)).toBe('text-yellow-600'); // 10 minutes
    });

    it('should return red color for severe delay (>= 15 min)', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(result.current.getTrafficDifferenceStyle(1200)).toBe('text-red-600'); // 20 minutes
    });
  });

  describe('route colors', () => {
    it('should return route colors array', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: mockCoordinates,
          destinationCoordinates: mockCoordinates
        })
      );
      
      expect(result.current.routeColors).toEqual([
        '#3b82f6', // Blue for primary route
        '#93c5fd', // Light blue for alternatives
        '#93c5fd', // Light blue for alternatives  
        '#93c5fd'  // Light blue for alternatives
      ]);
    });
  });

  describe('URL generation', () => {
    beforeEach(() => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'https://example.com'
        },
        writable: true
      });
    });

    it('should generate request JSON when both coordinates are available', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: [3.7174, 51.0543],
          destinationCoordinates: [4.3517, 50.8476]
        })
      );
      
      expect(result.current.getRequestJson()).toEqual({
        coordinates: [[3.7174, 51.0543], [4.3517, 50.8476]],
        routingEngine: 'OSM',
        vehicleType: 'CAR'
      });
    });

    it('should return null request JSON when origin is missing', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: null,
          destinationCoordinates: [4.3517, 50.8476]
        })
      );
      
      expect(result.current.getRequestJson()).toBeNull();
    });

    it('should return null request JSON when destination is missing', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: [3.7174, 51.0543],
          destinationCoordinates: null
        })
      );
      
      expect(result.current.getRequestJson()).toBeNull();
    });

    it('should generate share URL when both coordinates are available', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: [3.7174, 51.0543],
          destinationCoordinates: [4.3517, 50.8476]
        })
      );
      
      expect(result.current.getShareUrl()).toBe(
        'https://example.com/route?origin=3.7174%2C51.0543&destination=4.3517%2C50.8476'
      );
    });

    it('should include departure time in share URL when available', () => {
      const configWithDepartureTime = {
        ...mockRouteConfig,
        departureTime: '2024-01-01T12:00:00.000Z'
      };
      
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: configWithDepartureTime,
          originCoordinates: [3.7174, 51.0543],
          destinationCoordinates: [4.3517, 50.8476]
        })
      );
      
      expect(result.current.getShareUrl()).toBe(
        'https://example.com/route?origin=3.7174%2C51.0543&destination=4.3517%2C50.8476&departureTime=2024-01-01T12%3A00%3A00.000Z'
      );
    });

    it('should return null share URL when origin is missing', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: null,
          destinationCoordinates: [4.3517, 50.8476]
        })
      );
      
      expect(result.current.getShareUrl()).toBeNull();
    });

    it('should return null share URL when destination is missing', () => {
      const { result } = renderHook(() => 
        useRouteStats({
          route: mockRouteResponse,
          trafficRoute: mockTrafficRouteResponse,
          routeConfig: mockRouteConfig,
          originCoordinates: [3.7174, 51.0543],
          destinationCoordinates: null
        })
      );
      
      expect(result.current.getShareUrl()).toBeNull();
    });
  });

  describe('memoization and performance', () => {
    it('should memoize calculations when inputs do not change', () => {
      mockCalculateTrafficDifference.mockReturnValue(180);
      
      const { result, rerender } = renderHook((props) => 
        useRouteStats(props), {
          initialProps: {
            route: mockRouteResponse,
            trafficRoute: mockTrafficRouteResponse,
            routeConfig: mockRouteConfig,
            originCoordinates: mockCoordinates,
            destinationCoordinates: mockCoordinates
          }
        }
      );
      
      const firstResult = result.current.trafficDifference;
      
      // Rerender with same props
      rerender({
        route: mockRouteResponse,
        trafficRoute: mockTrafficRouteResponse,
        routeConfig: mockRouteConfig,
        originCoordinates: mockCoordinates,
        destinationCoordinates: mockCoordinates
      });
      
      // Should only call calculateTrafficDifference once due to memoization
      expect(mockCalculateTrafficDifference).toHaveBeenCalledTimes(1);
      expect(result.current.trafficDifference).toBe(firstResult);
    });
  });
});