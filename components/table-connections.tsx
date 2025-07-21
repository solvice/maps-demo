"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Coordinates } from "@/lib/coordinates";
import { useMapContext } from "@/contexts/map-context";
import { TableResponse } from "@/lib/solvice-table-api";

// Generate color based on traffic impact percentage using dynamic max impact
function getTrafficImpactColor(impactRatio: number, maxImpact: number): string {
  // impactRatio: 1.0 = blue (no impact), maxImpact = red (maximum impact found in data)
  // Clamp between 1.0 and maxImpact for color interpolation
  const normalizedRatio = Math.min(Math.max(impactRatio, 1.0), maxImpact);
  const impactRange = Math.max(maxImpact - 1.0, 0.01); // Avoid division by zero
  const t = (normalizedRatio - 1.0) / impactRange; // 0 = blue, 1 = red
  
  // Interpolate from blue (#3b82f6) to red (#ef4444)
  const blue = { r: 59, g: 130, b: 246 };
  const red = { r: 239, g: 68, b: 68 };
  
  const r = Math.round(blue.r + (red.r - blue.r) * t);
  const g = Math.round(blue.g + (red.g - blue.g) * t);
  const b = Math.round(blue.b + (red.b - blue.b) * t);
  
  return `rgb(${r}, ${g}, ${b})`;
}

interface TableConnectionsProps {
  coordinates: Coordinates[];
  hoveredMarkerIndex: number | null;
  table: TableResponse | null;
  trafficTable?: TableResponse | null;
  trafficImpacts?: number[][] | null;
  maxTrafficImpact?: number;
}

export function TableConnections({
  coordinates,
  hoveredMarkerIndex,
  table,
  trafficTable,
  trafficImpacts,
  maxTrafficImpact = 1.0,
}: TableConnectionsProps) {
  const map = useMapContext();
  const sourceIdRef = useRef<string>('table-connections');

  // Add background lines showing all connections when table is calculated
  useEffect(() => {
    if (!map || coordinates.length < 2) return;

    const backgroundSourceId = 'table-background-connections';

    // Remove existing background lines
    if (map.getLayer(backgroundSourceId + '-layer')) {
      map.removeLayer(backgroundSourceId + '-layer');
    }
    if (map.getSource(backgroundSourceId)) {
      map.removeSource(backgroundSourceId);
    }

    if (table) {
      // Create all possible connections with traffic impact colors
      const backgroundFeatures = [];
      for (let i = 0; i < coordinates.length; i++) {
        for (let j = i + 1; j < coordinates.length; j++) {
          let trafficImpactColor = '#9ca3af'; // default gray
          
          // Use traffic impact color if available
          if (trafficImpacts && trafficImpacts[i] && trafficImpacts[i][j]) {
            const impactRatio = trafficImpacts[i][j];
            trafficImpactColor = getTrafficImpactColor(impactRatio, maxTrafficImpact);
          }
          
          backgroundFeatures.push({
            type: 'Feature' as const,
            properties: {
              sourceIndex: i,
              destIndex: j,
              trafficImpact: trafficImpactColor,
            },
            geometry: {
              type: 'LineString' as const,
              coordinates: [coordinates[i], coordinates[j]]
            }
          });
        }
      }

      const backgroundGeojson = {
        type: 'FeatureCollection' as const,
        features: backgroundFeatures
      };

      // Add background source and layer
      map.addSource(backgroundSourceId, {
        type: 'geojson',
        data: backgroundGeojson
      });

      map.addLayer({
        id: backgroundSourceId + '-layer',
        type: 'line',
        source: backgroundSourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': [
            'case',
            ['has', 'trafficImpact'],
            ['get', 'trafficImpact'],
            '#9ca3af' // fallback color
          ],
          'line-width': 2,
          'line-opacity': 0.6
        }
      });

      // Add hover effect for background lines
      let backgroundPopup: maplibregl.Popup | null = null;

      const handleBackgroundMouseEnter = (e: maplibregl.MapMouseEvent) => {
        if (!table || !e.features?.[0]) return;

        const feature = e.features[0];
        const sourceIndex = feature.properties?.sourceIndex;
        const destIndex = feature.properties?.destIndex;

        if (sourceIndex !== undefined && destIndex !== undefined) {
          const duration = table.durations?.[sourceIndex]?.[destIndex];
          const distance = table.distances?.[sourceIndex]?.[destIndex];
          const trafficDuration = trafficTable?.durations?.[sourceIndex]?.[destIndex];

          if (duration !== undefined && distance !== undefined) {
            const durationMin = Math.round(duration / 60);
            const distanceKm = (distance / 1000).toFixed(1);
            
            let trafficInfo = '';
            if (trafficDuration && trafficDuration !== duration) {
              const trafficMin = Math.round(trafficDuration / 60);
              const impactPercent = Math.round((trafficDuration / duration) * 100);
              trafficInfo = `<br/>With Traffic: ${trafficMin} min (${impactPercent}%)`;
            }
            
            backgroundPopup = new maplibregl.Popup({
              closeButton: false,
              closeOnClick: false,
              offset: [0, -10]
            })
              .setLngLat(e.lngLat)
              .setHTML(`
                <div class="text-xs font-medium text-gray-600">
                  Distance: ${distanceKm} km<br/>
                  Baseline: ${durationMin} min${trafficInfo}
                </div>
              `)
              .addTo(map);
          }
        }
      };

      const handleBackgroundMouseLeave = () => {
        if (backgroundPopup) {
          backgroundPopup.remove();
          backgroundPopup = null;
        }
      };

      map.on('mouseenter', backgroundSourceId + '-layer', handleBackgroundMouseEnter);
      map.on('mouseleave', backgroundSourceId + '-layer', handleBackgroundMouseLeave);
    }

    return () => {
      if (map) {
        try {
          // Cleanup background event handlers
          if (table) {
            map.off('mouseenter', backgroundSourceId + '-layer');
            map.off('mouseleave', backgroundSourceId + '-layer');
          }
          
          if (map.getLayer(backgroundSourceId + '-layer')) {
            map.removeLayer(backgroundSourceId + '-layer');
          }
          if (map.getSource(backgroundSourceId)) {
            map.removeSource(backgroundSourceId);
          }
        } catch (error) {
          console.warn('Error during background connections cleanup:', error);
        }
      }
    };
  }, [map, coordinates, table, trafficTable, trafficImpacts, maxTrafficImpact]);

  // Handle hover lines
  useEffect(() => {
    if (!map || hoveredMarkerIndex === null || coordinates.length < 2) {
      // Remove existing hover lines
      if (map?.getLayer(sourceIdRef.current + '-layer-top')) {
        map.removeLayer(sourceIdRef.current + '-layer-top');
      }
      if (map?.getLayer(sourceIdRef.current + '-layer')) {
        map.removeLayer(sourceIdRef.current + '-layer');
      }
      if (map?.getSource(sourceIdRef.current)) {
        map.removeSource(sourceIdRef.current);
      }
      return;
    }

    const hoveredCoord = coordinates[hoveredMarkerIndex];
    if (!hoveredCoord) return;

    // Create line features to all other coordinates with traffic impact colors
    const features = coordinates
      .map((coord, index) => {
        if (index === hoveredMarkerIndex) return null;
        
        let trafficImpactColor = '#3b82f6'; // default blue
        
        // Use traffic impact color if available
        if (trafficImpacts && trafficImpacts[hoveredMarkerIndex] && trafficImpacts[hoveredMarkerIndex][index]) {
          const impactRatio = trafficImpacts[hoveredMarkerIndex][index];
          trafficImpactColor = getTrafficImpactColor(impactRatio, maxTrafficImpact);
        } else if (trafficImpacts && trafficImpacts[index] && trafficImpacts[index][hoveredMarkerIndex]) {
          // Try reverse direction
          const impactRatio = trafficImpacts[index][hoveredMarkerIndex];
          trafficImpactColor = getTrafficImpactColor(impactRatio, maxTrafficImpact);
        }
        
        return {
          type: 'Feature' as const,
          properties: {
            sourceIndex: hoveredMarkerIndex,
            destIndex: index,
            trafficImpact: trafficImpactColor,
          },
          geometry: {
            type: 'LineString' as const,
            coordinates: [hoveredCoord, coord]
          }
        };
      })
      .filter(Boolean);

    const geojson = {
      type: 'FeatureCollection' as const,
      features: features
    };

    // Remove existing source/layer if they exist
    if (map.getLayer(sourceIdRef.current + '-layer-top')) {
      map.removeLayer(sourceIdRef.current + '-layer-top');
    }
    if (map.getLayer(sourceIdRef.current + '-layer')) {
      map.removeLayer(sourceIdRef.current + '-layer');
    }
    if (map.getSource(sourceIdRef.current)) {
      map.removeSource(sourceIdRef.current);
    }

    // Add new source and layer
    map.addSource(sourceIdRef.current, {
      type: 'geojson',
      data: geojson
    });

    // Add the layer behind any existing layers but still visible
    map.addLayer({
      id: sourceIdRef.current + '-layer',
      type: 'line',
      source: sourceIdRef.current,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': [
          'case',
          ['has', 'trafficImpact'],
          ['get', 'trafficImpact'],
          '#3b82f6' // fallback color
        ],
        'line-width': 4,
        'line-opacity': 0.8
      }
    });

    // Also add a thinner line on top for better visibility
    map.addLayer({
      id: sourceIdRef.current + '-layer-top',
      type: 'line',
      source: sourceIdRef.current,
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': [
          'case',
          ['has', 'trafficImpact'],
          ['get', 'trafficImpact'],
          '#3b82f6' // fallback color
        ],
        'line-width': 2,
        'line-opacity': 1.0
      }
    });

    // Add hover effect for lines
    let popup: maplibregl.Popup | null = null;

    const handleMouseEnter = (e: maplibregl.MapMouseEvent) => {
      if (!table || !e.features?.[0]) return;

      const feature = e.features[0];
      const sourceIndex = feature.properties?.sourceIndex;
      const destIndex = feature.properties?.destIndex;

      if (sourceIndex !== undefined && destIndex !== undefined) {
        const duration = table.durations?.[sourceIndex]?.[destIndex];
        const distance = table.distances?.[sourceIndex]?.[destIndex];
        const trafficDuration = trafficTable?.durations?.[sourceIndex]?.[destIndex];

        if (duration !== undefined && distance !== undefined) {
          const durationMin = Math.round(duration / 60);
          const distanceKm = (distance / 1000).toFixed(1);
          
          let trafficInfo = '';
          if (trafficDuration && trafficDuration !== duration) {
            const trafficMin = Math.round(trafficDuration / 60);
            const impactPercent = Math.round((trafficDuration / duration) * 100);
            trafficInfo = `<br/>With Traffic: ${trafficMin} min (${impactPercent}%)`;
          }
          
          popup = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: [0, -10]
          })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div class="text-xs font-medium">
                Distance: ${distanceKm} km<br/>
                Baseline: ${durationMin} min${trafficInfo}
              </div>
            `)
            .addTo(map);
        }
      }
    };

    const handleMouseLeave = () => {
      if (popup) {
        popup.remove();
        popup = null;
      }
    };

    map.on('mouseenter', sourceIdRef.current + '-layer', handleMouseEnter);
    map.on('mouseleave', sourceIdRef.current + '-layer', handleMouseLeave);

    const sourceId = sourceIdRef.current;
    return () => {
      if (map) {
        try {
          map.off('mouseenter', sourceId + '-layer', handleMouseEnter);
          map.off('mouseleave', sourceId + '-layer', handleMouseLeave);
        } catch (error) {
          // Ignore errors during cleanup - map might be destroyed
          console.warn('Error during TableConnections event cleanup:', error);
        }
      }
      
      if (popup) {
        try {
          popup.remove();
        } catch (error) {
          // Ignore errors during popup cleanup
          console.warn('Error during popup cleanup:', error);
        }
      }
    };
  }, [map, coordinates, hoveredMarkerIndex, table, trafficTable, trafficImpacts, maxTrafficImpact]);

  // Cleanup on unmount
  useEffect(() => {
    const sourceId = sourceIdRef.current;
    return () => {
      if (map) {
        try {
          if (map.getLayer(sourceId + '-layer-top')) {
            map.removeLayer(sourceId + '-layer-top');
          }
          if (map.getLayer(sourceId + '-layer')) {
            map.removeLayer(sourceId + '-layer');
          }
          if (map.getSource(sourceId)) {
            map.removeSource(sourceId);
          }
        } catch (error) {
          // Ignore errors during cleanup - map might be destroyed
          console.warn('Error during TableConnections cleanup:', error);
        }
      }
    };
  }, [map]);

  return null;
}