'use client';

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
import { toast } from 'sonner';

type Coordinates = [number, number];

export default function Home() {
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
  const { route, error: routeError, loading: routeLoading, calculationTime, calculateRoute } = useRoute();
  const { loading: geocodingLoading, error: geocodingError, getAddressFromCoordinates, getCoordinatesFromAddress } = useGeocoding();
  
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
        toast.success('Destination placed!');
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
    toast.success('Origin moved to selected location');
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
    toast.success('Destination moved to selected location');
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
      
      calculateRoute(origin, destination, routeConfig, debounceTime);
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
      toast.success('Origin moved to new location');
    } else {
      setDestination(coords);
      // Start reverse geocoding for better address
      getAddressFromCoordinates(coords).then(address => {
        if (address) {
          setDestinationText(address);
        }
      });
      toast.success('Destination moved to new location');
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
        selectedRouteIndex={hoveredRouteIndex || 0}
        show={routeConfig.steps}
        onStepHover={handleStepHover}
      />
    </main>
  );
}