import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoute } from '@/hooks/use-route';
import { calculateRoute } from '@/lib/solvice-api';
import { Coordinates } from '@/lib/coordinates';

// Mock the solvice API
vi.mock('@/lib/solvice-api');

describe('useRoute', () => {
  const mockCalculateRoute = vi.mocked(calculateRoute);
  
  const validOrigin: Coordinates = [3.7174, 51.0543]; // Ghent
  const validDestination: Coordinates = [4.3517, 50.8476]; // Brussels
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should start with null route data', () => {
      const { result } = renderHook(() => useRoute());
      
      expect(result.current.route).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('calculateRoute', () => {
    it('should calculate route when both coordinates are provided', async () => {
      const mockRouteData = {
        routes: [{
          distance: 55000,
          duration: 3600,
          geometry: 'example_polyline_string'
        }]
      };
      
      mockCalculateRoute.mockResolvedValueOnce(mockRouteData);
      
      const { result } = renderHook(() => useRoute());
      
      await act(async () => {
        result.current.calculateRoute(validOrigin, validDestination, undefined, 0);
      });
      
      expect(mockCalculateRoute).toHaveBeenCalledWith(validOrigin, validDestination, undefined);
      expect(result.current.route).toEqual(mockRouteData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set loading state during calculation', async () => {
      let resolvePromise: (value: any) => void;
      const mockPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      
      mockCalculateRoute.mockReturnValueOnce(mockPromise);
      
      const { result } = renderHook(() => useRoute());
      
      // Start calculation
      act(() => {
        result.current.calculateRoute(validOrigin, validDestination);
      });
      
      // Advance timers to trigger debounce
      await act(async () => {
        vi.advanceTimersByTime(300);
      });
      
      // Should be loading
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      
      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          routes: [{
            distance: 55000,
            duration: 3600,
            geometry: 'example_polyline_string'
          }]
        });
      });
      
      // Should no longer be loading
      expect(result.current.loading).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'API Error: No route found';
      mockCalculateRoute.mockRejectedValueOnce(new Error(errorMessage));
      
      const { result } = renderHook(() => useRoute());
      
      await act(async () => {
        await result.current.calculateRoute(validOrigin, validDestination);
      });
      
      expect(result.current.route).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should clear previous error when starting new calculation', async () => {
      // First, set an error state
      const errorMessage = 'Previous error';
      mockCalculateRoute.mockRejectedValueOnce(new Error(errorMessage));
      
      const { result } = renderHook(() => useRoute());
      
      await act(async () => {
        await result.current.calculateRoute(validOrigin, validDestination);
      });
      
      expect(result.current.error).toBe(errorMessage);
      
      // Now make a successful call
      const mockRouteData = {
        routes: [{
          distance: 55000,
          duration: 3600,
          geometry: 'example_polyline_string'
        }]
      };
      
      mockCalculateRoute.mockResolvedValueOnce(mockRouteData);
      
      await act(async () => {
        await result.current.calculateRoute(validOrigin, validDestination);
      });
      
      expect(result.current.error).toBeNull();
      expect(result.current.route).toEqual(mockRouteData);
    });

    it('should not calculate route with missing origin', async () => {
      const { result } = renderHook(() => useRoute());
      
      await act(async () => {
        await result.current.calculateRoute(null, validDestination);
      });
      
      expect(mockCalculateRoute).not.toHaveBeenCalled();
      expect(result.current.route).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should not calculate route with missing destination', async () => {
      const { result } = renderHook(() => useRoute());
      
      await act(async () => {
        await result.current.calculateRoute(validOrigin, null);
      });
      
      expect(mockCalculateRoute).not.toHaveBeenCalled();
      expect(result.current.route).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('should clear route when coordinates are missing', async () => {
      // First set a route
      const mockRouteData = {
        routes: [{
          distance: 55000,
          duration: 3600,
          geometry: 'example_polyline_string'
        }]
      };
      
      mockCalculateRoute.mockResolvedValueOnce(mockRouteData);
      
      const { result } = renderHook(() => useRoute());
      
      await act(async () => {
        await result.current.calculateRoute(validOrigin, validDestination);
      });
      
      expect(result.current.route).toEqual(mockRouteData);
      
      // Now clear by calling with null
      await act(async () => {
        await result.current.calculateRoute(null, validDestination);
      });
      
      expect(result.current.route).toBeNull();
    });
  });

  describe('clearRoute', () => {
    it('should clear route data and error', async () => {
      // First set a route and error
      const mockRouteData = {
        routes: [{
          distance: 55000,
          duration: 3600,
          geometry: 'example_polyline_string'
        }]
      };
      
      mockCalculateRoute.mockResolvedValueOnce(mockRouteData);
      
      const { result } = renderHook(() => useRoute());
      
      await act(async () => {
        await result.current.calculateRoute(validOrigin, validDestination);
      });
      
      expect(result.current.route).toEqual(mockRouteData);
      
      // Clear the route
      act(() => {
        result.current.clearRoute();
      });
      
      expect(result.current.route).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('traffic comparison (dual requests)', () => {
    const mockRegularRoute = {
      code: 'Ok',
      routes: [{
        distance: 55000,
        duration: 1380, // 23 minutes
        geometry: 'regular_polyline_string',
        weight: 100,
        weight_name: 'routability',
        legs: []
      }],
      waypoints: []
    };

    const mockTrafficRoute = {
      code: 'Ok', 
      routes: [{
        distance: 55000,
        duration: 1560, // 26 minutes  
        geometry: 'traffic_polyline_string',
        weight: 100,
        weight_name: 'routability',
        legs: []
      }],
      waypoints: []
    };

    it('should make dual requests when compareTraffic is true', async () => {
      mockCalculateRoute
        .mockResolvedValueOnce(mockRegularRoute)
        .mockResolvedValueOnce(mockTrafficRoute);

      const { result } = renderHook(() => useRoute());

      await act(async () => {
        result.current.calculateRoute(
          validOrigin, 
          validDestination, 
          { routingEngine: 'OSM' },
          0, // no debounce for tests
          true // compareTraffic
        );
      });

      expect(mockCalculateRoute).toHaveBeenCalledTimes(2);
      
      // First call - regular route with original config
      expect(mockCalculateRoute).toHaveBeenNthCalledWith(
        1,
        validOrigin,
        validDestination,
        { routingEngine: 'OSM' }
      );

      // Second call - traffic route with TOMTOM engine and departureTime
      expect(mockCalculateRoute).toHaveBeenNthCalledWith(
        2,
        validOrigin,
        validDestination,
        expect.objectContaining({
          routingEngine: 'TOMTOM',
          departureTime: expect.any(String)
        })
      );

      expect(result.current.route).toEqual(mockRegularRoute);
      expect(result.current.trafficRoute).toEqual(mockTrafficRoute);
      expect(result.current.loading).toBe(false);
      expect(result.current.trafficLoading).toBe(false);
    });

    it('should make single request when compareTraffic is false', async () => {
      mockCalculateRoute.mockResolvedValueOnce(mockRegularRoute);

      const { result } = renderHook(() => useRoute());

      await act(async () => {
        result.current.calculateRoute(
          validOrigin,
          validDestination,
          { routingEngine: 'OSM' },
          0, // no debounce for tests
          false // compareTraffic
        );
      });

      expect(mockCalculateRoute).toHaveBeenCalledTimes(1);
      expect(result.current.route).toEqual(mockRegularRoute);
      expect(result.current.trafficRoute).toBeNull();
    });

    it('should handle loading states correctly for dual requests', async () => {
      let resolveRegular: (value: any) => void;
      let resolveTraffic: (value: any) => void;
      
      const regularPromise = new Promise((resolve) => {
        resolveRegular = resolve;
      });
      
      const trafficPromise = new Promise((resolve) => {
        resolveTraffic = resolve;
      });

      mockCalculateRoute
        .mockReturnValueOnce(regularPromise)
        .mockReturnValueOnce(trafficPromise);

      const { result } = renderHook(() => useRoute());

      // Start dual requests
      act(() => {
        result.current.calculateRoute(
          validOrigin,
          validDestination,
          { routingEngine: 'OSM' },
          0, // no debounce for tests
          true
        );
      });

      // Both should be loading
      expect(result.current.loading).toBe(true);
      expect(result.current.trafficLoading).toBe(true);

      // Resolve regular route first
      await act(async () => {
        resolveRegular!(mockRegularRoute);
      });

      // Regular should be done, traffic still loading
      expect(result.current.loading).toBe(false);
      expect(result.current.trafficLoading).toBe(true);
      expect(result.current.route).toEqual(mockRegularRoute);
      expect(result.current.trafficRoute).toBeNull();

      // Resolve traffic route
      await act(async () => {
        resolveTraffic!(mockTrafficRoute);
      });

      // Both should be done
      expect(result.current.loading).toBe(false);
      expect(result.current.trafficLoading).toBe(false);
      expect(result.current.route).toEqual(mockRegularRoute);
      expect(result.current.trafficRoute).toEqual(mockTrafficRoute);
    });

    it('should handle regular route success and traffic route failure', async () => {
      const trafficError = new Error('Traffic API failed');
      
      mockCalculateRoute
        .mockResolvedValueOnce(mockRegularRoute)
        .mockRejectedValueOnce(trafficError);

      const { result } = renderHook(() => useRoute());

      await act(async () => {
        await result.current.calculateRoute(
          validOrigin,
          validDestination,
          { routingEngine: 'OSM' },
          0, // no debounce for tests
          true
        );
      });

      expect(result.current.route).toEqual(mockRegularRoute);
      expect(result.current.trafficRoute).toBeNull();
      expect(result.current.error).toBeNull(); // Regular request succeeded
      expect(result.current.trafficError).toBe('Traffic API failed');
    });

    it('should handle regular route failure and traffic route success', async () => {
      const regularError = new Error('Regular API failed');
      
      mockCalculateRoute
        .mockRejectedValueOnce(regularError)
        .mockResolvedValueOnce(mockTrafficRoute);

      const { result } = renderHook(() => useRoute());

      await act(async () => {
        await result.current.calculateRoute(
          validOrigin,
          validDestination,
          { routingEngine: 'OSM' },
          0, // no debounce for tests
          true
        );
      });

      expect(result.current.route).toBeNull();
      expect(result.current.trafficRoute).toEqual(mockTrafficRoute);
      expect(result.current.error).toBe('Regular API failed');
      expect(result.current.trafficError).toBeNull();
    });

    it('should handle both requests failing', async () => {
      const regularError = new Error('Regular API failed');
      const trafficError = new Error('Traffic API failed');
      
      mockCalculateRoute
        .mockRejectedValueOnce(regularError)
        .mockRejectedValueOnce(trafficError);

      const { result } = renderHook(() => useRoute());

      await act(async () => {
        await result.current.calculateRoute(
          validOrigin,
          validDestination,
          { routingEngine: 'OSM' },
          0, // no debounce for tests
          true
        );
      });

      expect(result.current.route).toBeNull();
      expect(result.current.trafficRoute).toBeNull();
      expect(result.current.error).toBe('Regular API failed');
      expect(result.current.trafficError).toBe('Traffic API failed');
    });

    it('should cancel both requests when new ones are made', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;
      
      const firstPromise = new Promise((resolve) => {
        resolveFirst = resolve;
      });
      
      const secondPromise = new Promise((resolve) => {
        resolveSecond = resolve;
      });

      // First set of requests
      mockCalculateRoute
        .mockReturnValueOnce(firstPromise)
        .mockReturnValueOnce(firstPromise);

      const { result } = renderHook(() => useRoute());

      // Start first dual requests
      act(() => {
        result.current.calculateRoute(
          validOrigin,
          validDestination,
          { routingEngine: 'OSM' },
          0, // no debounce for tests
          true
        );
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.trafficLoading).toBe(true);

      // Start second set of requests before first completes
      mockCalculateRoute
        .mockReturnValueOnce(secondPromise)
        .mockReturnValueOnce(secondPromise);

      act(() => {
        result.current.calculateRoute(
          [3.8, 51.1],
          [4.4, 50.9],
          { routingEngine: 'OSM' },
          0, // no debounce for tests
          true
        );
      });

      // Resolve first set (should be ignored)
      await act(async () => {
        resolveFirst!(mockRegularRoute);
      });

      // Should still be loading (waiting for second set)
      expect(result.current.loading).toBe(true);
      expect(result.current.trafficLoading).toBe(true);

      // Resolve second set
      await act(async () => {
        resolveSecond!(mockRegularRoute);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.trafficLoading).toBe(false);
    });

    it('should clear traffic route when calling clearRoute', () => {
      const { result } = renderHook(() => useRoute());

      // Manually set state for testing
      act(() => {
        result.current.calculateRoute(validOrigin, validDestination, {}, 0, true);
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

    it('should preserve existing behavior when compareTraffic is undefined', async () => {
      mockCalculateRoute.mockResolvedValueOnce(mockRegularRoute);

      const { result } = renderHook(() => useRoute());

      await act(async () => {
        result.current.calculateRoute(validOrigin, validDestination, undefined, 0);
      });

      expect(mockCalculateRoute).toHaveBeenCalledTimes(1);
      expect(result.current.route).toEqual(mockRegularRoute);
      expect(result.current.trafficRoute).toBeNull();
    });

    it('should track calculation times for both requests', async () => {
      mockCalculateRoute
        .mockResolvedValueOnce(mockRegularRoute)
        .mockResolvedValueOnce(mockTrafficRoute);

      const { result } = renderHook(() => useRoute());

      await act(async () => {
        await result.current.calculateRoute(
          validOrigin,
          validDestination,
          { routingEngine: 'OSM' },
          0, // no debounce for tests
          true
        );
      });

      expect(result.current.calculationTime).toBeGreaterThanOrEqual(0);
      expect(result.current.trafficCalculationTime).toBeGreaterThanOrEqual(0);
    });
  });
});