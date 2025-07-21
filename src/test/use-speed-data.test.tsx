import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSpeedData } from '@/hooks/use-speed-data';
import { RouteResponse } from '@/lib/solvice-api';

// Mock route data for testing
const mockRouteData: RouteResponse = {
  code: 'Ok',
  routes: [{
    distance: 1000,
    duration: 60,
    weight: 60,
    weight_name: 'routability',
    legs: [{
      distance: 1000,
      duration: 60,
      weight: 60,
      summary: 'Test route',
      steps: [{
        distance: 500,
        duration: 30,
        geometry: 'encoded_polyline_1',
        weight: 30,
        name: 'Main Street',
        ref: 'A1',
        destinations: 'City Center',
        mode: 'driving',
        maneuver: {
          location: [4.3517, 50.8503],
          bearing_before: 0,
          bearing_after: 90,
          type: 'turn'
        },
        intersections: []
      }, {
        distance: 500,
        duration: 30,
        geometry: 'encoded_polyline_2',
        weight: 30,
        name: 'Second Street',
        mode: 'driving',
        maneuver: {
          location: [4.3517, 50.8503],
          bearing_before: 90,
          bearing_after: 180,
          type: 'turn'
        },
        intersections: []
      }],
      annotation: {
        distance: [250, 250, 250, 250],
        duration: [15, 15, 15, 15],
        datasources: [1, 1, 1, 1],
        nodes: [1, 2, 3, 4],
        weight: [15, 15, 15, 15],
        speed: [16.67, 16.67, 16.67, 16.67]
      }
    }]
  }],
  waypoints: [{
    distance: 0,
    name: 'Start',
    location: [4.3517, 50.8503],
    hint: 'start_hint'
  }, {
    distance: 1000,
    name: 'End',
    location: [4.3527, 50.8513],
    hint: 'end_hint'
  }]
};

describe('useSpeedData', () => {
  it('should return empty arrays when no route is provided', () => {
    const { result } = renderHook(() => useSpeedData({
      route: null,
      selectedRouteIndex: 0
    }));

    expect(result.current.regularSpeedData).toEqual([]);
    expect(result.current.trafficSpeedData).toEqual([]);
    expect(result.current.combinedData).toEqual([]);
    expect(result.current.avgSpeed).toBe(0);
    expect(result.current.avgTrafficSpeed).toBe(null);
  });

  it('should extract speed data from route with steps', () => {
    const { result } = renderHook(() => useSpeedData({
      route: mockRouteData,
      selectedRouteIndex: 0
    }));

    expect(result.current.regularSpeedData).toBeDefined();
    expect(result.current.regularSpeedData.length).toBeGreaterThan(0);
    expect(result.current.avgSpeed).toBeGreaterThan(0);
    
    // Check that speed data points have required properties
    const firstDataPoint = result.current.regularSpeedData[0];
    expect(firstDataPoint).toHaveProperty('distance');
    expect(firstDataPoint).toHaveProperty('speed');
    expect(firstDataPoint).toHaveProperty('distanceLabel');
    expect(firstDataPoint).toHaveProperty('stepIndex');
    expect(firstDataPoint).toHaveProperty('geometry');
  });

  it('should calculate combined data for both regular and traffic routes', () => {
    const { result } = renderHook(() => useSpeedData({
      route: mockRouteData,
      trafficRoute: mockRouteData,
      selectedRouteIndex: 0
    }));

    expect(result.current.combinedData).toBeDefined();
    expect(result.current.combinedData.length).toBeGreaterThan(0);
    expect(result.current.avgSpeed).toBeGreaterThan(0);
    expect(result.current.avgTrafficSpeed).toBeGreaterThan(0);
    
    // Check that combined data includes both speed types
    const firstCombinedPoint = result.current.combinedData[0];
    expect(firstCombinedPoint).toHaveProperty('speed');
    expect(firstCombinedPoint).toHaveProperty('trafficSpeed');
  });

  it('should handle route with annotation data when steps are not available', () => {
    const routeWithoutSteps: RouteResponse = {
      ...mockRouteData,
      routes: [{
        ...mockRouteData.routes[0],
        legs: [{
          ...mockRouteData.routes[0].legs[0],
          steps: [] // No steps, should fall back to annotation
        }]
      }]
    };

    const { result } = renderHook(() => useSpeedData({
      route: routeWithoutSteps,
      selectedRouteIndex: 0
    }));

    expect(result.current.regularSpeedData).toBeDefined();
    expect(result.current.regularSpeedData.length).toBeGreaterThan(0);
    expect(result.current.avgSpeed).toBeGreaterThan(0);
  });

  it('should handle route with leg-level data fallback', () => {
    const routeWithLegData: RouteResponse = {
      ...mockRouteData,
      routes: [{
        ...mockRouteData.routes[0],
        legs: [{
          distance: 1000,
          duration: 60,
          weight: 60,
          summary: 'Test route',
          steps: [], // No steps
          annotation: { // Invalid annotation data
            distance: [],
            duration: [],
            datasources: [],
            nodes: [],
            weight: [],
            speed: []
          }
        }]
      }]
    };

    const { result } = renderHook(() => useSpeedData({
      route: routeWithLegData,
      selectedRouteIndex: 0
    }));

    expect(result.current.regularSpeedData).toBeDefined();
    expect(result.current.regularSpeedData.length).toBe(1);
    expect(result.current.avgSpeed).toBeGreaterThan(0);
    expect(result.current.regularSpeedData[0].geometry).toBeUndefined();
    // Should calculate speed from leg-level data: 1000m/60s * 3.6 = 60 km/h
    expect(result.current.regularSpeedData[0].speed).toBe(60);
  });

  it('should handle invalid route index gracefully', () => {
    const { result } = renderHook(() => useSpeedData({
      route: mockRouteData,
      selectedRouteIndex: 99 // Invalid index
    }));

    expect(result.current.regularSpeedData).toEqual([]);
    expect(result.current.combinedData).toEqual([]);
    expect(result.current.avgSpeed).toBe(0);
  });

  it('should handle routes with no legs', () => {
    const routeWithoutLegs: RouteResponse = {
      ...mockRouteData,
      routes: [{
        ...mockRouteData.routes[0],
        legs: []
      }]
    };

    const { result } = renderHook(() => useSpeedData({
      route: routeWithoutLegs,
      selectedRouteIndex: 0
    }));

    expect(result.current.regularSpeedData).toEqual([]);
    expect(result.current.combinedData).toEqual([]);
    expect(result.current.avgSpeed).toBe(0);
  });

  it('should calculate correct speeds from distance and duration', () => {
    // 500m in 30s = 16.67 m/s = 60 km/h
    const { result } = renderHook(() => useSpeedData({
      route: mockRouteData,
      selectedRouteIndex: 0
    }));

    const firstDataPoint = result.current.regularSpeedData[0];
    expect(firstDataPoint.speed).toBe(60); // 500m/30s * 3.6 = 60 km/h
  });

  it('should preserve geometry and location information', () => {
    const { result } = renderHook(() => useSpeedData({
      route: mockRouteData,
      selectedRouteIndex: 0
    }));

    const firstDataPoint = result.current.regularSpeedData[0];
    expect(firstDataPoint.geometry).toBe('encoded_polyline_1');
    expect(firstDataPoint.locationName).toBe('Main Street');
    expect(firstDataPoint.routeRef).toBe('A1');
    expect(firstDataPoint.destinations).toBe('City Center');
  });

  it('should handle different speed data lengths correctly', () => {
    // Create a traffic route with different timing
    const trafficRouteData: RouteResponse = {
      ...mockRouteData,
      routes: [{
        ...mockRouteData.routes[0],
        legs: [{
          ...mockRouteData.routes[0].legs[0],
          steps: [{
            ...mockRouteData.routes[0].legs[0].steps[0],
            duration: 45 // Different duration for traffic route
          }, {
            ...mockRouteData.routes[0].legs[0].steps[1],
            duration: 45
          }]
        }]
      }]
    };

    const { result } = renderHook(() => useSpeedData({
      route: mockRouteData,
      trafficRoute: trafficRouteData,
      selectedRouteIndex: 0
    }));

    // Should create combined data with resampling
    expect(result.current.combinedData.length).toBeGreaterThan(0);
    expect(result.current.avgSpeed).not.toBe(result.current.avgTrafficSpeed);
    
    // Traffic route should be slower (40 km/h vs 60 km/h)
    expect(result.current.avgTrafficSpeed).toBeLessThan(result.current.avgSpeed);
  });

  it('should interpolate speeds correctly between data points', () => {
    const { result } = renderHook(() => useSpeedData({
      route: mockRouteData,
      selectedRouteIndex: 0
    }));

    // Combined data should have interpolated points between original data points
    expect(result.current.combinedData.length).toBeGreaterThan(result.current.regularSpeedData.length);
    
    // All combined data points should have valid speeds
    const allSpeeds = result.current.combinedData.map(d => d.speed);
    expect(allSpeeds.every(speed => speed !== null && speed > 0)).toBe(true);
  });

  it('should format distance labels correctly', () => {
    const { result } = renderHook(() => useSpeedData({
      route: mockRouteData,
      selectedRouteIndex: 0
    }));

    const firstDataPoint = result.current.regularSpeedData[0];
    expect(firstDataPoint.distanceLabel).toBe('0.0 km');
    
    const lastDataPoint = result.current.regularSpeedData[result.current.regularSpeedData.length - 1];
    expect(lastDataPoint.distanceLabel).toBe('0.5 km'); // 500m = 0.5 km
  });

  it('should memoize results to prevent unnecessary recalculations', () => {
    const { result, rerender } = renderHook(
      (props) => useSpeedData(props),
      {
        initialProps: {
          route: mockRouteData,
          selectedRouteIndex: 0
        }
      }
    );

    const initialRegularData = result.current.regularSpeedData;
    const initialCombinedData = result.current.combinedData;

    // Rerender with same props
    rerender({
      route: mockRouteData,
      selectedRouteIndex: 0
    });

    // Should return the same object references (memoized)
    expect(result.current.regularSpeedData).toBe(initialRegularData);
    expect(result.current.combinedData).toBe(initialCombinedData);
  });

  it('should recalculate when route index changes', () => {
    // Create a route with multiple alternatives
    const multiRouteData: RouteResponse = {
      ...mockRouteData,
      routes: [
        mockRouteData.routes[0], // First route
        {
          ...mockRouteData.routes[0],
          legs: [{
            ...mockRouteData.routes[0].legs[0],
            steps: [{
              ...mockRouteData.routes[0].legs[0].steps[0],
              duration: 60 // Slower alternative route
            }]
          }]
        }
      ]
    };

    const { result, rerender } = renderHook(
      (props) => useSpeedData(props),
      {
        initialProps: {
          route: multiRouteData,
          selectedRouteIndex: 0
        }
      }
    );

    const firstRouteSpeed = result.current.avgSpeed;

    // Switch to second route
    rerender({
      route: multiRouteData,
      selectedRouteIndex: 1
    });

    const secondRouteSpeed = result.current.avgSpeed;
    
    // Should be different speeds
    expect(secondRouteSpeed).not.toBe(firstRouteSpeed);
    expect(secondRouteSpeed).toBeLessThan(firstRouteSpeed); // Second route is slower
  });
});