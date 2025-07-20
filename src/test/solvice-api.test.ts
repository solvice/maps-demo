import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateRoute, RouteResponse } from '@/lib/solvice-api';
import { Coordinates } from '@/lib/coordinates';

// Mock fetch
global.fetch = vi.fn();

describe('Solvice API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateRoute', () => {
    const validOrigin: Coordinates = [3.7174, 51.0543]; // Ghent
    const validDestination: Coordinates = [4.3517, 50.8476]; // Brussels

    it('should make a POST request to the correct endpoint', async () => {
      const mockResponse: RouteResponse = {
        routes: [{
          distance: 55000,
          duration: 3600,
          geometry: 'example_polyline_string'
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await calculateRoute(validOrigin, validDestination);

      expect(fetch).toHaveBeenCalledWith(
        '/api/route',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            origin: validOrigin,
            destination: validDestination
          })
        })
      );
    });

    it('should return route data on successful response', async () => {
      const mockResponse: RouteResponse = {
        routes: [{
          distance: 55000,
          duration: 3600,
          geometry: 'example_polyline_string'
        }]
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await calculateRoute(validOrigin, validDestination);

      expect(result).toEqual(mockResponse);
    });

    it('should throw error when API returns non-ok response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Route calculation failed: 400 Bad Request' })
      });

      await expect(calculateRoute(validOrigin, validDestination))
        .rejects.toThrow('Route calculation failed: 400 Bad Request');
    });

    it('should throw error when fetch fails', async () => {
      const networkError = new Error('Network error');
      (global.fetch as any).mockRejectedValueOnce(networkError);

      await expect(calculateRoute(validOrigin, validDestination))
        .rejects.toThrow('Failed to calculate route: Network error');
    });

    it('should validate origin coordinates', async () => {
      const invalidOrigin: any = [200, 100]; // Invalid longitude/latitude

      await expect(calculateRoute(invalidOrigin, validDestination))
        .rejects.toThrow('Invalid origin coordinates');
    });

    it('should validate destination coordinates', async () => {
      const invalidDestination: any = [200, 100]; // Invalid longitude/latitude

      await expect(calculateRoute(validOrigin, invalidDestination))
        .rejects.toThrow('Invalid destination coordinates');
    });

    it('should handle empty routes response', async () => {
      const mockResponse: RouteResponse = {
        routes: []
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await expect(calculateRoute(validOrigin, validDestination))
        .rejects.toThrow('No routes found');
    });

    it('should handle server configuration errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ error: 'Route calculation service is not configured' })
      });

      await expect(calculateRoute(validOrigin, validDestination))
        .rejects.toThrow('Route calculation service is not configured');
    });

    it('should handle malformed JSON response', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        }
      });

      await expect(calculateRoute(validOrigin, validDestination))
        .rejects.toThrow('Failed to parse route response');
    });
  });
});