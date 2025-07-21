import maplibregl from 'maplibre-gl';
import { RouteResponse } from '@/lib/solvice-api';
import { Coordinates, getBounds } from '@/lib/coordinates';
import { decodePolyline } from '@/lib/polyline';
import { RouteConfig } from '@/components/route-control-panel';

/**
 * Extracts all coordinates from a route response based on geometry format
 */
export function extractRouteCoordinates(
  route: RouteResponse,
  geometryFormat: 'polyline' | 'geojson' | 'polyline6' = 'polyline'
): Coordinates[] {
  if (!route || !route.routes || route.routes.length === 0) {
    return [];
  }

  const allCoordinates: Coordinates[] = [];

  route.routes.forEach((routeData) => {
    const geometry = routeData.geometry;
    if (!geometry) return;

    let coordinates: Coordinates[];

    if (geometryFormat === 'geojson') {
      try {
        const geojson = JSON.parse(geometry);
        coordinates = geojson.coordinates || [];
      } catch {
        console.error('Failed to parse GeoJSON geometry');
        return;
      }
    } else if (geometryFormat === 'polyline6') {
      coordinates = decodePolyline(geometry, 6);
    } else {
      coordinates = decodePolyline(geometry, 5);
    }

    allCoordinates.push(...coordinates);
  });

  return allCoordinates;
}

/**
 * Calculates bounds for a route response
 */
export function getRouteBounds(
  route: RouteResponse,
  geometryFormat?: 'polyline' | 'geojson' | 'polyline6'
): [[number, number], [number, number]] | null {
  const coordinates = extractRouteCoordinates(route, geometryFormat);
  
  if (coordinates.length === 0) {
    return null;
  }

  return getBounds(coordinates);
}

/**
 * Fits map to route bounds with optional padding
 */
export function fitMapToRoute(
  map: maplibregl.Map,
  route: RouteResponse,
  options: {
    geometryFormat?: 'polyline' | 'geojson' | 'polyline6';
    padding?: number;
    animate?: boolean;
  } = {}
): boolean {
  const { geometryFormat = 'polyline', padding = 50, animate = true } = options;
  
  const bounds = getRouteBounds(route, geometryFormat);
  
  if (!bounds) {
    return false;
  }

  try {
    // Use LngLatBounds constructor for better compatibility
    const [[minLng, minLat], [maxLng, maxLat]] = bounds;
    const lngLatBounds = new maplibregl.LngLatBounds([minLng, minLat], [maxLng, maxLat]);
    
    if (animate) {
      map.fitBounds(lngLatBounds, { padding });
    } else {
      map.fitBounds(lngLatBounds, { padding, animate: false });
    }
    
    return true;
  } catch (error) {
    console.error('Failed to fit map to route bounds:', error);
    return false;
  }
}

/**
 * Calculates the traffic difference between regular and traffic routes
 * Returns the difference in seconds (positive for delay, negative for savings)
 */
export function calculateTrafficDifference(
  regularRoute: RouteResponse | null | undefined,
  trafficRoute: RouteResponse | null | undefined
): number | null {
  if (!regularRoute || !trafficRoute) {
    return null;
  }

  if (!regularRoute.routes || regularRoute.routes.length === 0) {
    return null;
  }

  if (!trafficRoute.routes || trafficRoute.routes.length === 0) {
    return null;
  }

  const regularDuration = regularRoute.routes[0].duration;
  const trafficDuration = trafficRoute.routes[0].duration;

  if (regularDuration === undefined || trafficDuration === undefined) {
    return null;
  }

  return trafficDuration - regularDuration;
}

/**
 * Formats traffic difference in seconds to human-readable format
 * Returns strings like "+3 min", "-1h 5m", or "No delay"
 */
export function formatTrafficDifference(seconds: number | null): string {
  if (seconds === null) {
    return '';
  }

  if (seconds === 0) {
    return 'No delay';
  }

  const absSeconds = Math.abs(seconds);
  const sign = seconds > 0 ? '+' : '-';
  
  // Only show differences of 1 minute or more (< 45 seconds is "No delay")
  const minutes = absSeconds < 45 ? 0 : Math.round(absSeconds / 60);
  
  if (minutes === 0) {
    return 'No delay';
  }

  if (minutes < 60) {
    return `${sign}${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${sign}${hours}h`;
  }

  return `${sign}${hours}h ${remainingMinutes}m`;
}

/**
 * Determines if traffic comparison should be enabled based on route config
 * Traffic comparison is now always enabled for all routing engines
 */
export function shouldEnableTrafficComparison(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _config: RouteConfig | null | undefined
): boolean {
  // Always enable traffic comparison
  return true;
}

/**
 * Creates a traffic-enabled route config by setting TOMTOM engine and current departure time
 */
export function createTrafficRouteConfig(
  baseConfig: RouteConfig | null | undefined
): RouteConfig {
  const config = baseConfig || {};
  
  return {
    ...config,
    routingEngine: 'TOMTOM',
    departureTime: new Date().toISOString()
  };
}