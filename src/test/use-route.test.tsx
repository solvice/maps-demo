import { describe, it, expect, beforeEach, vi } from 'vitest';
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
        await result.current.calculateRoute(validOrigin, validDestination);
      });
      
      expect(mockCalculateRoute).toHaveBeenCalledWith(validOrigin, validDestination);
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
});