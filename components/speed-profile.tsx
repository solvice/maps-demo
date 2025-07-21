'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { RouteResponse } from '@/lib/solvice-api';
import { formatDistance } from '@/lib/format';
import { useMapContext } from '@/contexts/map-context';
import { extractRouteCoordinates } from '@/lib/route-utils';
import { useSpeedData } from '@/hooks/use-speed-data';

interface SpeedProfileProps {
  route: RouteResponse | null;
  trafficRoute?: RouteResponse | null;
  selectedRouteIndex?: number;
  show?: boolean;
  onStepHover?: (stepGeometry: string | null, stepIndex: number | null) => void;
  showInstructions?: boolean;
}

const chartConfig = {
  speed: {
    label: "Regular Speed",
    color: "#3b82f6",
  },
  trafficSpeed: {
    label: "Traffic Speed",
    color: "#f97316",
  },
} satisfies ChartConfig;


export function SpeedProfile({ route, trafficRoute, selectedRouteIndex = 0, show = false, onStepHover, showInstructions = false }: SpeedProfileProps) {
  const map = useMapContext();
  
  if (!show || !route || !route.routes || route.routes.length === 0) {
    return null;
  }

  // Use the hook to get processed speed data
  const { combinedData, avgSpeed, avgTrafficSpeed } = useSpeedData({
    route,
    trafficRoute,
    selectedRouteIndex
  });

  if (combinedData.length === 0) {
    console.log('❌ No speed data available');
    return null;
  }

  // Function to find coordinates at a specific distance along the route
  const getCoordinatesAtDistance = (targetDistance: number): [number, number] | null => {
    if (!route || !route.routes || route.routes.length === 0) return null;
    
    try {
      // Extract all route coordinates
      const routeCoordinates = extractRouteCoordinates(route, 'polyline');
      if (routeCoordinates.length === 0) return null;
      
      // Calculate cumulative distances along the route
      let cumulativeDistance = 0;
      const coordinatesWithDistance: Array<{ coords: [number, number], distance: number }> = [];
      
      coordinatesWithDistance.push({ coords: routeCoordinates[0], distance: 0 });
      
      for (let i = 1; i < routeCoordinates.length; i++) {
        const prev = routeCoordinates[i - 1];
        const curr = routeCoordinates[i];
        
        // Calculate distance between points (rough approximation)
        const latDiff = curr[1] - prev[1];
        const lngDiff = curr[0] - prev[0];
        const segmentDistance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000; // Convert to meters
        
        cumulativeDistance += segmentDistance;
        coordinatesWithDistance.push({ coords: curr, distance: cumulativeDistance });
      }
      
      // Find the coordinate closest to target distance
      let closest = coordinatesWithDistance[0];
      let minDiff = Math.abs(targetDistance - closest.distance);
      
      for (const point of coordinatesWithDistance) {
        const diff = Math.abs(targetDistance - point.distance);
        if (diff < minDiff) {
          minDiff = diff;
          closest = point;
        }
      }
      
      return closest.coords;
    } catch (error) {
      console.error('Error calculating coordinates at distance:', error);
      return null;
    }
  };


  // Adjust position when instructions are shown to avoid overlap
  const bottomClass = showInstructions ? "bottom-4 left-80 right-4" : "bottom-4 left-4 right-4";

  return (
    <Card className={`absolute ${bottomClass} h-64 z-10 shadow-lg animate-in slide-in-from-bottom-2 duration-300`} data-testid="speed-profile">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Speed Profile</CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Regular: {avgSpeed} km/h</span>
            </div>
            {avgTrafficSpeed && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Traffic: {avgTrafficSpeed} km/h</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <ChartContainer config={chartConfig} className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={combinedData} 
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              onMouseMove={(data) => {
                if (data && data.activePayload && data.activePayload[0]) {
                  const payload = data.activePayload[0].payload;
                  
                  // Call step hover callback
                  if (onStepHover) {
                    onStepHover(payload.geometry || null, payload.stepIndex);
                  }
                  
                  // FlyTo corresponding location on map
                  if (map && map.isStyleLoaded()) {
                    const coords = getCoordinatesAtDistance(payload.distance);
                    if (coords) {
                      map.flyTo({
                        center: coords,
                        zoom: Math.max(map.getZoom(), 14), // Don't zoom out, only zoom in if needed
                        duration: 500, // Quick transition
                        essential: false // Allow interruption
                      });
                    }
                  }
                }
              }}
              onMouseLeave={() => {
                if (onStepHover) {
                  onStepHover(null, null);
                }
              }}
            >
              <defs>
                <linearGradient id="fillSpeed" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-speed)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-speed)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillTrafficSpeed" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-trafficSpeed)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-trafficSpeed)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="distance"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => formatDistance(value)}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                tickFormatter={(value) => `${Math.round(value)} km/h`}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <ChartTooltip
                position={{ x: undefined, y: -25 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const numValue = Number(label);
                    const distanceLabel = isNaN(numValue) ? '0 m' : formatDistance(numValue);
                    
                    // Get the data point from the first payload entry
                    const dataPoint = payload[0]?.payload;
                    const geometry = dataPoint?.geometry;
                    const locationName = dataPoint?.locationName;
                    const routeRef = dataPoint?.routeRef;
                    const destinations = dataPoint?.destinations;
                    
                    // Build location display string
                    const locationParts = [];
                    if (locationName) locationParts.push(locationName);
                    if (routeRef) locationParts.push(`(${routeRef})`);
                    const locationDisplay = locationParts.join(' ');
                    
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-2 max-w-xs">
                        <p className="text-xs font-medium mb-1">{`Distance: ${distanceLabel}`}</p>
                        
                        {locationDisplay && (
                          <div className="mb-2">
                            <p className="text-xs font-medium truncate">{locationDisplay}</p>
                            {destinations && (
                              <p className="text-xs text-muted-foreground truncate">→ {destinations}</p>
                            )}
                          </div>
                        )}
                        
                        <div className="space-y-1 mb-2">
                          {payload.map((entry, index) => {
                            const speed = Number(entry.value);
                            const roundedSpeed = isNaN(speed) ? 0 : Math.round(speed);
                            const isTraffic = entry.dataKey === 'trafficSpeed';
                            const color = isTraffic ? '#f97316' : '#3b82f6'; // Orange for traffic, blue for regular
                            const label = isTraffic ? 'Traffic Speed' : 'Regular Speed';
                            
                            return (
                              <div key={index} className="flex items-center gap-1 text-xs">
                                <div 
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-muted-foreground">{isTraffic ? 'Traffic' : 'Speed'}:</span>
                                <span className="font-medium">{roundedSpeed} km/h</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="speed"
                stroke="var(--color-speed)"
                strokeWidth={2}
                fill="url(#fillSpeed)"
                connectNulls={false}
              />
              {trafficRoute && (
                <Area
                  type="monotone"
                  dataKey="trafficSpeed"
                  stroke="var(--color-trafficSpeed)"
                  strokeWidth={2}
                  fill="url(#fillTrafficSpeed)"
                  connectNulls={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}