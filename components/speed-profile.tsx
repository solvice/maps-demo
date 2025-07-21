'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { RouteResponse } from '@/lib/solvice-api';
import { formatDistance } from '@/lib/format';

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

// Helper function to extract speed data from a route
function extractSpeedData(route: RouteResponse, selectedRouteIndex: number, routeType: 'regular' | 'traffic' = 'regular') {
  const selectedRoute = route.routes[selectedRouteIndex];
  if (!selectedRoute || !selectedRoute.legs || selectedRoute.legs.length === 0) {
    return [];
  }

  console.log(`🚗 SpeedProfile - ${routeType} route data:`, selectedRoute);

  const speedData: Array<{ 
    distance: number; 
    speed: number; 
    trafficSpeed?: number;
    distanceLabel: string; 
    stepIndex: number; 
    geometry?: string;
  }> = [];
  let cumulativeDistance = 0;
  let globalStepIndex = 0;

  selectedRoute.legs.forEach((leg: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // First priority: Use step-level data if available
    if (leg.steps && leg.steps.length > 0) {
      leg.steps.forEach((step: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (step.distance && step.duration) {
          const stepDistance = step.distance;
          const stepDuration = step.duration;
          
          // Calculate speed: distance (meters) / duration (seconds) = m/s
          // Convert to km/h: m/s * 3.6 = km/h
          const speedMs = stepDistance / stepDuration; // m/s
          const speedKmh = speedMs * 3.6; // km/h
          
          const dataPoint = {
            distance: cumulativeDistance,
            speed: routeType === 'regular' ? Math.round(speedKmh) : 0,
            trafficSpeed: routeType === 'traffic' ? Math.round(speedKmh) : undefined,
            distanceLabel: formatDistance(cumulativeDistance),
            stepIndex: globalStepIndex,
            geometry: step.geometry
          };
          
          speedData.push(dataPoint);
          
          cumulativeDistance += stepDistance;
          globalStepIndex++;
        }
      });
      
    // Second priority: Use annotation arrays if steps not available
    } else if (leg.annotation && leg.annotation.distance && leg.annotation.duration) {
      const distances = leg.annotation.distance;
      const durations = leg.annotation.duration;
      
      // Process each segment in the annotation arrays
      for (let i = 0; i < distances.length && i < durations.length; i++) {
        const segmentDistance = distances[i];
        const segmentDuration = durations[i];
        
        // Calculate speed: distance (meters) / duration (seconds) = m/s
        // Convert to km/h: m/s * 3.6 = km/h
        const speedMs = segmentDistance / segmentDuration; // m/s
        const speedKmh = speedMs * 3.6; // km/h
        
        const dataPoint = {
          distance: cumulativeDistance,
          speed: routeType === 'regular' ? Math.round(speedKmh) : 0,
          trafficSpeed: routeType === 'traffic' ? Math.round(speedKmh) : undefined,
          distanceLabel: formatDistance(cumulativeDistance),
          stepIndex: globalStepIndex,
          geometry: undefined // No geometry available for annotation segments
        };
        
        speedData.push(dataPoint);
        globalStepIndex++;
        
        cumulativeDistance += segmentDistance;
      }
      
    // Fallback: Use leg-level data
    } else if (leg.distance && leg.duration) {
      const speedMs = leg.distance / leg.duration;
      const speedKmh = speedMs * 3.6;
      
      const dataPoint = {
        distance: cumulativeDistance,
        speed: routeType === 'regular' ? Math.round(speedKmh) : 0,
        trafficSpeed: routeType === 'traffic' ? Math.round(speedKmh) : undefined,
        distanceLabel: formatDistance(cumulativeDistance),
        stepIndex: globalStepIndex,
        geometry: undefined // No geometry available for leg-level fallback
      };
      
      speedData.push(dataPoint);
      globalStepIndex++;
      
      cumulativeDistance += leg.distance;
    }
  });

  return speedData;
}

export function SpeedProfile({ route, trafficRoute, selectedRouteIndex = 0, show = false, onStepHover, showInstructions = false }: SpeedProfileProps) {
  if (!show || !route || !route.routes || route.routes.length === 0) {
    return null;
  }

  // Extract speed data from both routes
  const regularSpeedData = extractSpeedData(route, selectedRouteIndex, 'regular');
  const trafficSpeedData = trafficRoute ? extractSpeedData(trafficRoute, selectedRouteIndex, 'traffic') : [];

  if (regularSpeedData.length === 0) {
    console.log('❌ No regular speed data available');
    return null;
  }

  // Debug logging to understand the data mismatch
  console.log('🔵 Regular speed data points:', regularSpeedData.length);
  console.log('🟠 Traffic speed data points:', trafficSpeedData.length);
  
  if (regularSpeedData.length > 0) {
    console.log('🔵 Regular route total distance:', regularSpeedData[regularSpeedData.length - 1]?.distance);
  }
  if (trafficSpeedData.length > 0) {
    console.log('🟠 Traffic route total distance:', trafficSpeedData[trafficSpeedData.length - 1]?.distance);
  }

  // Create a common distance grid for both routes by resampling
  const maxDistance = Math.max(
    regularSpeedData.length > 0 ? regularSpeedData[regularSpeedData.length - 1].distance : 0,
    trafficSpeedData.length > 0 ? trafficSpeedData[trafficSpeedData.length - 1].distance : 0
  );

  // Create distance intervals (every ~200m for smooth curves)
  const sampleInterval = Math.max(50, maxDistance / 100); // At least 50m, max 100 points
  const distanceGrid = [];
  for (let distance = 0; distance <= maxDistance; distance += sampleInterval) {
    distanceGrid.push(distance);
  }

  console.log(`📏 Distance grid: 0 to ${maxDistance}m with ${distanceGrid.length} points (${sampleInterval}m intervals)`);

  // Helper function to interpolate speed at a given distance
  function interpolateSpeedAtDistance(speedData: Array<{ distance: number; speed?: number; trafficSpeed?: number }>, targetDistance: number): number | null {
    if (speedData.length === 0) return null;
    
    // Find the two closest points to our target distance
    let beforePoint = null;
    let afterPoint = null;
    
    for (let i = 0; i < speedData.length; i++) {
      const point = speedData[i];
      if (point.distance <= targetDistance) {
        beforePoint = point;
      }
      if (point.distance >= targetDistance && !afterPoint) {
        afterPoint = point;
        break;
      }
    }

    // If target is before first point, use first point speed
    if (!beforePoint && afterPoint) {
      return afterPoint.speed || afterPoint.trafficSpeed || 0;
    }
    
    // If target is after last point, use last point speed
    if (beforePoint && !afterPoint) {
      return beforePoint.speed || beforePoint.trafficSpeed || 0;
    }
    
    // If we have exact match
    if (beforePoint && beforePoint.distance === targetDistance) {
      return beforePoint.speed || beforePoint.trafficSpeed || 0;
    }
    
    // Interpolate between two points
    if (beforePoint && afterPoint) {
      const beforeSpeed = beforePoint.speed || beforePoint.trafficSpeed || 0;
      const afterSpeed = afterPoint.speed || afterPoint.trafficSpeed || 0;
      const distanceRatio = (targetDistance - beforePoint.distance) / (afterPoint.distance - beforePoint.distance);
      const interpolatedSpeed = beforeSpeed + (afterSpeed - beforeSpeed) * distanceRatio;
      return Math.round(interpolatedSpeed * 10) / 10; // Round to 1 decimal place
    }
    
    return null;
  }

  // Resample both routes to the common distance grid
  const combinedData = distanceGrid.map(distance => {
    const regularSpeed = interpolateSpeedAtDistance(regularSpeedData, distance);
    const trafficSpeed = interpolateSpeedAtDistance(trafficSpeedData, distance);
    
    return {
      distance,
      speed: regularSpeed,
      trafficSpeed,
      distanceLabel: formatDistance(distance),
      stepIndex: Math.floor(distance / sampleInterval), // Synthetic step index
      geometry: undefined // No specific geometry for interpolated points
    };
  });

  console.log('📈 Combined speed data points:', combinedData.length);
  console.log('📈 Combined speed data sample:', combinedData.slice(0, 3));

  // Calculate speed stats for both routes
  const speeds = combinedData.map(d => d.speed).filter((s): s is number => s !== null && s > 0);
  const trafficSpeeds = combinedData.map(d => d.trafficSpeed).filter((s): s is number => s !== null && s > 0);
  
  const avgSpeed = speeds.length > 0 ? Math.round(speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length) : 0;
  const avgTrafficSpeed = trafficSpeeds.length > 0 ? Math.round(trafficSpeeds.reduce((sum, speed) => sum + speed, 0) / trafficSpeeds.length) : null;

  // Adjust position when instructions are shown to avoid overlap
  const bottomClass = showInstructions ? "bottom-4 left-80 right-4" : "bottom-4 left-4 right-4";

  return (
    <Card className={`absolute ${bottomClass} h-48 z-10 shadow-lg animate-in slide-in-from-bottom-2 duration-300`} data-testid="speed-profile">
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
        <ChartContainer config={chartConfig} className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={combinedData} 
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              onMouseMove={(data) => {
                if (data && data.activePayload && data.activePayload[0] && onStepHover) {
                  const payload = data.activePayload[0].payload;
                  onStepHover(payload.geometry || null, payload.stepIndex);
                }
              }}
              onMouseLeave={() => {
                if (onStepHover) {
                  onStepHover(null, null);
                }
              }}
            >
              <defs>
                <linearGradient id="speedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="trafficSpeedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
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
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const numValue = Number(label);
                    const distanceLabel = isNaN(numValue) ? '0 m' : formatDistance(numValue);
                    
                    // Get the data point from the first payload entry
                    const dataPoint = payload[0]?.payload;
                    const geometry = dataPoint?.geometry;
                    
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3 max-w-md">
                        <p className="text-sm font-medium mb-2">{`Distance: ${distanceLabel}`}</p>
                        <div className="space-y-1 mb-3">
                          {payload.map((entry, index) => {
                            const speed = Number(entry.value);
                            const roundedSpeed = isNaN(speed) ? 0 : Math.round(speed);
                            const isTraffic = entry.dataKey === 'trafficSpeed';
                            const color = isTraffic ? '#f97316' : '#3b82f6'; // Orange for traffic, blue for regular
                            const label = isTraffic ? 'Traffic Speed' : 'Regular Speed';
                            
                            return (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div 
                                  className="w-2 h-2 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-muted-foreground">{label}:</span>
                                <span className="font-medium">{roundedSpeed} km/h</span>
                              </div>
                            );
                          })}
                        </div>
                        
                        {geometry && (
                          <div className="border-t pt-2 mt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Geometry:</p>
                            <div className="text-xs font-mono bg-muted p-2 rounded max-h-20 overflow-y-auto break-all">
                              {geometry}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="speed"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#speedGradient)"
                connectNulls={false}
              />
              {trafficRoute && (
                <Area
                  type="monotone"
                  dataKey="trafficSpeed"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#trafficSpeedGradient)"
                  fillOpacity={0.6}
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