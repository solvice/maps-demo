'use client';

import { useMapContext } from '@/contexts/map-context';
import { useEffect } from 'react';
import polyline from '@mapbox/polyline';

interface StepHighlightProps {
  geometry: string | null;
  stepIndex: number | null;
}

export function StepHighlight({ geometry, stepIndex }: StepHighlightProps) {
  const map = useMapContext();

  useEffect(() => {
    if (!map) return;

    const sourceId = 'step-highlight-source';
    const layerId = 'step-highlight-layer';

    // Clean up existing layer and source
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId);
    }

    // If no geometry to highlight, just clean up and return
    if (!geometry) {
      return;
    }

    try {
      // Decode polyline geometry to coordinates
      const coordinates = polyline.decode(geometry);
      
      // Convert to GeoJSON format (swap lat/lng to lng/lat)
      const geojsonCoordinates = coordinates.map(([lat, lng]) => [lng, lat]);
      
      console.log(`🎯 Highlighting step ${stepIndex} with ${coordinates.length} points`);
      
      // Add source with step geometry
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            stepIndex
          },
          geometry: {
            type: 'LineString',
            coordinates: geojsonCoordinates
          }
        }
      });

      // Add highlight layer
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ff6b6b', // Red highlight color
          'line-width': 6,
          'line-opacity': 0.8
        }
      });

    } catch (error) {
      console.error('Error highlighting step geometry:', error);
    }

    // Cleanup function
    return () => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };

  }, [map, geometry, stepIndex]);

  return null; // This component doesn't render anything visible
}