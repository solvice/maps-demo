'use client';

import { Card, CardContent } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Clock, MapPin, Car, Bike, Truck, Code, HelpCircle, Share, List } from 'lucide-react';
import { AutocompleteInput } from '@/components/autocomplete-input';
import { RouteResponse } from '@/lib/solvice-api';
import { RouteInstructions } from '@/components/route-instructions';
import { toast } from 'sonner';
import { calculateTrafficDifference, formatTrafficDifference } from '@/lib/route-utils';

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
  
  // Traffic comparison
  trafficRoute?: RouteResponse | null;
  trafficLoading?: boolean;
  trafficError?: string | null;
  
  // Route highlighting
  onRouteHover?: (routeIndex: number | null) => void;
  
  // Instructions
  showInstructions?: boolean;
  onShowInstructionsChange?: (show: boolean) => void;
  
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onRouteConfigChange: _onRouteConfigChange,
  route,
  loading,
  error,
  trafficRoute,
  trafficLoading = false,
  trafficError,
  onRouteHover,
  showInstructions = false,
  onShowInstructionsChange,
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

  const hasTrafficRoute = trafficRoute && trafficRoute.routes && trafficRoute.routes[0] && 
    trafficRoute.routes[0].distance !== undefined && trafficRoute.routes[0].duration !== undefined;

  // Calculate traffic difference if both routes are available
  const trafficDifference = hasRoute && hasTrafficRoute 
    ? calculateTrafficDifference(route, trafficRoute)
    : null;

  // Format traffic difference for display
  const trafficDifferenceText = trafficDifference !== null 
    ? formatTrafficDifference(trafficDifference) 
    : '';

  // Get styling for traffic difference based on severity
  const getTrafficDifferenceStyle = (seconds: number | null): string => {
    if (seconds === null) return '';
    if (seconds === 0) return 'text-green-600'; // No delay
    if (seconds < 0) return 'text-green-600'; // Traffic savings
    if (seconds < 900) return 'text-yellow-600'; // Small delay (< 15 min)
    return 'text-red-600'; // Severe delay (>= 15 min)
  };

  // Route colors matching the RouteLayer colors
  const routeColors = [
    '#3b82f6', // Blue for primary route
    '#93c5fd', // Light blue for alternatives
    '#93c5fd', // Light blue for alternatives
    '#93c5fd'  // Light blue for alternatives
  ];

  // Generate request JSON for debugging
  const getRequestJson = () => {
    if (!originCoords || !destinationCoords) {
      return null;
    }
    return {
      coordinates: [originCoords, destinationCoords],
      ...routeConfig
    };
  };

  // Copy request JSON for debugging
  const copyRequestJson = async () => {
    const requestJson = getRequestJson();
    if (!requestJson) {
      toast.error('Need both origin and destination to generate request');
      return;
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(requestJson, null, 2));
      toast.success('Request JSON copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  // Generate shareable URL
  const getShareUrl = () => {
    if (!originCoords || !destinationCoords) {
      return null;
    }
    
    const url = new URL(window.location.origin + '/route');
    url.searchParams.set('origin', `${originCoords[0]},${originCoords[1]}`);
    url.searchParams.set('destination', `${destinationCoords[0]},${destinationCoords[1]}`);
    
    if (routeConfig.departureTime) {
      url.searchParams.set('departureTime', routeConfig.departureTime);
    }
    
    return url.toString();
  };

  // Copy share URL
  const copyShareUrl = async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) {
      toast.error('Need both origin and destination to generate share URL');
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(`Share URL copied to clipboard: ${shareUrl}`);
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
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-extrabold text-black tracking-wide">
              Solvice Maps
            </h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" side="right" align="start">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm mb-2">How to Use Solvice Maps</h3>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div>
                        <strong>🗺️ Set Route Points:</strong>
                        <ul className="ml-2 mt-1 space-y-1">
                          <li>• Click on map to place origin/destination</li>
                          <li>• Type addresses in the input fields</li>
                          <li>• Drag markers to adjust locations</li>
                        </ul>
                      </div>
                      
                      <div>
                        <strong>🚗 Vehicle Options:</strong>
                        <ul className="ml-2 mt-1 space-y-1">
                          <li>• Car: Standard routing</li>
                          <li>• Truck: Commercial vehicle restrictions</li>
                          <li>• Bike: Bicycle-friendly routes</li>
                        </ul>
                      </div>
                      
                      <div>
                        <strong>📊 Features:</strong>
                        <ul className="ml-2 mt-1 space-y-1">
                          <li>• Speed profile chart with automatic traffic comparison</li>
                          <li>• Turn-by-turn navigation instructions</li>
                          <li>• Multiple routing engines (OSM, TomTom, Google)</li>
                          <li>• Always-on real-time traffic data integration</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <h4 className="font-semibold text-sm mb-2">📎 Share Routes</h4>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>Share routes by copying the URL with parameters:</p>
                      <div className="bg-muted p-2 rounded text-xs font-mono break-all">
                        /route?origin=3.7174,51.0543&destination=3.7274,51.0643&departureTime=2024-01-01T12:00:00.000Z
                      </div>
                      <div className="space-y-1 mt-2">
                        <div><code className="bg-muted px-1 rounded">origin</code> - Start coordinates (lng,lat)</div>
                        <div><code className="bg-muted px-1 rounded">destination</code> - End coordinates (lng,lat)</div>
                        <div><code className="bg-muted px-1 rounded">departureTime</code> - ISO timestamp (optional)</div>
                      </div>
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-xs font-medium text-blue-800 mb-1">Try it now:</p>
                        <a
                          href="/route?origin=3.7174,51.0543&destination=3.7274,51.0643"
                          className="text-xs text-blue-600 hover:text-blue-800 underline hover:no-underline font-mono break-all"
                          onClick={(e) => {
                            e.preventDefault();
                            const url = new URL(window.location.origin + '/route');
                            url.search = "origin=3.7174,51.0543&destination=3.7274,51.0643";
                            window.location.href = url.toString();
                          }}
                        >
                          /route?origin=3.7174,51.0543&destination=3.7274,51.0643
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <h4 className="font-semibold text-sm mb-2">🔧 Developer Tools</h4>
                    <div className="text-xs text-muted-foreground">
                      <p>Use the action buttons at the bottom of the panel to share routes and access debugging tools.</p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="text-xs text-muted-foreground">
            <a 
              href="https://www.tomtom.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              supported by TOMTOM
            </a>
          </div>
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

        {/* Route Information with Traffic Comparison */}
        {(loading || trafficLoading) && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {loading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Calculating route...</span>
              </div>
            )}
            {trafficLoading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking traffic...</span>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive">
            Error: {error}
          </div>
        )}

        {trafficError && !trafficRoute && (
          <div className="text-sm text-muted-foreground">
            Traffic info unavailable
          </div>
        )}

        {(hasRoute || hasTrafficRoute) && !loading && (
          <div className="space-y-2 pt-2 border-t" data-testid="route-info">
            {/* Regular route display */}
            {hasRoute && route.routes.map((routeData, index) => (
              routeData.distance !== undefined && routeData.duration !== undefined && (
                <div 
                  key={`regular-${index}`}
                  className="p-2 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors"
                  onMouseEnter={() => onRouteHover?.(index)}
                  onMouseLeave={() => onRouteHover?.(null)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: routeColors[index] || routeColors[0] }}
                      />
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span 
                        className="font-medium"
                        data-testid="regular-route-duration"
                        aria-label="Regular route duration"
                      >
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
                  
                  {/* Traffic comparison for this route */}
                  {hasTrafficRoute && trafficRoute.routes[index] && !trafficLoading && (
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span 
                          className="font-medium"
                          data-testid="traffic-route-duration"
                          aria-label="Traffic route duration"
                        >
                          With traffic: {formatDuration(trafficRoute.routes[index].duration!)}
                        </span>
                      </div>
                      {trafficDifferenceText && (
                        <span 
                          className={`font-medium ${getTrafficDifferenceStyle(trafficDifference)}`}
                          data-testid="traffic-difference"
                          aria-label={`Traffic delay: ${trafficDifferenceText}`}
                        >
                          {trafficDifferenceText}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            ))}
            
            {/* Traffic-only route display (when regular route failed) */}
            {!hasRoute && hasTrafficRoute && trafficRoute.routes.map((routeData, index) => (
              routeData.distance !== undefined && routeData.duration !== undefined && (
                <div 
                  key={`traffic-only-${index}`}
                  className="p-2 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors"
                  onMouseEnter={() => onRouteHover?.(index)}
                  onMouseLeave={() => onRouteHover?.(null)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span 
                        className="font-medium"
                        data-testid="traffic-route-duration"
                        aria-label="Traffic route duration"
                      >
                        With traffic: {formatDuration(routeData.duration)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatDistance(routeData.distance)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        )}



        {/* Action buttons */}
        <div className="pt-2 border-t">
          {!hasRoute && !loading && !error ? (
            <div className="text-xs text-muted-foreground text-center">
              Click on the map to place markers or enter addresses above
            </div>
          ) : (
            <div className="flex justify-center gap-2">
              {/* Share URL button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={copyShareUrl}
                  >
                    <Share className="h-3 w-3 mr-1" />
                    Share
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy share URL to clipboard</p>
                </TooltipContent>
              </Tooltip>

              {/* Copy JSON button */}
              <Popover>
                <PopoverTrigger asChild>
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-3 text-xs"
                          onClick={copyRequestJson}
                        >
                          <Code className="h-3 w-3 mr-1" />
                          JSON
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Copy API request JSON</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3" side="top" align="center">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Request JSON</h4>
                    {getRequestJson() ? (
                      <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-64 font-mono">
                        {JSON.stringify(getRequestJson(), null, 2)}
                      </pre>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Set both origin and destination to see request JSON
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Click the button to copy to clipboard
                    </p>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Show Steps button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={showInstructions ? "default" : "outline"}
                    size="sm"
                    className="h-8 px-3 text-xs"
                    onClick={() => onShowInstructionsChange?.(!showInstructions)}
                  >
                    <List className="h-3 w-3 mr-1" />
                    Steps
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{showInstructions ? 'Hide' : 'Show'} turn-by-turn instructions</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
        
        {/* Turn-by-turn instructions that roll out */}
        {showInstructions && (
          <div className="mt-3 pt-3 border-t animate-in slide-in-from-top-2 duration-300">
            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              <RouteInstructions
                route={route}
                selectedRouteIndex={0}
                embedded={true}
              />
            </div>
          </div>
        )}

        </CardContent>
      </Card>
    </TooltipProvider>
  );
}