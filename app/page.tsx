'use client';

import { MapWithContextMenu } from '@/components/map-with-context-menu';
import { Marker } from '@/components/marker';
import { RouteLayer } from '@/components/route-layer';
import { RouteControlPanel } from '@/components/route-control-panel';
import { RouteConfig } from '@/components/route-config';
import { useRoute } from '@/hooks/use-route';
import { useGeocoding } from '@/hooks/use-geocoding';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

type Coordinates = [number, number];

export default function Home() {
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [originText, setOriginText] = useState<string>('');
  const [destinationText, setDestinationText] = useState<string>('');
  const [, setClickCount] = useState(0);
  const [routeConfig, setRouteConfig] = useState<RouteConfig>({
    alternatives: 1,
    steps: false,
    annotations: [],
    geometries: 'polyline',
    overview: 'full',
    continue_straight: true,
    snapping: 'default',
    vehicleType: 'CAR',
    routingEngine: 'OSM',
    interpolate: false,
    generate_hints: false,
  });
  const { route, error: routeError, loading: routeLoading, calculateRoute } = useRoute();
  const { loading: geocodingLoading, error: geocodingError, getAddressFromCoordinates, getCoordinatesFromAddress } = useGeocoding();

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
      console.log('Both markers placed, calculating route with config:', routeConfig);
      // Use minimal debounce for immediate feedback during dragging
      calculateRoute(origin, destination, routeConfig, 100); // Very short debounce for smooth dragging
    }
  }, [origin, destination, routeConfig, calculateRoute]);

  // Log route results
  useEffect(() => {
    if (route && route.routes && route.routes[0] && route.routes[0].distance) {
      console.log('Route calculated:', route);
      toast.success(`Route found! ${Math.round(route.routes[0].distance / 1000)}km`);
    }
  }, [route]);

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

  // Handle marker drag events
  const handleMarkerDrag = (coords: Coordinates, type: 'origin' | 'destination') => {
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
        route={route}
        loading={routeLoading || geocodingLoading}
        error={routeError || geocodingError}
      />
      <MapWithContextMenu 
        center={[3.7174, 51.0543]}
        onClick={handleMapClick}
        onSetOrigin={handleSetOrigin}
        onSetDestination={handleSetDestination}
      >
        {origin && (
          <Marker
            coordinates={origin}
            type="origin"
            onDrag={handleMarkerDrag}
            onDragEnd={handleMarkerDragEnd}
          />
        )}
        {destination && (
          <Marker
            coordinates={destination}
            type="destination"
            onDrag={handleMarkerDrag}
            onDragEnd={handleMarkerDragEnd}
          />
        )}
        <RouteLayer route={route} />
      </MapWithContextMenu>
    </main>
  );
}