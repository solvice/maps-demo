/**
 * Multi-Waypoint API Tests
 * 
 * Tests for the enhanced solvice-api.ts multi-waypoint functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateRoute, calculateMultiWaypointRoute } from '@/lib/solvice-api';
import { RoutePoint, RoutePointManager } from '@/lib/route-points';
import { Coordinates } from '@/lib/coordinates';

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('calculateRoute (multi-format support)', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

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

  it('should handle legacy format [origin, destination]', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRouteResponse
    });

    const origin: Coordinates = [3.7174, 51.0543];
    const destination: Coordinates = [3.7274, 51.0643];
    
    const result = await calculateRoute([origin, destination], {
      vehicleType: 'CAR',
      steps: true
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: [origin, destination],
        vehicleType: 'CAR',
        steps: true
      })
    });

    expect(result).toEqual(mockRouteResponse);
  });

  it('should handle RoutePoint array format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRouteResponse
    });

    const routePoints: RoutePoint[] = [
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

    const result = await calculateRoute(routePoints, {
      vehicleType: 'TRUCK',
      steps: false
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: [
          [3.7174, 51.0543],
          [3.7200, 51.0600], 
          [3.7274, 51.0643]
        ],
        vehicleType: 'TRUCK',
        steps: false
      })
    });

    expect(result).toEqual(mockRouteResponse);
  });

  it('should reject insufficient route points', async () => {
    const origin: Coordinates = [3.7174, 51.0543];
    
    await expect(calculateRoute([origin])).rejects.toThrow('At least 2 route points are required');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should validate coordinates in legacy format', async () => {
    const invalidOrigin: Coordinates = [181, 51.0543]; // Invalid longitude
    const destination: Coordinates = [3.7274, 51.0643];
    
    await expect(calculateRoute([invalidOrigin, destination])).rejects.toThrow('Invalid origin coordinates');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should validate coordinates in RoutePoint format', async () => {
    const routePoints: RoutePoint[] = [
      {
        id: 'origin',
        coordinates: [3.7174, 51.0543],
        type: 'origin'
      },
      {
        id: 'destination', 
        coordinates: [181, 51.0643], // Invalid longitude
        type: 'destination'
      }
    ];

    await expect(calculateRoute(routePoints)).rejects.toThrow('Invalid coordinates at position 2');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error: 'Invalid request' })
    });

    const origin: Coordinates = [3.7174, 51.0543];
    const destination: Coordinates = [3.7274, 51.0643];

    await expect(calculateRoute([origin, destination])).rejects.toThrow('Invalid request');
  });

  it('should handle rate limiting', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests'
    });

    const origin: Coordinates = [3.7174, 51.0543];
    const destination: Coordinates = [3.7274, 51.0643];

    await expect(calculateRoute([origin, destination])).rejects.toThrow('Rate limit exceeded. Please try again later.');
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const origin: Coordinates = [3.7174, 51.0543];
    const destination: Coordinates = [3.7274, 51.0643];

    await expect(calculateRoute([origin, destination])).rejects.toThrow('Network error - please check your connection');
  });
});

describe('calculateMultiWaypointRoute', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  const mockRouteResponse = {
    code: 'Ok',
    routes: [{
      distance: 15000,
      duration: 900,
      geometry: 'encoded-polyline-multi',
      weight: 900,
      weight_name: 'routability',
      legs: [
        {
          distance: 7500,
          duration: 450,
          weight: 450,
          summary: 'First leg',
          steps: [],
          annotation: {
            distance: [3750, 3750],
            duration: [225, 225],
            datasources: [1, 1],
            nodes: [1, 2, 3],
            weight: [225, 225],
            speed: [60, 60]
          }
        },
        {
          distance: 7500,
          duration: 450,
          weight: 450,
          summary: 'Second leg',
          steps: [],
          annotation: {
            distance: [3750, 3750],
            duration: [225, 225],
            datasources: [1, 1],
            nodes: [3, 4, 5],
            weight: [225, 225],
            speed: [60, 60]
          }
        }
      ]
    }],
    waypoints: [
      { distance: 0, name: 'Origin', location: [3.7174, 51.0543], hint: 'test' },
      { distance: 7500, name: 'Waypoint 1', location: [3.7200, 51.0600], hint: 'test' },
      { distance: 15000, name: 'Destination', location: [3.7274, 51.0643], hint: 'test' }
    ]
  };

  it('should calculate route for multiple waypoints', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRouteResponse
    });

    const routePoints: RoutePoint[] = [
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

    const result = await calculateMultiWaypointRoute(routePoints, {
      vehicleType: 'CAR',
      steps: true,
      geometries: 'polyline'
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: [
          [3.7174, 51.0543],
          [3.7200, 51.0600],
          [3.7274, 51.0643]
        ],
        vehicleType: 'CAR',
        steps: true,
        geometries: 'polyline'
      })
    });

    expect(result).toEqual(mockRouteResponse);
  });

  it('should require at least 2 route points', async () => {
    const singlePoint: RoutePoint[] = [{
      id: 'origin',
      coordinates: [3.7174, 51.0543],
      type: 'origin'
    }];

    await expect(calculateMultiWaypointRoute(singlePoint)).rejects.toThrow('At least 2 route points are required');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should validate each coordinate in the route', async () => {
    const invalidRoutePoints: RoutePoint[] = [
      {
        id: 'origin',
        coordinates: [3.7174, 51.0543],
        type: 'origin'
      },
      {
        id: 'waypoint-1',
        coordinates: [200, 51.0600], // Invalid longitude
        type: 'waypoint'
      },
      {
        id: 'destination',
        coordinates: [3.7274, 51.0643],
        type: 'destination'
      }
    ];

    await expect(calculateMultiWaypointRoute(invalidRoutePoints)).rejects.toThrow(
      'Invalid coordinates for waypoint at position 2: [200, 51.06]'
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle empty route response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ routes: [], waypoints: [] })
    });

    const routePoints: RoutePoint[] = [
      { id: 'origin', coordinates: [3.7174, 51.0543], type: 'origin' },
      { id: 'destination', coordinates: [3.7274, 51.0643], type: 'destination' }
    ];

    await expect(calculateMultiWaypointRoute(routePoints)).rejects.toThrow('No routes found for the given waypoints');
  });

  it('should provide detailed error messages for API failures', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ error: 'Too many waypoints' })
    });

    const routePoints: RoutePoint[] = [
      { id: 'origin', coordinates: [3.7174, 51.0543], type: 'origin' },
      { id: 'destination', coordinates: [3.7274, 51.0643], type: 'destination' }
    ];

    await expect(calculateMultiWaypointRoute(routePoints)).rejects.toThrow('Too many waypoints');
  });

  it('should handle malformed JSON responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => { throw new Error('Invalid JSON'); }
    });

    const routePoints: RoutePoint[] = [
      { id: 'origin', coordinates: [3.7174, 51.0543], type: 'origin' },
      { id: 'destination', coordinates: [3.7274, 51.0643], type: 'destination' }
    ];

    await expect(calculateMultiWaypointRoute(routePoints)).rejects.toThrow(
      'Failed to parse multi-waypoint route response - invalid JSON'
    );
  });
});