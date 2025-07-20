'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, MapPin, Car, Bike, Footprints } from 'lucide-react';
import { AutocompleteInput } from '@/components/autocomplete-input';

type Coordinates = [number, number];

// Route response type matching the API
interface RouteInfo {
  routes: {
    distance?: number;
    duration?: number;
    geometry?: string;
    legs?: {
      summary?: string;
      distance?: number;
      duration?: number;
      weight?: number;
      steps?: unknown[];
    }[];
    weight_name?: string;
    weight?: number;
  }[];
  waypoints: {
    hint?: string;
    distance?: number;
    name?: string;
    location: [number, number];
  }[];
}

interface RouteControlPanelProps {
  // Origin/Destination
  origin: string;
  destination: string;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onOriginSelect: (result: { coordinates: Coordinates; address: string; confidence: number }) => void;
  onDestinationSelect: (result: { coordinates: Coordinates; address: string; confidence: number }) => void;
  
  // Vehicle type
  vehicleType: string | undefined;
  onVehicleTypeChange: (value: string) => void;
  
  // Route info
  route: RouteInfo | null;
  loading: boolean;
  error: string | null;
}

export function RouteControlPanel({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onOriginSelect,
  onDestinationSelect,
  vehicleType,
  onVehicleTypeChange,
  route,
  loading,
  error
}: RouteControlPanelProps) {
  // Format duration from seconds to readable format
  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Format distance from meters to readable format
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const hasRoute = route && route.routes && route.routes[0] && 
    route.routes[0].distance !== undefined && route.routes[0].duration !== undefined;

  return (
    <Card className="absolute top-4 left-4 w-80 z-10 shadow-lg" data-testid="route-control-panel">
      <CardContent className="p-4 space-y-4">
        {/* Solvice Maps Logo */}
        <div className="text-center pb-2 border-b">
          <h1 className="text-lg font-bold text-primary">Solvice Maps</h1>
        </div>
        {/* Vehicle Type Toggle Group */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Transport Mode</Label>
          <ToggleGroup
            type="single"
            value={vehicleType || 'CAR'}
            onValueChange={(value) => value && onVehicleTypeChange(value)}
            className="justify-start"
            data-testid="vehicle-type-toggle"
          >
            <ToggleGroupItem value="CAR" aria-label="Car" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              <span className="hidden sm:inline">Car</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="BIKE" aria-label="Bike" className="flex items-center gap-2">
              <Bike className="h-4 w-4" />
              <span className="hidden sm:inline">Bike</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="FOOT" aria-label="Walking" className="flex items-center gap-2">
              <Footprints className="h-4 w-4" />
              <span className="hidden sm:inline">Walk</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Origin Input */}
        <div className="space-y-2">
          <Label htmlFor="origin-input" className="text-sm font-medium flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            Origin
          </Label>
          <AutocompleteInput
            placeholder="Enter origin"
            value={origin}
            onChange={onOriginChange}
            onSelect={onOriginSelect}
          />
        </div>

        {/* Destination Input */}
        <div className="space-y-2">
          <Label htmlFor="destination-input" className="text-sm font-medium flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            Destination
          </Label>
          <AutocompleteInput
            placeholder="Enter destination"
            value={destination}
            onChange={onDestinationChange}
            onSelect={onDestinationSelect}
          />
        </div>

        {/* Route Information */}
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Calculating route...</span>
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive">
            Error: {error}
          </div>
        )}

        {hasRoute && !loading && (
          <div className="space-y-2 pt-2 border-t" data-testid="route-info">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {formatDuration(route.routes[0].duration!)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {formatDistance(route.routes[0].distance!)}
                </span>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Route calculated via {(vehicleType || 'CAR').toLowerCase()}
            </Badge>
          </div>
        )}

        {/* Instructions */}
        {!hasRoute && !loading && !error && (
          <div className="text-xs text-muted-foreground">
            Click on the map to place markers or enter addresses above
          </div>
        )}
      </CardContent>
    </Card>
  );
}