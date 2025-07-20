'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Clock, MapPin, Car, Bike, Truck, Code } from 'lucide-react';
import { AutocompleteInput } from '@/components/autocomplete-input';
import { RouteResponse } from '@/lib/solvice-api';
import { RouteInstructions } from '@/components/route-instructions';
import { toast } from 'sonner';

type Coordinates = [number, number];

// Route config interface
export interface RouteConfig {
  alternatives?: number;
  steps?: boolean;
  annotations?: string[];
  geometries?: 'polyline' | 'geojson' | 'polyline6';
  overview?: 'full' | 'simplified' | 'false';
  continue_straight?: boolean;
  snapping?: 'default' | 'any';
  vehicleType?: 'CAR' | 'BIKE' | 'TRUCK' | 'ELECTRIC_CAR' | 'ELECTRIC_BIKE';
  routingEngine?: 'OSM' | 'TOMTOM' | 'GOOGLE' | 'ANYMAP';
  departureTime?: string;
  interpolate?: boolean;
  generate_hints?: boolean;
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
  
  // Route config
  routeConfig: RouteConfig;
  onRouteConfigChange: (config: RouteConfig) => void;
  
  // Route info
  route: RouteResponse | null;
  loading: boolean;
  error: string | null;
  
  // Route highlighting
  onRouteHover?: (routeIndex: number | null) => void;
  
  // Instructions
  showInstructions?: boolean;
  
  // Debug
  originCoordinates?: [number, number] | null;
  destinationCoordinates?: [number, number] | null;
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
  routeConfig,
  onRouteConfigChange: _,
  route,
  loading,
  error,
  onRouteHover,
  showInstructions = false,
  originCoordinates: originCoords,
  destinationCoordinates: destinationCoords
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

  // Route colors matching the RouteLayer colors
  const routeColors = [
    '#3b82f6', // Blue for primary route
    '#93c5fd', // Light blue for alternatives
    '#93c5fd', // Light blue for alternatives
    '#93c5fd'  // Light blue for alternatives
  ];

  // Copy request JSON for debugging
  const copyRequestJson = async () => {
    if (!originCoords || !destinationCoords) {
      toast.error('Need both origin and destination to generate request');
      return;
    }

    const requestJson = {
      coordinates: [originCoords, destinationCoords],
      ...routeConfig
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(requestJson, null, 2));
      toast.success('Request JSON copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <TooltipProvider>
      <Card className="absolute top-4 left-4 w-72 z-10 shadow-lg" data-testid="route-control-panel">
        <CardContent className="p-3 space-y-3">
        {/* Header with Solvice Maps Logo */}
        <div className="text-center pb-2">
          <h1 className="text-xl font-extrabold text-black tracking-wide">
            Solvice Maps
          </h1>
        </div>
        {/* Vehicle Type Toggle Group */}
        <div className="flex justify-center">
          <ToggleGroup
            type="single"
            value={vehicleType || 'CAR'}
            onValueChange={(value) => value && onVehicleTypeChange(value)}
            className="justify-center"
            data-testid="vehicle-type-toggle"
          >
            <ToggleGroupItem value="CAR" aria-label="Car" className="flex items-center justify-center">
              <Car className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="TRUCK" aria-label="Truck" className="flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="BIKE" aria-label="Bike" className="flex items-center justify-center">
              <Bike className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Origin Input */}
        <div className="space-y-1">
          <Label htmlFor="origin-input" className="text-xs font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
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
        <div className="space-y-1">
          <Label htmlFor="destination-input" className="text-xs font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
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
            {route.routes.map((routeData, index) => (
              routeData.distance !== undefined && routeData.duration !== undefined && (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors"
                  onMouseEnter={() => onRouteHover?.(index)}
                  onMouseLeave={() => onRouteHover?.(null)}
                >
                  <div className="flex items-center gap-2 text-sm">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: routeColors[index] || routeColors[0] }}
                    />
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatDuration(routeData.duration)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatDistance(routeData.distance)}
                    </span>
                  </div>
                </div>
              )
            ))}
          </div>
        )}



        {/* Instructions */}
        {!hasRoute && !loading && !error && (
          <div className="text-xs text-muted-foreground">
            Click on the map to place markers or enter addresses above
          </div>
        )}
        
        {/* Turn-by-turn instructions that roll out */}
        {showInstructions && routeConfig.steps && (
          <div className="mt-3 pt-3 border-t animate-in slide-in-from-top-2 duration-300">
            <div className="max-h-80 overflow-hidden">
              <RouteInstructions
                route={route}
                selectedRouteIndex={0}
                embedded={true}
              />
            </div>
          </div>
        )}
        
          {/* Debug: Copy request JSON */}
          <div className="flex justify-end pt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-50 hover:opacity-100 hover:bg-muted/50 transition-all duration-200"
                  onClick={copyRequestJson}
                >
                  <Code className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Copy request JSON to clipboard</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}