import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { RouteManager } from '@/components/route-manager';
import { useMapContext } from '@/contexts/map-context';
import { RouteResponse } from '@/lib/solvice-api';
import * as routeUtils from '@/lib/route-utils';

// Mock the map context
vi.mock('@/contexts/map-context');
// Mock the route utils
vi.mock('@/lib/route-utils');

describe('RouteManager', () => {
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

  it('should not render anything visible', () => {
    const { container } = render(
      <RouteManager route={null} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('should call fitMapToRoute when route is provided and autoZoom is enabled', () => {
    render(
      <RouteManager 
        route={mockRoute} 
        geometryFormat="polyline"
        autoZoom={true}
      />
    );

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

  it('should not call fitMapToRoute when autoZoom is disabled', () => {
    render(
      <RouteManager 
        route={mockRoute} 
        geometryFormat="polyline"
        autoZoom={false}
      />
    );

    expect(routeUtils.fitMapToRoute).not.toHaveBeenCalled();
  });

  it('should not call fitMapToRoute when map is not available', () => {
    vi.mocked(useMapContext).mockReturnValue(null);
    
    render(
      <RouteManager 
        route={mockRoute} 
        geometryFormat="polyline"
        autoZoom={true}
      />
    );

    expect(routeUtils.fitMapToRoute).not.toHaveBeenCalled();
  });

  it('should not call fitMapToRoute when route is null', () => {
    render(
      <RouteManager 
        route={null} 
        geometryFormat="polyline"
        autoZoom={true}
      />
    );

    expect(routeUtils.fitMapToRoute).not.toHaveBeenCalled();
  });

  it('should use default geometry format when not specified', () => {
    render(
      <RouteManager 
        route={mockRoute} 
        autoZoom={true}
      />
    );

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
});