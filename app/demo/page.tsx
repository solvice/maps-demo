'use client';

import { useState, Suspense } from 'react';
import { DemoLayout } from '@/components/demo-layout';
import { TableMarker } from '@/components/table-marker';
import { TableConnections } from '@/components/table-connections';
import { TableDemoControls } from '@/components/table-demo-controls';
import { TrafficImpactLegend } from '@/components/traffic-impact-legend';
import { Marker } from '@/components/marker';
import { RouteLayer } from '@/components/route-layer';
import { RouteDemoControls } from '@/components/route-demo-controls';
import { StepHighlight } from '@/components/step-highlight';
import { RouteConfig } from '@/components/route-config';
import { useRoute } from '@/hooks/use-route';
import { useGeocoding } from '@/hooks/use-geocoding';
import { useTable } from '@/hooks/use-table';
import { useMapContext } from '@/contexts/map-context';
import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import maplibregl from 'maplibre-gl';
import { Coordinates } from '@/lib/coordinates';
import { shouldEnableTrafficComparison } from '@/lib/route-utils';
import { cn } from '@/lib/utils';

type DemoType = 'route' | 'table';
type RouteCoordinates = [number, number];

function UnifiedDemoContent() {
  const [activeDemo, setActiveDemo] = useState<DemoType>('route');
  
  // Route demo state
  const [origin, setOrigin] = useState<RouteCoordinates | null>(null);
  const [destination, setDestination] = useState<RouteCoordinates | null>(null);
  const [originText, setOriginText] = useState<string>('');
  const [destinationText, setDestinationText] = useState<string>('');
  const [originSelected, setOriginSelected] = useState<boolean>(false);
  const [destinationSelected, setDestinationSelected] = useState<boolean>(false);
  const [, setClickCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const [hoveredRouteIndex] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [highlightedStepGeometry, setHighlightedStepGeometry] = useState<string | null>(null);
  const [highlightedStepIndex] = useState<number | null>(null);
  const [routeConfig, setRouteConfig] = useState<RouteConfig>({
    alternatives: 2,
    steps: true,
    annotations: ['distance', 'duration'],
    geometries: 'polyline',
    overview: 'full',
    continue_straight: true,
    snapping: 'default',
    vehicleType: 'CAR',
    routingEngine: 'OSM',
    interpolate: false,
    generate_hints: false,
  });
  
  // Table demo state
  const [tableRequestText, setTableRequestText] = useState<string>('');
  const [coordinates, setCoordinates] = useState<Coordinates[]>([]);
  const [hoveredMarkerIndex, setHoveredMarkerIndex] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const flyToTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const map = useMapContext();
  
  // Route hooks
  const { 
    route, 
    error: routeError, 
    loading: routeLoading, 
    calculationTime: routeCalculationTime, 
    trafficRoute, 
    trafficError, 
    trafficLoading, 
    calculateRoute
  } = useRoute();
  
  const { 
    loading: geocodingLoading, 
    error: geocodingError, 
    getAddressFromCoordinates, 
    getCoordinatesFromAddress 
  } = useGeocoding();
  
  // Table hooks
  const { 
    table, 
    trafficTable, 
    loading: tableLoading, 
    error: tableError, 
    calculationTime: tableCalculationTime, 
    trafficImpacts, 
    maxTrafficImpact, 
    calculateTable, 
    clearTable 
  } = useTable();

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

  // Fit map to coordinates for table demo
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

  // Component initialization
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Route demo map flyTo effect
  useEffect(() => {
    if (activeDemo === 'route' && isInitialized && map) {
      if (flyToTimeoutRef.current) {
        clearTimeout(flyToTimeoutRef.current);
      }
      
      flyToTimeoutRef.current = setTimeout(() => {
        if (origin && destination) {
          const bounds = new maplibregl.LngLatBounds();
          bounds.extend(origin);
          bounds.extend(destination);
          
          map.fitBounds(bounds, {
            padding: { top: 100, bottom: 100, left: 100, right: 100 },
            duration: 1000,
            maxZoom: 16
          });
        } else if (origin) {
          map.flyTo({
            center: origin,
            zoom: 14,
            duration: 1000
          });
        }
      }, 200);
    }
  }, [activeDemo, isInitialized, origin, destination, map]);

  // Table demo map fit effect
  useEffect(() => {
    if (activeDemo === 'table') {
      fitMapToCoordinates();
    }
  }, [activeDemo, fitMapToCoordinates]);

  // Auto-calculate route
  useEffect(() => {
    if (activeDemo === 'route' && origin && destination && originSelected && destinationSelected) {
      const debounceTime = isDragging || isDraggingRef.current ? 0 : 300;
      const compareTraffic = shouldEnableTrafficComparison(routeConfig);
      calculateRoute(origin, destination, routeConfig, debounceTime, compareTraffic);
    }
  }, [activeDemo, origin, destination, originSelected, destinationSelected, routeConfig, calculateRoute, isDragging]);

  // Success notifications
  useEffect(() => {
    if (activeDemo === 'route' && route && route.routes && route.routes[0] && routeCalculationTime !== null) {
      toast.success(`Route calculated in ${routeCalculationTime}ms`);
    }
  }, [activeDemo, route, routeCalculationTime]);

  useEffect(() => {
    if (activeDemo === 'table' && tableCalculationTime && !tableLoading && !tableError && table) {
      toast.success(`Table calculated in ${tableCalculationTime}ms`);
    }
  }, [activeDemo, tableCalculationTime, tableLoading, tableError, table]);

  // Error notifications
  useEffect(() => {
    if (activeDemo === 'route' && routeError) {
      toast.error(`Route calculation failed: ${routeError}`);
    }
  }, [activeDemo, routeError]);

  useEffect(() => {
    if (activeDemo === 'route' && geocodingError) {
      toast.error(`Address lookup failed: ${geocodingError}`);
    }
  }, [activeDemo, geocodingError]);

  useEffect(() => {
    if (activeDemo === 'table' && tableError) {
      toast.error(tableError);
    }
  }, [activeDemo, tableError]);

  // Route demo event handlers
  const handleMapClick = (coords: RouteCoordinates) => {
    if (activeDemo !== 'route') return;
    
    setClickCount(currentCount => {
      const newCount = currentCount + 1;
      
      if (newCount === 1) {
        handleSetOrigin(coords);
        toast.success('Origin placed! Click again for destination.');
        return 1;
      } else if (newCount === 2) {
        handleSetDestination(coords);
        return 2;
      } else {
        handleSetOrigin(coords);
        setDestination(null);
        setDestinationText('');
        return 1;
      }
    });
  };

  const handleSetOrigin = (coords: RouteCoordinates) => {
    setOrigin(coords);
    setOriginSelected(true);
    getAddressFromCoordinates(coords).then(address => {
      setOriginText(address || `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
    });
  };

  const handleSetDestination = (coords: RouteCoordinates) => {
    setDestination(coords);
    setDestinationSelected(true);
    getAddressFromCoordinates(coords).then(address => {
      setDestinationText(address || `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
    });
  };

  const handleMarkerDragStart = () => {
    setIsDragging(true);
    isDraggingRef.current = true;
  };

  const handleMarkerDrag = (coords: RouteCoordinates, type: 'origin' | 'destination') => {
    if (type === 'origin') {
      setOrigin(coords);
      setOriginText(`${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
    } else {
      setDestination(coords);
      setDestinationText(`${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
    }
  };

  const handleMarkerDragEnd = (coords: RouteCoordinates, type: 'origin' | 'destination') => {
    setIsDragging(false);
    isDraggingRef.current = false;
    
    if (type === 'origin') {
      setOrigin(coords);
      setOriginSelected(true);
      getAddressFromCoordinates(coords).then(address => {
        if (address) setOriginText(address);
      });
    } else {
      setDestination(coords);
      setDestinationSelected(true);
      getAddressFromCoordinates(coords).then(address => {
        if (address) setDestinationText(address);
      });
    }
  };

  const handleOriginSelect = (result: { coordinates: RouteCoordinates; address: string; confidence: number }) => {
    setOrigin(result.coordinates);
    setOriginText(result.address);
    setOriginSelected(true);
    setDestination(null);
    setDestinationText('');
    setDestinationSelected(false);
  };

  const handleDestinationSelect = (result: { coordinates: RouteCoordinates; address: string; confidence: number }) => {
    setDestination(result.coordinates);
    setDestinationText(result.address);
    setDestinationSelected(true);
  };

  const handleOriginTextChange = (value: string) => {
    setOriginText(value);
    setDestination(null);
    setDestinationText('');
    setOriginSelected(false);
    setDestinationSelected(false);
    
    getCoordinatesFromAddress(value).then(coordinates => {
      if (coordinates) {
        setOrigin(coordinates);
        setOriginSelected(true);
      } else {
        setOrigin(null);
        setOriginSelected(false);
      }
    });
  };

  const handleDestinationTextChange = (value: string) => {
    setDestinationText(value);
    setDestinationSelected(false);
    
    getCoordinatesFromAddress(value).then(coordinates => {
      if (coordinates) {
        setDestination(coordinates);
        setDestinationSelected(true);
      } else {
        setDestination(null);
        setDestinationSelected(false);
      }
    });
  };

  const handleRouteConfigChange = (newConfig: RouteConfig) => {
    const configWithTime = {
      ...newConfig,
      geometries: 'polyline' as const,
      alternatives: 2,
      steps: true,
      departureTime: new Date().toISOString()
    };
    setRouteConfig(configWithTime);
  };


  // Navigation component
  const DemoNavigation = () => (
    <div className="flex items-center justify-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border p-1">
      <button
        onClick={() => setActiveDemo('route')}
        className={cn(
          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
          'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          activeDemo === 'route' 
            ? 'bg-blue-100 text-blue-700' 
            : 'text-gray-600 hover:text-gray-900'
        )}
        title="Interactive route planning with traffic analysis"
      >
/route
      </button>
      <button
        onClick={() => setActiveDemo('table')}
        className={cn(
          'px-4 py-2 rounded-md text-sm font-medium transition-colors',
          'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          activeDemo === 'table' 
            ? 'bg-blue-100 text-blue-700' 
            : 'text-gray-600 hover:text-gray-900'
        )}
        title="Distance/duration matrix calculations"
      >
/table
      </button>
    </div>
  );

  // Title pane with custom navigation
  const TitlePane = () => (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 text-center">
      <div className="mb-3">
        <h1 className="text-2xl font-bold text-white drop-shadow-lg">
          Solvice Maps Demo
        </h1>
      </div>
      <DemoNavigation />
    </div>
  );

  // Side panel content
  const sidePanel = activeDemo === 'route' ? (
    <RouteDemoControls
      origin={origin}
      destination={destination}
      originText={originText}
      destinationText={destinationText}
      onOriginTextChange={handleOriginTextChange}
      onDestinationTextChange={handleDestinationTextChange}
      onOriginSelect={handleOriginSelect}
      onDestinationSelect={handleDestinationSelect}
      routeConfig={routeConfig}
      onRouteConfigChange={handleRouteConfigChange}
      route={route}
      trafficRoute={trafficRoute}
      loading={routeLoading || geocodingLoading}
      trafficLoading={trafficLoading}
      error={routeError || geocodingError}
      trafficError={trafficError}
      showInstructions={showInstructions}
      onShowInstructionsChange={setShowInstructions}
      onHighlightedStepGeometryChange={setHighlightedStepGeometry}
    />
  ) : (
    <TableDemoControls
      tableRequestText={tableRequestText}
      onTableRequestChange={handleTableRequestChange}
      loading={tableLoading}
      calculationTime={tableCalculationTime}
    />
  );

  return (
    <DemoLayout 
      sidePanel={sidePanel} 
      customTitlePane={<TitlePane />} 
      onClick={handleMapClick}
      onSetOrigin={handleSetOrigin}
      onSetDestination={handleSetDestination}
      onAddWaypoint={(coords) => {
        // For now, treat waypoint as destination since we're using legacy system
        handleSetDestination(coords);
        toast.success('Waypoint added as destination! Multi-waypoint routing coming soon.');
      }}
      hasOrigin={activeDemo === 'route' && !!origin}
      hasDestination={activeDemo === 'route' && !!destination}
      waypointCount={0}
    >
      {/* Route Demo Content */}
      {activeDemo === 'route' && (
        <>
          {origin && (
            <Marker
              coordinates={origin}
              type="origin"
              onDragStart={handleMarkerDragStart}
              onDrag={handleMarkerDrag}
              onDragEnd={handleMarkerDragEnd}
            />
          )}
          {destination && (
            <Marker
              coordinates={destination}
              type="destination"
              onDragStart={handleMarkerDragStart}
              onDrag={handleMarkerDrag}
              onDragEnd={handleMarkerDragEnd}
            />
          )}
          <RouteLayer 
            route={route} 
            geometryFormat={routeConfig.geometries} 
            highlightedRoute={hoveredRouteIndex}
          />
          <StepHighlight 
            geometry={highlightedStepGeometry}
            stepIndex={highlightedStepIndex}
          />
        </>
      )}

      {/* Table Demo Content */}
      {activeDemo === 'table' && (
        <>
          {coordinates.map((coord, index) => (
            <TableMarker
              key={index}
              coordinates={coord}
              index={index}
              onHover={setHoveredMarkerIndex}
            />
          ))}
          <TableConnections
            coordinates={coordinates}
            hoveredMarkerIndex={hoveredMarkerIndex}
            table={table}
            trafficTable={trafficTable}
            trafficImpacts={trafficImpacts}
            maxTrafficImpact={maxTrafficImpact}
          />
          <TrafficImpactLegend
            maxTrafficImpact={maxTrafficImpact || 1.0}
            show={!!table && !!trafficTable}
          />
        </>
      )}
    </DemoLayout>
  );
}

export default function UnifiedDemo() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <UnifiedDemoContent />
    </Suspense>
  );
}