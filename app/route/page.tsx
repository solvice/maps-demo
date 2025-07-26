'use client';

import { DemoLayout } from '@/components/demo-layout';
import { Marker } from '@/components/marker';
import { RouteLayer } from '@/components/route-layer';
import { RouteDemoControls } from '@/components/route-demo-controls';
import { StepHighlight } from '@/components/step-highlight';
import { RouteConfig } from '@/components/route-config';
import { useRoute } from '@/hooks/use-route';
import { useGeocoding } from '@/hooks/use-geocoding';
import { useMapContext } from '@/contexts/map-context';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';
import maplibregl from 'maplibre-gl';
import { shouldEnableTrafficComparison } from '@/lib/route-utils';

type Coordinates = [number, number];

function RouteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [originText, setOriginText] = useState<string>('');
  const [destinationText, setDestinationText] = useState<string>('');
  const [originSelected, setOriginSelected] = useState<boolean>(false);
  const [destinationSelected, setDestinationSelected] = useState<boolean>(false);
  const [, setClickCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const [hoveredRouteIndex] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const flyToTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
  
  const { 
    loading: geocodingLoading, 
    error: geocodingError, 
    getAddressFromCoordinates, 
    getCoordinatesFromAddress 
  } = useGeocoding();
  
  const map = useMapContext();
  
  // URL parameter initialization
  useEffect(() => {
    if (isInitialized) return;
    
    const originParam = searchParams.get('origin');
    const destParam = searchParams.get('destination');
    const departureTimeParam = searchParams.get('departureTime');
    
    if (originParam) {
      try {
        const parts = originParam.split(',');
        if (parts.length === 2) {
          const coords: Coordinates = [parseFloat(parts[0]), parseFloat(parts[1])];
          if (!isNaN(coords[0]) && !isNaN(coords[1])) {
            setOrigin(coords);
            setOriginSelected(true);
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
            setDestinationSelected(true);
            getAddressFromCoordinates(coords).then(address => {
              setDestinationText(address || `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
            });
          }
        }
      } catch (e) {
        console.error('Invalid destination parameter:', e);
      }
    }
    
    if (departureTimeParam) {
      try {
        const departureTime = new Date(departureTimeParam);
        if (!isNaN(departureTime.getTime())) {
          setRouteConfig(prev => ({
            ...prev,
            departureTime: departureTime.toISOString()
          }));
        }
      } catch (e) {
        console.error('Invalid departureTime parameter:', e);
      }
    }
    
    setIsInitialized(true);
  }, [searchParams, getAddressFromCoordinates, isInitialized]);

  // Map flyTo effect
  useEffect(() => {
    if (isInitialized && map) {
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
    
    return () => {
      if (flyToTimeoutRef.current) {
        clearTimeout(flyToTimeoutRef.current);
      }
    };
  }, [isInitialized, origin, destination, map]);

  // URL parameter updates
  useEffect(() => {
    if (!isInitialized) return;
    
    const params = new URLSearchParams();
    
    if (origin) {
      params.set('origin', `${origin[0]},${origin[1]}`);
    }
    if (destination) {
      params.set('destination', `${destination[0]},${destination[1]}`);
    }
    if (routeConfig.departureTime) {
      params.set('departureTime', routeConfig.departureTime);
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    const currentUrl = window.location.search;
    
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [origin, destination, routeConfig.departureTime, router, isInitialized]);

  // Auto-calculate route
  useEffect(() => {
    if (origin && destination && originSelected && destinationSelected) {
      const debounceTime = isDragging || isDraggingRef.current ? 0 : 300;
      const compareTraffic = shouldEnableTrafficComparison(routeConfig);
      calculateRoute(origin, destination, routeConfig, debounceTime, compareTraffic);
    }
  }, [origin, destination, originSelected, destinationSelected, routeConfig, calculateRoute, isDragging]);

  // Success notifications
  useEffect(() => {
    if (route && route.routes && route.routes[0] && calculationTime !== null) {
      toast.success(`Route calculated in ${calculationTime}ms`);
    }
  }, [route, calculationTime]);

  // Error notifications
  useEffect(() => {
    if (routeError) {
      toast.error(`Route calculation failed: ${routeError}`);
    }
  }, [routeError]);

  useEffect(() => {
    if (geocodingError) {
      toast.error(`Address lookup failed: ${geocodingError}`);
    }
  }, [geocodingError]);

  // Event handlers
  const handleMapClick = (coords: Coordinates) => {
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

  const handleSetOrigin = (coords: Coordinates) => {
    setOrigin(coords);
    setOriginSelected(true);
    getAddressFromCoordinates(coords).then(address => {
      setOriginText(address || `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
    });
  };

  const handleSetDestination = (coords: Coordinates) => {
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

  const handleMarkerDrag = (coords: Coordinates, type: 'origin' | 'destination') => {
    if (type === 'origin') {
      setOrigin(coords);
      setOriginText(`${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
    } else {
      setDestination(coords);
      setDestinationText(`${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
    }
  };

  const handleMarkerDragEnd = (coords: Coordinates, type: 'origin' | 'destination') => {
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

  const handleOriginSelect = (result: { coordinates: Coordinates; address: string; confidence: number }) => {
    setOrigin(result.coordinates);
    setOriginText(result.address);
    setOriginSelected(true);
    setDestination(null);
    setDestinationText('');
    setDestinationSelected(false);
  };

  const handleDestinationSelect = (result: { coordinates: Coordinates; address: string; confidence: number }) => {
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


  return (
    <DemoLayout 
      onClick={handleMapClick}
      onSetOrigin={handleSetOrigin}
      onSetDestination={handleSetDestination}
      onAddWaypoint={(coords) => {
        // For now, treat waypoint as destination since we're using legacy system
        handleSetDestination(coords);
        toast.success('Waypoint added as destination! Multi-waypoint routing coming soon.');
      }}
      hasOrigin={!!origin}
      hasDestination={!!destination}
      waypointCount={0}
    >
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
    </DemoLayout>
  );
}

export default function RouteDemo() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <RouteContent />
    </Suspense>
  );
}