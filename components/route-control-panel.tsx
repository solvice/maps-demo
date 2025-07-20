'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Loader2, Clock, MapPin, Car, Bike, Truck, Settings } from 'lucide-react';
import { AutocompleteInput } from '@/components/autocomplete-input';
import { RouteResponse } from '@/lib/solvice-api';
import { useState } from 'react';

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
  onRouteConfigChange,
  route,
  loading,
  error,
  onRouteHover
}: RouteControlPanelProps) {
  const [showExpertSettings, setShowExpertSettings] = useState(false);

  // Helper function to update route config
  const updateConfig = (updates: Partial<RouteConfig>) => {
    onRouteConfigChange({ ...routeConfig, ...updates });
  };

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

  return (
    <Card className="absolute top-4 left-4 w-72 z-10 shadow-lg" data-testid="route-control-panel">
      <CardContent className="p-3 space-y-3">
        {/* Header with Solvice Maps Logo and Expert Settings */}
        <div className="flex items-center justify-between pb-1 border-b">
          <h1 className="text-base font-bold text-primary">Solvice Maps</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowExpertSettings(!showExpertSettings)}
            className="h-6 w-6 p-0 hover:bg-muted"
            title="Expert Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
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


        {/* Expert Settings Section */}
        {showExpertSettings && (
          <div className="space-y-2 pt-1 border-t">
            {/* Route Engine */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Routing Engine</Label>
              <Select
                value={routeConfig.routingEngine || 'OSM'}
                onValueChange={(value) => updateConfig({ routingEngine: value as RouteConfig['routingEngine'] })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OSM">OpenStreetMap</SelectItem>
                  <SelectItem value="TOMTOM">TomTom</SelectItem>
                  <SelectItem value="GOOGLE">Google</SelectItem>
                  <SelectItem value="ANYMAP">AnyMap</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alternative Routes */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Alternative Routes</Label>
              <Input
                type="number"
                min="0"
                max="3"
                value={routeConfig.alternatives || 1}
                onChange={(e) => updateConfig({ alternatives: parseInt(e.target.value) || 1 })}
                className="h-7 text-xs"
              />
            </div>

            {/* Route Overview */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Route Detail</Label>
              <Select
                value={routeConfig.overview || 'full'}
                onValueChange={(value) => updateConfig({ overview: value as RouteConfig['overview'] })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Detail</SelectItem>
                  <SelectItem value="simplified">Simplified</SelectItem>
                  <SelectItem value="false">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Geometry Format */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Geometry Format</Label>
              <Select
                value={routeConfig.geometries || 'polyline'}
                onValueChange={(value) => updateConfig({ geometries: value as RouteConfig['geometries'] })}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="polyline">Polyline</SelectItem>
                  <SelectItem value="geojson">GeoJSON</SelectItem>
                  <SelectItem value="polyline6">Polyline6</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced Options */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Steps</Label>
                <Switch
                  checked={routeConfig.steps || false}
                  onCheckedChange={(checked) => updateConfig({ steps: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-xs">Continue Straight</Label>
                <Switch
                  checked={routeConfig.continue_straight !== false}
                  onCheckedChange={(checked) => updateConfig({ continue_straight: checked })}
                />
              </div>
            </div>
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