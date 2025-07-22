/**
 * Multi-Waypoint useRoute Hook Tests
 * 
 * Tests for the enhanced useRoute hook with multi-waypoint support
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useRoute } from '@/hooks/use-route';
import { RoutePoint } from '@/lib/route-points';
import { Coordinates } from '@/lib/coordinates';

// Mock the API
vi.mock('@/lib/solvice-api', () => ({
  calculateRoute: vi.fn(),
  calculateMultiWaypointRoute: vi.fn(),
}));

// Mock route-utils
vi.mock('@/lib/route-utils', () => ({
  createTrafficRouteConfig: vi.fn((config) => ({ ...config, routingEngine: 'TOMTOM' })),
}));

import { calculateRoute, calculateMultiWaypointRoute } from '@/lib/solvice-api';
const mockCalculateRoute = vi.mocked(calculateRoute);
const mockCalculateMultiWaypointRoute = vi.mocked(calculateMultiWaypointRoute);

const mockRouteResponse = {
  code: 'Ok',
  routes: [{
    distance: 10000,
    duration: 600,
    geometry: 'encoded-polyline',
    weight: 600,
    weight_name: 'routability',
    legs: [{
      distance: 10000,
      duration: 600,
      weight: 600,
      summary: 'Test route',
      steps: [],
      annotation: {
        distance: [5000, 5000],
        duration: [300, 300],
        datasources: [1, 1],
        nodes: [1, 2, 3],
        weight: [300, 300],
        speed: [60, 60]
      }
    }]
  }],
  waypoints: [
    { distance: 0, name: 'Origin', location: [3.7174, 51.0543], hint: 'test' },
    { distance: 10000, name: 'Destination', location: [3.7274, 51.0643], hint: 'test' }
  ]
};

describe('useRoute with multi-waypoint support', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('legacy calculateRoute function', () => {
    it('should calculate route with origin and destination', async () => {
      mockCalculateRoute.mockResolvedValueOnce(mockRouteResponse);
      
      const { result } = renderHook(() => useRoute());
      
      const origin: Coordinates = [3.7174, 51.0543];
      const destination: Coordinates = [3.7274, 51.0643];

      act(() => {
        result.current.calculateRoute(origin, destination, { vehicleType: 'CAR' }, 0);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCalculateRoute).toHaveBeenCalledWith(
        [origin, destination], 
        { vehicleType: 'CAR' }
      );
      expect(result.current.route).toEqual(mockRouteResponse);
      expect(result.current.error).toBeNull();
    });

    it('should clear route when origin is null', () => {
      const { result } = renderHook(() => useRoute());

      act(() => {
        result.current.calculateRoute(null, [3.7274, 51.0643], { vehicleType: 'CAR' });
      });

      expect(result.current.route).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockCalculateRoute).not.toHaveBeenCalled();
    });

    it('should clear route when destination is null', () => {
      const { result } = renderHook(() => useRoute());

      act(() => {
        result.current.calculateRoute([3.7174, 51.0543], null, { vehicleType: 'CAR' });
      });

      expect(result.current.route).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockCalculateRoute).not.toHaveBeenCalled();
    });

    it('should handle API errors in legacy mode', async () => {
      mockCalculateRoute.mockRejectedValueOnce(new Error('API Error'));
      
      const { result } = renderHook(() => useRoute());

      act(() => {
        result.current.calculateRoute([3.7174, 51.0543], [3.7274, 51.0643], {}, 0);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.route).toBeNull();
      expect(result.current.error).toBe('API Error');
    });
  });

  describe('calculateMultiWaypoint function', () => {
    const mockRoutePoints: RoutePoint[] = [
      {
        id: 'origin',
        coordinates: [3.7174, 51.0543],
        type: 'origin',
        address: 'Brussels'
      },
      {
        id: 'waypoint-1', 
        coordinates: [3.7200, 51.0600],
        type: 'waypoint',
        address: 'Waypoint 1'
      },
      {
        id: 'destination',
        coordinates: [3.7274, 51.0643],
        type: 'destination',
        address: 'Antwerp'
      }
    ];

    it('should calculate multi-waypoint route', async () => {
      mockCalculateMultiWaypointRoute.mockResolvedValueOnce(mockRouteResponse);
      
      const { result } = renderHook(() => useRoute());

      act(() => {
        result.current.calculateMultiWaypoint(mockRoutePoints, { vehicleType: 'TRUCK' }, 0);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockCalculateMultiWaypointRoute).toHaveBeenCalledWith(
        mockRoutePoints,
        { vehicleType: 'TRUCK' }
      );
      expect(result.current.route).toEqual(mockRouteResponse);
      expect(result.current.error).toBeNull();
    });

    it('should clear route when insufficient points provided', () => {
      const { result } = renderHook(() => useRoute());
      
      const singlePoint: RoutePoint[] = [{
        id: 'origin',
        coordinates: [3.7174, 51.0543],
        type: 'origin'
      }];

      act(() => {
        result.current.calculateMultiWaypoint(singlePoint, { vehicleType: 'CAR' });
      });

      expect(result.current.route).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockCalculateMultiWaypointRoute).not.toHaveBeenCalled();
    });

    it('should handle API errors in multi-waypoint mode', async () => {
      mockCalculateMultiWaypointRoute.mockRejectedValueOnce(new Error('Multi-waypoint API Error'));
      
      const { result } = renderHook(() => useRoute());

      act(() => {
        result.current.calculateMultiWaypoint(mockRoutePoints, {}, 0);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.route).toBeNull();
      expect(result.current.error).toBe('Multi-waypoint API Error');
    });

    it('should support debouncing in multi-waypoint mode', async () => {
      mockCalculateMultiWaypointRoute.mockResolvedValueOnce(mockRouteResponse);
      
      const { result } = renderHook(() => useRoute());

      // Call with debounce
      act(() => {
        result.current.calculateMultiWaypoint(mockRoutePoints, {}, 300);
      });

      // Should not have called API yet
      expect(result.current.loading).toBe(true);
      expect(mockCalculateMultiWaypointRoute).not.toHaveBeenCalled();

      // Fast-forward timers
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockCalculateMultiWaypointRoute).toHaveBeenCalled();
      });
    });

    it('should cancel previous request when new one is made', async () => {
      mockCalculateMultiWaypointRoute.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockRouteResponse), 1000))
      );
      
      const { result } = renderHook(() => useRoute());

      const firstRoute = [...mockRoutePoints];
      const secondRoute = [
        ...mockRoutePoints,
        {
          id: 'waypoint-2',
          coordinates: [3.7250, 51.0620],
          type: 'waypoint' as const
        }
      ];

      // Start first request
      act(() => {
        result.current.calculateMultiWaypoint(firstRoute, {}, 0);
      });

      // Start second request before first completes
      act(() => {
        result.current.calculateMultiWaypoint(secondRoute, {}, 0);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have been called twice (first request + second request)
      expect(mockCalculateMultiWaypointRoute).toHaveBeenCalledTimes(2);
    });
  });

  describe('traffic comparison with multi-waypoint', () => {
    const mockRoutePoints: RoutePoint[] = [
      { id: 'origin', coordinates: [3.7174, 51.0543], type: 'origin' },
      { id: 'waypoint-1', coordinates: [3.7200, 51.0600], type: 'waypoint' },
      { id: 'destination', coordinates: [3.7274, 51.0643], type: 'destination' }
    ];

    it('should calculate both regular and traffic routes for multi-waypoint', async () => {
      mockCalculateMultiWaypointRoute
        .mockResolvedValueOnce(mockRouteResponse) // Regular route
        .mockResolvedValueOnce({              // Traffic route  
          ...mockRouteResponse,
          routes: [{
            ...mockRouteResponse.routes[0],
            duration: 750 // Longer due to traffic
          }]
        });
      
      const { result } = renderHook(() => useRoute());

      act(() => {
        result.current.calculateMultiWaypoint(mockRoutePoints, { vehicleType: 'CAR' }, 0, true);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.trafficLoading).toBe(false);
      });

      expect(mockCalculateMultiWaypointRoute).toHaveBeenCalledTimes(2);
      expect(result.current.route).toEqual(mockRouteResponse);
      expect(result.current.trafficRoute).toBeDefined();
      expect(result.current.trafficRoute?.routes[0].duration).toBe(750);
    });

    it('should handle traffic route errors independently', async () => {
      mockCalculateMultiWaypointRoute
        .mockResolvedValueOnce(mockRouteResponse) // Regular route succeeds
        .mockRejectedValueOnce(new Error('Traffic API Error')); // Traffic route fails
      
      const { result } = renderHook(() => useRoute());

      act(() => {
        result.current.calculateMultiWaypoint(mockRoutePoints, {}, 0, true);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.trafficLoading).toBe(false);
      });

      expect(result.current.route).toEqual(mockRouteResponse);
      expect(result.current.error).toBeNull();
      expect(result.current.trafficRoute).toBeNull();
      expect(result.current.trafficError).toBe('Traffic API Error');
    });
  });

  describe('clearRoute function', () => {
    it('should clear all route data', () => {
      const { result } = renderHook(() => useRoute());

      // Set up some data first
      act(() => {
        (result.current as any).setState({
          route: mockRouteResponse,
          trafficRoute: mockRouteResponse,
          error: 'Some error',
          trafficError: 'Traffic error'
        });
      });

      act(() => {
        result.current.clearRoute();
      });

      expect(result.current.route).toBeNull();
      expect(result.current.trafficRoute).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.trafficError).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.trafficLoading).toBe(false);
    });
  });

  describe('request cancellation', () => {
    it('should ignore stale responses in multi-waypoint mode', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;

      const firstPromise = new Promise(resolve => resolveFirst = resolve);
      const secondPromise = new Promise(resolve => resolveSecond = resolve);

      mockCalculateMultiWaypointRoute
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(secondPromise);

      const { result } = renderHook(() => useRoute());

      const routePoints: RoutePoint[] = [
        { id: 'origin', coordinates: [3.7174, 51.0543], type: 'origin' },
        { id: 'destination', coordinates: [3.7274, 51.0643], type: 'destination' }
      ];

      // Start first request
      act(() => {
        result.current.calculateMultiWaypoint(routePoints, {}, 0);
      });

      // Start second request
      act(() => {
        result.current.calculateMultiWaypoint([...routePoints], {}, 0);
      });

      // Resolve first (stale) request
      act(() => {
        resolveFirst(mockRouteResponse);
      });

      // Should still be loading (waiting for second request)
      expect(result.current.loading).toBe(true);
      expect(result.current.route).toBeNull();

      // Resolve second (current) request
      act(() => {
        resolveSecond(mockRouteResponse);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have the second response
      expect(result.current.route).toEqual(mockRouteResponse);
    });
  });
});