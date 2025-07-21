'use client';

import { DemoLayout } from '@/components/demo-layout';
import { TableMarker } from '@/components/table-marker';
import { TableConnections } from '@/components/table-connections';
import { TableDemoControls } from '@/components/table-demo-controls';
import { TrafficImpactLegend } from '@/components/traffic-impact-legend';
import { useTable } from '@/hooks/use-table';
import { useMapContext } from '@/contexts/map-context';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Suspense } from 'react';
import { toast } from 'sonner';
import maplibregl from 'maplibre-gl';
import { Coordinates } from '@/lib/coordinates';

function TableContent() {
  const [tableRequestText, setTableRequestText] = useState<string>('');
  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);
  const [hoveredMarkerIndex, setHoveredMarkerIndex] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const map = useMapContext();
  const { 
    table, 
    trafficTable, 
    loading, 
    error, 
    calculationTime, 
    trafficImpacts, 
    maxTrafficImpact, 
    calculateTable, 
    clearTable 
  } = useTable();
  
  const flyToTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const calculateTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // Parse table request and extract coordinates
  const parseTableRequest = useCallback((text: string) => {
    if (!text.trim()) {
      setCoordinates([]);
      clearTable();
      return null;
    }

    try {
      const request = JSON.parse(text);
      
      if (!request.coordinates || !Array.isArray(request.coordinates)) {
        throw new Error('Missing or invalid coordinates array');
      }

      if (request.coordinates.length < 2) {
        throw new Error('At least 2 coordinates are required');
      }

      // Validate coordinate format
      for (let i = 0; i < request.coordinates.length; i++) {
        const coord = request.coordinates[i];
        if (!Array.isArray(coord) || coord.length !== 2 || 
            typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
          throw new Error(`Invalid coordinate format at index ${i}`);
        }
      }

      setCoordinates(request.coordinates);
      return request;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid JSON format';
      toast.error(`Invalid table request: ${errorMessage}`);
      setCoordinates([]);
      clearTable();
      return null;
    }
  }, [clearTable]);

  // Handle table request text changes
  const handleTableRequestChange = useCallback((text: string) => {
    setTableRequestText(text);
    
    const request = parseTableRequest(text);
    if (request) {
      // Trigger table calculation with the full request
      calculateTable(request.coordinates, {
        sources: request.sources,
        destinations: request.destinations,
        annotations: request.annotations,
        vehicleType: request.vehicleType,
        engine: request.engine,
        departureTime: request.departureTime,
        interpolate: request.interpolate
      });
    }
  }, [parseTableRequest, calculateTable]);

  // Debounced table calculation for click-placed markers
  const triggerDebouncedCalculation = useCallback(() => {
    if (calculateTimeoutRef.current) {
      clearTimeout(calculateTimeoutRef.current);
    }

    calculateTimeoutRef.current = setTimeout(() => {
      if (coordinates.length >= 2) {
        const allIndices = coordinates.map((_, index) => index);
        calculateTable(coordinates, {
          sources: allIndices,
          destinations: allIndices,
          annotations: ['duration', 'distance'],
          vehicleType: 'CAR',
          engine: 'OSM'
        });
        
        // Update the textarea with the current state
        const requestObj = {
          coordinates: coordinates,
          sources: allIndices,
          destinations: allIndices,
          annotations: ['duration', 'distance'],
          vehicleType: 'CAR',
          engine: 'OSM'
        };
        setTableRequestText(JSON.stringify(requestObj, null, 2));
      }
    }, 1000);
  }, [coordinates, calculateTable]);

  // Handle map click to add markers
  const handleMapClick = useCallback((coords: Coordinates) => {
    setCoordinates(prev => {
      const newCoords = [...prev, coords];
      toast.success(`Marker ${newCoords.length} placed! ${newCoords.length >= 2 ? 'Matrix will calculate in 1s...' : ''}`);
      return newCoords;
    });
  }, []);

  // Effect to trigger calculation when coordinates change from click
  useEffect(() => {
    if (coordinates.length >= 2) {
      triggerDebouncedCalculation();
    } else if (coordinates.length === 0) {
      clearTable();
      setTableRequestText('');
    }
  }, [coordinates, triggerDebouncedCalculation, clearTable]);

  // Fit map to coordinates
  const fitMapToCoordinates = useCallback(() => {
    if (!map || coordinates.length === 0) return;

    if (flyToTimeoutRef.current) {
      clearTimeout(flyToTimeoutRef.current);
    }

    flyToTimeoutRef.current = setTimeout(() => {
      if (coordinates.length === 1) {
        map.flyTo({
          center: coordinates[0],
          zoom: 14,
          duration: 1000
        });
      } else if (coordinates.length > 1) {
        // Calculate bounds for all coordinates
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

        map.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          duration: 1000,
          maxZoom: 15
        });
      }
    }, 200);
  }, [map, coordinates]);

  // Effect to fit map when coordinates change
  useEffect(() => {
    fitMapToCoordinates();
  }, [fitMapToCoordinates]);

  // Show error toast when error occurs
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Show success toast when calculation completes
  useEffect(() => {
    if (calculationTime && !loading && !error && table) {
      toast.success(`Table calculated in ${calculationTime}ms`);
    }
  }, [calculationTime, loading, error, table]);

  // Initialization effect
  useEffect(() => {
    if (isInitialized) return;
    setIsInitialized(true);
  }, [isInitialized]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (flyToTimeoutRef.current) {
        clearTimeout(flyToTimeoutRef.current);
      }
      if (calculateTimeoutRef.current) {
        clearTimeout(calculateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <DemoLayout onClick={handleMapClick}>
      <TableDemoControls
        tableRequestText={tableRequestText}
        onTableRequestChange={handleTableRequestChange}
        loading={loading}
        calculationTime={calculationTime}
      />
      {/* Table Markers */}
      {coordinates.map((coord, index) => (
        <TableMarker
          key={index}
          coordinates={coord}
          index={index}
          onHover={setHoveredMarkerIndex}
        />
      ))}

      {/* Connection Lines */}
      <TableConnections
        coordinates={coordinates}
        hoveredMarkerIndex={hoveredMarkerIndex}
        table={table}
        trafficTable={trafficTable}
        trafficImpacts={trafficImpacts}
        maxTrafficImpact={maxTrafficImpact}
      />
      
      {/* Traffic Impact Legend */}
      <TrafficImpactLegend
        maxTrafficImpact={maxTrafficImpact || 1.0}
        show={!!table && !!trafficTable}
      />
    </DemoLayout>
  );
}

export default function TableDemo() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <TableContent />
    </Suspense>
  );
}