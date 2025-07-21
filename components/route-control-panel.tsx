'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Code, HelpCircle, Share, List, BookOpen } from 'lucide-react';
import { LocationInputPair } from '@/components/location-input-pair';
import { VehicleSelector } from '@/components/vehicle-selector';
import { RouteResponse } from '@/lib/solvice-api';
import { RouteInstructions } from '@/components/route-instructions';
import { RouteInfoList } from '@/components/route-info-list';
import { toast } from 'sonner';
import { useRouteStats } from '@/hooks/use-route-stats';

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

  // Use the custom hook to extract route statistics logic
  const {
    hasRoute,
    trafficDifference,
    trafficDifferenceText,
    getTrafficDifferenceStyle,
    routeColors,
    getRequestJson,
    getShareUrl
  } = useRouteStats({
    route,
    trafficRoute,
    routeConfig,
    originCoordinates: originCoords,
    destinationCoordinates: destinationCoords
  });

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
        {/* Icons in top-right corner */}
        <div className="absolute top-3 right-3 flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-60 hover:opacity-100 transition-opacity"
                onClick={() => window.open('https://maps.solvice.io/route/post-route', '_blank')}
              >
                <BookOpen className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Route API Documentation</p>
            </TooltipContent>
          </Tooltip>
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

        {/* Header with Solvice Maps Logo */}
        <div className="text-center pb-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-extrabold text-black tracking-wide">
              Solvice Maps
            </h1>
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
        {/* Vehicle Type Selection */}
        <VehicleSelector
          vehicleType={vehicleType}
          onVehicleTypeChange={onVehicleTypeChange}
        />

        {/* Location Inputs */}
        <LocationInputPair
          origin={origin}
          onOriginChange={onOriginChange}
          onOriginSelect={onOriginSelect}
          destination={destination}
          onDestinationChange={onDestinationChange}
          onDestinationSelect={onDestinationSelect}
          disabled={loading}
        />

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

        <RouteInfoList
          route={route}
          trafficRoute={trafficRoute}
          trafficLoading={trafficLoading}
          loading={loading}
          routeColors={routeColors}
          onRouteHover={onRouteHover}
          trafficDifference={trafficDifference}
          trafficDifferenceText={trafficDifferenceText}
          getTrafficDifferenceStyle={getTrafficDifferenceStyle}
        />



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
            <div className="max-h-[calc(100vh-120px)] overflow-y-auto">
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