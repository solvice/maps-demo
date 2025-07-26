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
import { RoutePoint, getOrigin, getDestination, getWaypoints, getCoordinatesInOrder, insertWaypoint, removeWaypoint, setOrigin, setDestination, isRouteCalculable, getMarkerContent } from '@/lib/route-point';

type Coordinates = [number, number];

function RouteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [originText, setOriginText] = useState<string>('');
  const [destinationText, setDestinationText] = useState<string>('');
  const [originSelected, setOriginSelected] = useState<boolean>(false);
  const [destinationSelected, setDestinationSelected] = useState<boolean>(false);
  
  // Helper functions for backward compatibility
  const origin = getOrigin(routePoints)?.coordinates || null;
  const destination = getDestination(routePoints)?.coordinates || null;
  const waypoints = getWaypoints(routePoints);
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
    calculateRoute,
    calculateRouteMulti
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
    const waypointsParam = searchParams.get('waypoints');
    const departureTimeParam = searchParams.get('departureTime');
    
    // Check for new waypoints format first
    if (waypointsParam) {
      try {
        const coordinates = waypointsParam.split('|').map(coord => {
          const [lng, lat] = coord.split(',').map(Number);
          return [lng, lat] as Coordinates;
        });
        
        if (coordinates.length >= 2) {
          const newRoutePoints: RoutePoint[] = coordinates.map((coord, index) => ({
            id: index === 0 ? 'origin' : 
                index === coordinates.length - 1 ? 'destination' : 
                `waypoint-${index}`,
            coordinates: coord,
            type: index === 0 ? 'origin' : 
                  index === coordinates.length - 1 ? 'destination' : 'waypoint'
          }));
          
          setRoutePoints(newRoutePoints);
          setOriginSelected(true);
          setDestinationSelected(true);
          
          // Get addresses for all points
          Promise.all(coordinates.map(coord => getAddressFromCoordinates(coord))).then(addresses => {
            setOriginText(addresses[0] || `${coordinates[0][1].toFixed(4)}, ${coordinates[0][0].toFixed(4)}`);
            setDestinationText(addresses[addresses.length - 1] || `${coordinates[coordinates.length - 1][1].toFixed(4)}, ${coordinates[coordinates.length - 1][0].toFixed(4)}`);
            
            // Update route points with addresses
            setRoutePoints(prev => prev.map((point, index) => ({
              ...point,
              address: addresses[index]
            })));
          });
        }
      } catch (e) {
        console.error('Invalid waypoints parameter:', e);
      }
    } else {
      // Fall back to legacy origin/destination format
      if (originParam) {
        try {
          const parts = originParam.split(',');
          if (parts.length === 2) {
            const coords: Coordinates = [parseFloat(parts[0]), parseFloat(parts[1])];
            if (!isNaN(coords[0]) && !isNaN(coords[1])) {
              setRoutePoints(prev => setOrigin(prev, coords));
              setOriginSelected(true);
              getAddressFromCoordinates(coords).then(address => {
                const displayAddress = address || `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
                setOriginText(displayAddress);
                setRoutePoints(prev => setOrigin(prev, coords, address));
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
              setRoutePoints(prev => setDestination(prev, coords));
              setDestinationSelected(true);
              getAddressFromCoordinates(coords).then(address => {
                const displayAddress = address || `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
                setDestinationText(displayAddress);
                setRoutePoints(prev => setDestination(prev, coords, address));
              });
            }
          }
        } catch (e) {
          console.error('Invalid destination parameter:', e);
        }
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
    
    // If we have waypoints, use the new format
    if (routePoints.length >= 2) {
      const coordinates = getCoordinatesInOrder(routePoints);
      const coordStrings = coordinates.map(coord => `${coord[0]},${coord[1]}`);
      params.set('waypoints', coordStrings.join('|'));
    } else {
      // Fallback to legacy format for backward compatibility
      if (origin) {
        params.set('origin', `${origin[0]},${origin[1]}`);
      }
      if (destination) {
        params.set('destination', `${destination[0]},${destination[1]}`);
      }
    }
    
    if (routeConfig.departureTime) {
      params.set('departureTime', routeConfig.departureTime);
    }
    
    const newUrl = params.toString() ? `?${params.toString()}` : '';
    const currentUrl = window.location.search;
    
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [routePoints, origin, destination, routeConfig.departureTime, router, isInitialized]);

  // Auto-calculate route
  useEffect(() => {
    if (isRouteCalculable(routePoints) && originSelected && destinationSelected) {
      const debounceTime = isDragging || isDraggingRef.current ? 0 : 300;
      const compareTraffic = shouldEnableTrafficComparison(routeConfig);
      calculateRouteMulti(routePoints, routeConfig, debounceTime, compareTraffic);
    }
  }, [routePoints, originSelected, destinationSelected, routeConfig, calculateRouteMulti, isDragging]);

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
        // Clear destination and waypoints when resetting
        setRoutePoints(prev => prev.filter(p => p.type === 'origin'));
        setDestinationText('');
        setDestinationSelected(false);
        return 1;
      }
    });
  };

  const handleSetOrigin = (coords: Coordinates) => {
    setRoutePoints(prev => setOrigin(prev, coords));
    setOriginSelected(true);
    getAddressFromCoordinates(coords).then(address => {
      const displayAddress = address || `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
      setOriginText(displayAddress);
      setRoutePoints(prev => setOrigin(prev, coords, address));
    });
  };

  const handleSetDestination = (coords: Coordinates) => {
    setRoutePoints(prev => setDestination(prev, coords));
    setDestinationSelected(true);
    getAddressFromCoordinates(coords).then(address => {
      const displayAddress = address || `${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`;
      setDestinationText(displayAddress);
      setRoutePoints(prev => setDestination(prev, coords, address));
    });
  };

  const handleAddWaypoint = (coords: Coordinates) => {
    setRoutePoints(prev => insertWaypoint(prev, coords));
    getAddressFromCoordinates(coords).then(address => {
      if (address) {
        setRoutePoints(prev => insertWaypoint(prev, coords, address));
      }
    });
    toast.success('Waypoint added!');
  };

  const handleRemoveWaypoint = (waypointId: string) => {
    setRoutePoints(prev => removeWaypoint(prev, waypointId));
    toast.success('Waypoint removed!');
  };

  const handleMarkerDragStart = () => {
    setIsDragging(true);
    isDraggingRef.current = true;
  };

  const handleMarkerDrag = (coords: Coordinates, type: 'origin' | 'destination' | 'waypoint', pointId?: string) => {
    if (type === 'origin') {
      setRoutePoints(prev => setOrigin(prev, coords));
      setOriginText(`${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
    } else if (type === 'destination') {
      setRoutePoints(prev => setDestination(prev, coords));
      setDestinationText(`${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
    } else if (type === 'waypoint' && pointId) {
      setRoutePoints(prev => prev.map(point => 
        point.id === pointId 
          ? { ...point, coordinates: coords }
          : point
      ));
    }
  };

  const handleMarkerDragEnd = (coords: Coordinates, type: 'origin' | 'destination' | 'waypoint', pointId?: string) => {
    setIsDragging(false);
    isDraggingRef.current = false;
    
    if (type === 'origin') {
      setRoutePoints(prev => setOrigin(prev, coords));
      setOriginSelected(true);
      getAddressFromCoordinates(coords).then(address => {
        if (address) {
          setOriginText(address);
          setRoutePoints(prev => setOrigin(prev, coords, address));
        }
      });
    } else if (type === 'destination') {
      setRoutePoints(prev => setDestination(prev, coords));
      setDestinationSelected(true);
      getAddressFromCoordinates(coords).then(address => {
        if (address) {
          setDestinationText(address);
          setRoutePoints(prev => setDestination(prev, coords, address));
        }
      });
    } else if (type === 'waypoint' && pointId) {
      getAddressFromCoordinates(coords).then(address => {
        setRoutePoints(prev => prev.map(point => 
          point.id === pointId 
            ? { ...point, coordinates: coords, address: address || point.address }
            : point
        ));
      });
    }
  };

  const handleOriginSelect = (result: { coordinates: Coordinates; address: string; confidence: number }) => {
    setRoutePoints(prev => {
      // Clear destination when setting new origin
      const withoutDestination = prev.filter(p => p.type !== 'destination');
      return setOrigin(withoutDestination, result.coordinates, result.address);
    });
    setOriginText(result.address);
    setOriginSelected(true);
    setDestinationText('');
    setDestinationSelected(false);
  };

  const handleDestinationSelect = (result: { coordinates: Coordinates; address: string; confidence: number }) => {
    setRoutePoints(prev => setDestination(prev, result.coordinates, result.address));
    setDestinationText(result.address);
    setDestinationSelected(true);
  };

  const handleOriginTextChange = (value: string) => {
    setOriginText(value);
    setDestinationText('');
    setOriginSelected(false);
    setDestinationSelected(false);
    
    // Clear destination when changing origin
    setRoutePoints(prev => prev.filter(p => p.type !== 'destination'));
    
    getCoordinatesFromAddress(value).then(coordinates => {
      if (coordinates) {
        setRoutePoints(prev => setOrigin(prev, coordinates, value));
        setOriginSelected(true);
      } else {
        setRoutePoints(prev => prev.filter(p => p.type !== 'origin'));
        setOriginSelected(false);
      }
    });
  };

  const handleDestinationTextChange = (value: string) => {
    setDestinationText(value);
    setDestinationSelected(false);
    
    getCoordinatesFromAddress(value).then(coordinates => {
      if (coordinates) {
        setRoutePoints(prev => setDestination(prev, coordinates, value));
        setDestinationSelected(true);
      } else {
        setRoutePoints(prev => prev.filter(p => p.type !== 'destination'));
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
      onAddWaypoint={handleAddWaypoint}
      hasOrigin={!!origin}
      hasDestination={!!destination}
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
        routePoints={routePoints}
        onRemoveWaypoint={handleRemoveWaypoint}
      />
      {routePoints.map((point, index) => {
        const waypointIndex = point.type === 'waypoint' 
          ? getWaypoints(routePoints).findIndex(wp => wp.id === point.id)
          : undefined;
        
        return (
          <Marker
            key={point.id}
            coordinates={point.coordinates}
            type={point.type}
            content={getMarkerContent(point.type, waypointIndex)}
            onDragStart={handleMarkerDragStart}
            onDrag={(coords) => handleMarkerDrag(coords, point.type, point.id)}
            onDragEnd={(coords) => handleMarkerDragEnd(coords, point.type, point.id)}
            onDelete={point.type === 'waypoint' ? () => handleRemoveWaypoint(point.id) : undefined}
          />
        );
      })}
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