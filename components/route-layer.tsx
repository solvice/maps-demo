'use client';

import { useEffect } from 'react';
import { useMapContext } from '@/contexts/map-context';
import { RouteResponse } from '@/lib/solvice-api';
import { decodePolyline } from '@/lib/polyline';

interface RouteLayerProps {
  route: RouteResponse | null;
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

export function RouteLayer({ route, style = DEFAULT_STYLE }: RouteLayerProps) {
  const map = useMapContext();

  useEffect(() => {
    if (!map) return;

    const sourceId = 'route';
    const layerId = 'route';

    // Clean up existing route
    const cleanup = () => {
      try {
        if (map.getLayer && map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource && map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };

    // Remove existing route
    cleanup();

    // Add new route if provided
    if (route && route.routes && route.routes.length > 0) {
      try {
        const geometry = route.routes[0].geometry;
        if (!geometry) {
          console.error('No geometry found in route response');
          return;
        }
        const coordinates = decodePolyline(geometry);

        // Add route source
        map.addSource(sourceId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates
            }
          }
        });

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
            'line-color': style.color || DEFAULT_STYLE.color,
            'line-width': style.width || DEFAULT_STYLE.width,
            'line-opacity': style.opacity || DEFAULT_STYLE.opacity
          }
        });
      } catch (error) {
        console.error('Failed to add route layer:', error);
      }
    }

    // Cleanup function for unmount
    return () => {
      try {
        if (map && map.getLayer && map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map && map.getSource && map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, [map, route, style.color, style.width, style.opacity]);

  return null; // This component doesn't render anything directly
}