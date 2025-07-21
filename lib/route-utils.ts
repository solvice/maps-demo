import maplibregl from 'maplibre-gl';
import { RouteResponse } from '@/lib/solvice-api';
import { Coordinates, getBounds } from '@/lib/coordinates';
import { decodePolyline } from '@/lib/polyline';

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
    if (animate) {
      map.fitBounds(bounds, { padding });
    } else {
      map.fitBounds(bounds, { padding, animate: false });
    }
    return true;
  } catch (error) {
    console.error('Failed to fit map to route bounds:', error);
    return false;
  }
}