import { useEffect, useRef } from 'react';
import { useMapContext } from '@/contexts/map-context';
import { RouteResponse } from '@/lib/solvice-api';
import { fitMapToRoute } from '@/lib/route-utils';

interface UseAutoZoomOptions {
  geometryFormat?: 'polyline' | 'geojson' | 'polyline6';
  padding?: number;
  animate?: boolean;
  enabled?: boolean;
}

/**
 * Custom hook for automatic map zoom to route bounds
 * Only triggers once per unique route to prevent multiple zoom attempts
 */
export function useAutoZoom(
  route: RouteResponse | null,
  options: UseAutoZoomOptions = {}
) {
  const {
    geometryFormat = 'polyline',
    padding = 50,
    animate = true,
    enabled = true
  } = options;

  const map = useMapContext();
  const lastZoomedRouteRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || !map || !route?.routes?.length) {
      return;
    }

    // Create unique identifier for this route based on geometry
    const routeId = route.routes.map(r => r.geometry).join('|');

    // Only zoom if this is a new/different route
    if (routeId !== lastZoomedRouteRef.current) {
      const success = fitMapToRoute(map, route, {
        geometryFormat,
        padding,
        animate
      });

      if (success) {
        lastZoomedRouteRef.current = routeId;
      }
    }
  }, [map, route, geometryFormat, padding, animate, enabled]);

  // Return function to manually clear zoom tracking (useful for testing)
  const resetZoomTracking = () => {
    lastZoomedRouteRef.current = null;
  };

  return { resetZoomTracking };
}