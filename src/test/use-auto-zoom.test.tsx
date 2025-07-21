import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAutoZoom } from '@/hooks/use-auto-zoom';
import { useMapContext } from '@/contexts/map-context';
import { RouteResponse } from '@/lib/solvice-api';
import * as routeUtils from '@/lib/route-utils';

// Mock the map context
vi.mock('@/contexts/map-context');
// Mock the route utils
vi.mock('@/lib/route-utils');

describe('useAutoZoom', () => {
  const mockMap = {
    fitBounds: vi.fn(),
    getCenter: vi.fn(),
    getZoom: vi.fn(),
  };

  const mockRoute: RouteResponse = {
    code: 'Ok',
    waypoints: [
      { distance: 0, name: 'Origin', location: [3.7174, 51.0543], hint: 'test' },
      { distance: 100, name: 'Destination', location: [3.7200, 51.0550], hint: 'test' }
    ],
    routes: [
      {
        distance: 1000,
        duration: 300,
        geometry: 'u{~vFvyys@fS]',
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

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMapContext).mockReturnValue(mockMap as any);
    vi.mocked(routeUtils.fitMapToRoute).mockReturnValue(true);
  });

  it('should call fitMapToRoute when route is provided', () => {
    renderHook(() => useAutoZoom(mockRoute));

    expect(routeUtils.fitMapToRoute).toHaveBeenCalledWith(
      mockMap,
      mockRoute,
      { 
        geometryFormat: 'polyline', 
        padding: 50,
        animate: true 
      }
    );
  });

  it('should not call fitMapToRoute when disabled', () => {
    renderHook(() => useAutoZoom(mockRoute, { enabled: false }));

    expect(routeUtils.fitMapToRoute).not.toHaveBeenCalled();
  });

  it('should not call fitMapToRoute when map is not available', () => {
    vi.mocked(useMapContext).mockReturnValue(null);
    
    renderHook(() => useAutoZoom(mockRoute));

    expect(routeUtils.fitMapToRoute).not.toHaveBeenCalled();
  });

  it('should not call fitMapToRoute when route is null', () => {
    renderHook(() => useAutoZoom(null));

    expect(routeUtils.fitMapToRoute).not.toHaveBeenCalled();
  });

  it('should use custom options when provided', () => {
    const options = {
      geometryFormat: 'geojson' as const,
      padding: 100,
      animate: false
    };

    renderHook(() => useAutoZoom(mockRoute, options));

    expect(routeUtils.fitMapToRoute).toHaveBeenCalledWith(
      mockMap,
      mockRoute,
      options
    );
  });

  it('should only zoom once for the same route', () => {
    const { rerender } = renderHook(
      ({ route }) => useAutoZoom(route),
      { initialProps: { route: mockRoute } }
    );

    expect(routeUtils.fitMapToRoute).toHaveBeenCalledTimes(1);

    // Re-render with same route
    rerender({ route: mockRoute });
    
    // Should not call fitMapToRoute again
    expect(routeUtils.fitMapToRoute).toHaveBeenCalledTimes(1);
  });

  it('should zoom again for different route', () => {
    const { rerender } = renderHook(
      ({ route }) => useAutoZoom(route),
      { initialProps: { route: mockRoute } }
    );

    expect(routeUtils.fitMapToRoute).toHaveBeenCalledTimes(1);

    // Create different route with different geometry
    const differentRoute = {
      ...mockRoute,
      routes: [
        {
          ...mockRoute.routes[0],
          geometry: 'different_geometry_string'
        }
      ]
    };

    rerender({ route: differentRoute });
    
    // Should call fitMapToRoute again for new route
    expect(routeUtils.fitMapToRoute).toHaveBeenCalledTimes(2);
  });

  it('should provide resetZoomTracking function', () => {
    const { result } = renderHook(() => useAutoZoom(mockRoute));

    expect(result.current.resetZoomTracking).toBeTypeOf('function');
  });

  it('should allow zooming again after resetZoomTracking', () => {
    const { result, rerender } = renderHook(
      ({ route }) => useAutoZoom(route),
      { initialProps: { route: mockRoute } }
    );

    expect(routeUtils.fitMapToRoute).toHaveBeenCalledTimes(1);

    // Reset tracking
    result.current.resetZoomTracking();

    // Re-render with new route object (same geometry but different reference)
    const sameRouteNewReference = { ...mockRoute };
    rerender({ route: sameRouteNewReference });
    
    // Should call fitMapToRoute again after reset
    expect(routeUtils.fitMapToRoute).toHaveBeenCalledTimes(2);
  });
});