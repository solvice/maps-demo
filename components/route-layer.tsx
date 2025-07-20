'use client';

import { useEffect } from 'react';
import { useMapContext } from '@/contexts/map-context';
import { RouteResponse } from '@/lib/solvice-api';
import { decodePolyline } from '@/lib/polyline';

interface RouteLayerProps {
  route: RouteResponse | null;
  geometryFormat?: 'polyline' | 'geojson' | 'polyline6';
  highlightedRoute?: number | null;
  style?: {
    color?: string;
    width?: number;
    opacity?: number;
  };
}

const DEFAULT_STYLE = {
  color: '#3b82f6',
  width: 4,
  opacity: 0.8,
};

const ROUTE_COLORS = [
  '#3b82f6', // Blue for primary route
  '#93c5fd', // Light blue for alternatives
  '#93c5fd', // Light blue for alternatives
  '#93c5fd'  // Light blue for alternatives
];

export function RouteLayer({ route, geometryFormat = 'polyline', highlightedRoute = null, style = DEFAULT_STYLE }: RouteLayerProps) {
  const map = useMapContext();

  useEffect(() => {
    if (!map) return;

    // Clean up all existing routes
    const cleanup = () => {
      try {
        // Clean up all possible route layers (up to 4)
        for (let i = 0; i < 4; i++) {
          const layerId = `route-${i}`;
          const sourceId = `route-${i}`;
          
          if (map.getLayer && map.getLayer(layerId)) {
            map.removeLayer(layerId);
          }
          if (map.getSource && map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        }
      } catch {
        // Ignore cleanup errors
      }
    };

    // Remove existing routes
    cleanup();

    // Add new routes if provided
    if (route && route.routes && route.routes.length > 0) {
      try {
        route.routes.forEach((routeData, index) => {
          const geometry = routeData.geometry;
          if (!geometry) {
            console.error(`No geometry found in route ${index}`);
            return;
          }
          
          let coordinates: [number, number][];
          
          if (geometryFormat === 'geojson') {
            // Handle GeoJSON geometry
            try {
              const geojson = JSON.parse(geometry);
              coordinates = geojson.coordinates || [];
            } catch {
              console.error(`Failed to parse GeoJSON geometry for route ${index}`);
              return;
            }
          } else if (geometryFormat === 'polyline6') {
            // Handle polyline6 with 6 decimal precision
            coordinates = decodePolyline(geometry, 6);
          } else {
            // Handle standard polyline with 5 decimal precision
            coordinates = decodePolyline(geometry, 5);
          }
          const sourceId = `route-${index}`;
          const layerId = `route-${index}`;
          const routeColor = ROUTE_COLORS[index] || ROUTE_COLORS[0];

          // Add route source
          map.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: { routeIndex: index },
              geometry: {
                type: 'LineString',
                coordinates
              }
            }
          });

          // Determine line width based on highlighting
          let lineWidth = 3; // Default for alternative routes
          if (index === 0) {
            lineWidth = style.width || DEFAULT_STYLE.width; // Primary route
          }
          if (highlightedRoute === index) {
            lineWidth += 2; // Make highlighted route bigger
          }

          // Add route layer
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': routeColor,
              'line-width': lineWidth,
              'line-opacity': style.opacity || DEFAULT_STYLE.opacity
            }
          });
        });
      } catch (err) {
        console.error('Failed to add route layers:', err);
      }
    }

    // Cleanup function for unmount
    return () => {
      try {
        if (map) {
          for (let i = 0; i < 4; i++) {
            const layerId = `route-${i}`;
            const sourceId = `route-${i}`;
            
            if (map.getLayer && map.getLayer(layerId)) {
              map.removeLayer(layerId);
            }
            if (map.getSource && map.getSource(sourceId)) {
              map.removeSource(sourceId);
            }
          }
        }
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [map, route, geometryFormat, highlightedRoute, style.color, style.width, style.opacity]);

  return null; // This component doesn't render anything directly
}