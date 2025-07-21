'use client';

// import { Analytics } from "@vercel/analytics/next";
import { MapWithContextMenu } from '@/components/map-with-context-menu';
import { Marker } from '@/components/marker';
import { RouteLayer } from '@/components/route-layer';
import { RouteControlPanel } from '@/components/route-control-panel';
import { MapControls } from '@/components/map-controls';
import { SpeedProfile } from '@/components/elevation-profile';
import { StepHighlight } from '@/components/step-highlight';
import { RouteConfig } from '@/components/route-config';
import { useRoute } from '@/hooks/use-route';
import { useGeocoding } from '@/hooks/use-geocoding';
import { useAutoZoom } from '@/hooks/use-auto-zoom';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { shouldEnableTrafficComparison } from '@/lib/route-utils';

type Coordinates = [number, number];

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [originText, setOriginText] = useState<string>('');
  const [destinationText, setDestinationText] = useState<string>('');
  const [, setClickCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const [hoveredRouteIndex, setHoveredRouteIndex] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [mapStyle, setMapStyle] = useState('https://cdn.solvice.io/styles/white.json');
  const [highlightedStepGeometry, setHighlightedStepGeometry] = useState<string | null>(null);
  const [highlightedStepIndex, setHighlightedStepIndex] = useState<number | null>(null);
  const [routeConfig, setRouteConfig] = useState<RouteConfig>({
    alternatives: 2,
    steps: false,
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
  const [isInitialized, setIsInitialized] = useState(false);
  const { 
    route, 
    error: routeError, 
    loading: routeLoading, 
    calculationTime, 
    trafficRoute, 
    trafficError, 
    trafficLoading, 
    calculateRoute 
  } = useRoute();
  const { loading: geocodingLoading, error: geocodingError, getAddressFromCoordinates, getCoordinatesFromAddress } = useGeocoding();
  
  // Parse URL parameters on initial load
  useEffect(() => {
    if (isInitialized) return;
    
    const originParam = searchParams.get('origin');
    const destParam = searchParams.get('destination');
    const vehicleParam = searchParams.get('vehicle');
    const engineParam = searchParams.get('engine');
    const stepsParam = searchParams.get('steps');
    
    if (originParam) {
      try {
        const parts = originParam.split(',');
        if (parts.length === 2) {
          const coords: Coordinates = [parseFloat(parts[0]), parseFloat(parts[1])];
          if (!isNaN(coords[0]) && !isNaN(coords[1])) {
            setOrigin(coords);
            getAddressFromCoordinates(coords).then(address => {
              setOriginText(address || `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
            });
          }
        }
      } catch (e) {
        console.error('Invalid origin parameter:', e);
      }
    }
    
    if (destParam) {
      try {
        const parts = destParam.split(',');
        if (parts.length === 2) {
          const coords: Coordinates = [parseFloat(parts[0]), parseFloat(parts[1])];
          if (!isNaN(coords[0]) && !isNaN(coords[1])) {
            setDestination(coords);
            getAddressFromCoordinates(coords).then(address => {
              setDestinationText(address || `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
            });
          }
        }
      } catch (e) {
        console.error('Invalid destination parameter:', e);
      }
    }
    
    if (vehicleParam || engineParam || stepsParam) {
      setRouteConfig(prev => ({
        ...prev,
        ...(vehicleParam && { vehicleType: vehicleParam as RouteConfig['vehicleType'] }),
        ...(engineParam && { routingEngine: engineParam as RouteConfig['routingEngine'] }),
        ...(stepsParam && { steps: stepsParam === 'true' })
      }));
    }
    
    setIsInitialized(true);
  }, [searchParams, getAddressFromCoordinates, isInitialized]);
  
  // Update URL when route parameters change
  useEffect(() => {
    if (!isInitialized) return;
    
    const params = new URLSearchParams();
    
    if (origin) {
      params.set('origin', `${origin[0]},${origin[1]}`);
    }
    if (destination) {
      params.set('destination', `${destination[0]},${destination[1]}`);
    }
    if (routeConfig.vehicleType && routeConfig.vehicleType !== 'CAR') {
      params.set('vehicle', routeConfig.vehicleType);
    }
    if (routeConfig.routingEngine && routeConfig.routingEngine !== 'OSM') {
      params.set('engine', routeConfig.routingEngine);
    }
    if (routeConfig.steps) {
      params.set('steps', 'true');
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    const currentUrl = window.location.search;
    
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [origin, destination, routeConfig.vehicleType, routeConfig.routingEngine, routeConfig.steps, router, isInitialized]);
  
  // Auto-zoom to route when calculated
  useAutoZoom(route, { geometryFormat: routeConfig.geometries });

  const handleMapClick = (coords: Coordinates) => {
    // Normal click behavior
    setClickCount(currentCount => {
      const newCount = currentCount + 1;
      console.log('Click count:', currentCount, '->', newCount);
      
      if (newCount === 1) {
        console.log('First click - setting origin');
        handleSetOrigin(coords);
        toast.success('Origin placed! Click again for destination.');
        return 1;
      } else if (newCount === 2) {
        console.log('Second click - setting destination');
        handleSetDestination(coords);
        return 2;
      } else {
        console.log('Third+ click - moving origin');
        handleSetOrigin(coords);
        setDestination(null);
        setDestinationText('');
        toast.success('Origin moved! Click again for destination.');
        return 1; // Reset to "first click" state
      }
    });
  };

  const handleSetOrigin = (coords: Coordinates) => {
    setOrigin(coords);
    // Start reverse geocoding for origin
    getAddressFromCoordinates(coords).then(address => {
      if (address) {
        setOriginText(address);
      } else {
        setOriginText(`${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
      }
    });
  };

  const handleSetDestination = (coords: Coordinates) => {
    setDestination(coords);
    // Start reverse geocoding for destination
    getAddressFromCoordinates(coords).then(address => {
      if (address) {
        setDestinationText(address);
      } else {
        setDestinationText(`${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
      }
    });
  };

  // Auto-calculate route when both markers are placed or config changes
  useEffect(() => {
    if (origin && destination) {
      // Use both state and ref to ensure we catch the dragging state correctly
      const isCurrentlyDragging = isDragging || isDraggingRef.current;
      const debounceTime = isCurrentlyDragging ? 0 : 300;
      
      console.log('Route calculation triggered:', {
        isDragging,
        isDraggingRef: isDraggingRef.current,
        isCurrentlyDragging,
        debounceTime,
        origin: `${origin[1].toFixed(4)}, ${origin[0].toFixed(4)}`,
        destination: `${destination[1].toFixed(4)}, ${destination[0].toFixed(4)}`
      });
      
      // Determine if traffic comparison should be enabled
      const compareTraffic = shouldEnableTrafficComparison(routeConfig);
      
      calculateRoute(origin, destination, routeConfig, debounceTime, compareTraffic);
    }
  }, [origin, destination, routeConfig, calculateRoute, isDragging]);

  // Log route results
  useEffect(() => {
    if (route && route.routes && route.routes[0] && calculationTime !== null) {
      console.log('Route calculated:', route);
      console.log('Route legs structure:', route.routes[0].legs);
      if (route.routes[0].legs && route.routes[0].legs[0] && route.routes[0].legs[0].steps) {
        console.log('First leg steps:', route.routes[0].legs[0].steps);
        console.log('First step structure:', route.routes[0].legs[0].steps[0]);
      }
      toast.success(`Route calculated in ${calculationTime}ms`);
    }
  }, [route, calculationTime]);

  // Handle route errors
  useEffect(() => {
    if (routeError) {
      console.error('Route error:', routeError);
      toast.error(`Route calculation failed: ${routeError}`);
    }
  }, [routeError]);

  // Handle geocoding errors
  useEffect(() => {
    if (geocodingError) {
      console.error('Geocoding error:', geocodingError);
      toast.error(`Address lookup failed: ${geocodingError}`);
    }
  }, [geocodingError]);

  // Handle marker drag start
  const handleMarkerDragStart = (type: 'origin' | 'destination') => {
    setIsDragging(true);
    isDraggingRef.current = true;
    console.log(`Started dragging ${type} marker - isDragging set to TRUE`);
  };

  // Handle marker drag events
  const handleMarkerDrag = (coords: Coordinates, type: 'origin' | 'destination') => {
    console.log(`Dragging ${type} marker - isDragging state:`, isDragging, 'isDraggingRef:', isDraggingRef.current);
    
    if (type === 'origin') {
      setOrigin(coords);
      // Update text with coordinates for immediate feedback
      setOriginText(`${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
    } else {
      setDestination(coords);
      // Update text with coordinates for immediate feedback  
      setDestinationText(`${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
    }
  };

  const handleMarkerDragEnd = (coords: Coordinates, type: 'origin' | 'destination') => {
    setIsDragging(false);
    isDraggingRef.current = false;
    console.log(`Finished dragging ${type} marker - isDragging set to FALSE`);
    
    if (type === 'origin') {
      setOrigin(coords);
      // Start reverse geocoding for better address
      getAddressFromCoordinates(coords).then(address => {
        if (address) {
          setOriginText(address);
        }
      });
    } else {
      setDestination(coords);
      // Start reverse geocoding for better address
      getAddressFromCoordinates(coords).then(address => {
        if (address) {
          setDestinationText(address);
        }
      });
    }
  };

  // Handle autocomplete selection
  const handleOriginSelect = (result: { coordinates: Coordinates; address: string; confidence: number }) => {
    setOrigin(result.coordinates);
    setOriginText(result.address);
    
    // Clear destination when origin changes via autocomplete
    setDestination(null);
    setDestinationText('');
    
    console.log('Origin selected via autocomplete:', result);
  };

  const handleDestinationSelect = (result: { coordinates: Coordinates; address: string; confidence: number }) => {
    setDestination(result.coordinates);
    setDestinationText(result.address);
    
    console.log('Destination selected via autocomplete:', result);
  };

  const handleOriginTextChange = (value: string) => {
    setOriginText(value);
    
    // Clear destination when origin changes via input (maintaining consistency)
    setDestination(null);
    setDestinationText('');
    
    // Forward geocode to get coordinates
    getCoordinatesFromAddress(value).then(coordinates => {
      if (coordinates) {
        setOrigin(coordinates);
        console.log('Origin updated via geocoding:', coordinates);
      } else {
        setOrigin(null);
      }
    });
  };

  const handleDestinationTextChange = (value: string) => {
    setDestinationText(value);
    
    // Forward geocode to get coordinates
    getCoordinatesFromAddress(value).then(coordinates => {
      if (coordinates) {
        setDestination(coordinates);
        console.log('Destination updated via geocoding:', coordinates);
      } else {
        setDestination(null);
      }
    });
  };

  // Handle vehicle type change
  const handleVehicleTypeChange = (newVehicleType: string) => {
    const validVehicleTypes = ['CAR', 'BIKE', 'TRUCK', 'ELECTRIC_CAR', 'ELECTRIC_BIKE'] as const;
    type VehicleType = typeof validVehicleTypes[number];
    if (validVehicleTypes.includes(newVehicleType as VehicleType)) {
      setRouteConfig(prev => ({ ...prev, vehicleType: newVehicleType as VehicleType }));
    }
  };

  // Handle route config change
  const handleRouteConfigChange = (newConfig: RouteConfig) => {
    // Always set departureTime to current time when any config changes
    // Force geometries to always be 'polyline' and alternatives to always be 2
    const configWithTime = {
      ...newConfig,
      geometries: 'polyline' as const,
      alternatives: 2,
      departureTime: new Date().toISOString()
    };
    
    setRouteConfig(configWithTime);
    
    // Show/hide instructions based on steps setting
    if (configWithTime.steps) {
      setShowInstructions(true);
    } else {
      setShowInstructions(false);
    }
  };

  // Handle step hover from speed profile
  const handleStepHover = (stepGeometry: string | null, stepIndex: number | null) => {
    setHighlightedStepGeometry(stepGeometry);
    setHighlightedStepIndex(stepIndex);
    console.log(`🎯 Hovering step ${stepIndex} with geometry:`, stepGeometry ? 'available' : 'none');
  };

  return (
    <main role="main" className="h-screen w-screen overflow-hidden relative">
      <RouteControlPanel
        origin={originText}
        destination={destinationText}
        onOriginChange={handleOriginTextChange}
        onDestinationChange={handleDestinationTextChange}
        onOriginSelect={handleOriginSelect}
        onDestinationSelect={handleDestinationSelect}
        vehicleType={routeConfig.vehicleType}
        onVehicleTypeChange={handleVehicleTypeChange}
        routeConfig={routeConfig}
        onRouteConfigChange={handleRouteConfigChange}
        route={route}
        loading={routeLoading || geocodingLoading}
        error={routeError || geocodingError}
        trafficRoute={trafficRoute}
        trafficLoading={trafficLoading}
        trafficError={trafficError}
        onRouteHover={setHoveredRouteIndex}
        showInstructions={showInstructions}
        originCoordinates={origin}
        destinationCoordinates={destination}
      />
      <MapControls 
        routeConfig={routeConfig}
        onRouteConfigChange={handleRouteConfigChange}
        mapStyle={mapStyle}
        onMapStyleChange={setMapStyle}
      />
      <MapWithContextMenu 
        center={route ? undefined : [3.7174, 51.0543]}
        style={mapStyle}
        onClick={handleMapClick}
        onSetOrigin={handleSetOrigin}
        onSetDestination={handleSetDestination}
      >
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
      </MapWithContextMenu>
      <SpeedProfile 
        route={route}
        trafficRoute={trafficRoute}
        selectedRouteIndex={hoveredRouteIndex || 0}
        show={!!(route && route.routes && route.routes.length > 0)}
        onStepHover={handleStepHover}
      />
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}