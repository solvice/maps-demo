'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { RouteResponse } from '@/lib/solvice-api';
import { formatDistance } from '@/lib/format';

interface SpeedProfileProps {
  route: RouteResponse | null;
  selectedRouteIndex?: number;
  show?: boolean;
  onStepHover?: (stepGeometry: string | null, stepIndex: number | null) => void;
}

const chartConfig = {
  speed: {
    label: "Speed",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

export function SpeedProfile({ route, selectedRouteIndex = 0, show = false, onStepHover }: SpeedProfileProps) {
  if (!show || !route || !route.routes || route.routes.length === 0) {
    return null;
  }

  const selectedRoute = route.routes[selectedRouteIndex];
  if (!selectedRoute || !selectedRoute.legs || selectedRoute.legs.length === 0) {
    return null;
  }

  // Debug logging to understand actual data structure
  console.log('🚗 SpeedProfile - Debug Data:');
  console.log('selectedRoute:', selectedRoute);
  console.log('selectedRoute.legs:', selectedRoute.legs);
  
  if (selectedRoute.legs && selectedRoute.legs[0]) {
    console.log('First leg:', selectedRoute.legs[0]);
    console.log('First leg annotation:', selectedRoute.legs[0].annotation);
  }

  // Extract speed data from route legs annotations
  const speedData: Array<{ distance: number; speed: number; distanceLabel: string; stepIndex: number; geometry?: string }> = [];
  let cumulativeDistance = 0;
  let globalStepIndex = 0;

  selectedRoute.legs.forEach((leg: any, legIndex) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    console.log(`🦵 Leg ${legIndex}:`, leg);
    console.log(`📊 Leg ${legIndex} annotation:`, leg.annotation);
    console.log(`👣 Leg ${legIndex} steps:`, leg.steps);
    
    // First priority: Use step-level data if available
    if (leg.steps && leg.steps.length > 0) {
      console.log(`🚶 Using step-level data for leg ${legIndex} (${leg.steps.length} steps)`);
      
      leg.steps.forEach((step: any, stepIndex: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        console.log(`👣 Step ${stepIndex}:`, step);
        console.log(`🗺️ Step ${stepIndex} geometry:`, step.geometry);
        
        if (step.distance && step.duration) {
          const stepDistance = step.distance;
          const stepDuration = step.duration;
          
          // Calculate speed: distance (meters) / duration (seconds) = m/s
          // Convert to km/h: m/s * 3.6 = km/h
          const speedMs = stepDistance / stepDuration; // m/s
          const speedKmh = speedMs * 3.6; // km/h
          
          console.log(`🏃 Step ${stepIndex}: ${stepDistance}m in ${stepDuration}s = ${speedKmh.toFixed(1)} km/h`);
          
          speedData.push({
            distance: cumulativeDistance,
            speed: Math.round(speedKmh),
            distanceLabel: formatDistance(cumulativeDistance),
            stepIndex: globalStepIndex,
            geometry: step.geometry
          });
          
          cumulativeDistance += stepDistance;
          globalStepIndex++;
        } else {
          console.log(`⚠️ Step ${stepIndex} missing distance or duration`);
        }
      });
      
    // Second priority: Use annotation arrays if steps not available
    } else if (leg.annotation && leg.annotation.distance && leg.annotation.duration) {
      console.log(`📊 Using annotation data for leg ${legIndex}`);
      
      const distances = leg.annotation.distance;
      const durations = leg.annotation.duration;
      
      console.log(`📏 Distances array length: ${distances.length}`);
      console.log(`⏱️ Durations array length: ${durations.length}`);
      console.log(`📏 Distances:`, distances);
      console.log(`⏱️ Durations:`, durations);
      
      // Process each segment in the annotation arrays
      for (let i = 0; i < distances.length && i < durations.length; i++) {
        const segmentDistance = distances[i];
        const segmentDuration = durations[i];
        
        // Calculate speed: distance (meters) / duration (seconds) = m/s
        // Convert to km/h: m/s * 3.6 = km/h
        const speedMs = segmentDistance / segmentDuration; // m/s
        const speedKmh = speedMs * 3.6; // km/h
        
        console.log(`🏃 Annotation ${i}: ${segmentDistance}m in ${segmentDuration}s = ${speedKmh.toFixed(1)} km/h`);
        
        speedData.push({
          distance: cumulativeDistance,
          speed: Math.round(speedKmh),
          distanceLabel: formatDistance(cumulativeDistance),
          stepIndex: globalStepIndex,
          geometry: undefined // No geometry available for annotation segments
        });
        globalStepIndex++;
        
        cumulativeDistance += segmentDistance;
      }
      
    // Fallback: Use leg-level data
    } else {
      console.log(`❌ Leg ${legIndex} missing both steps and annotation data - using leg fallback`);
      
      if (leg.distance && leg.duration) {
        const speedMs = leg.distance / leg.duration;
        const speedKmh = speedMs * 3.6;
        
        console.log(`🏃 Leg ${legIndex} fallback: ${leg.distance}m in ${leg.duration}s = ${speedKmh.toFixed(1)} km/h`);
        
        speedData.push({
          distance: cumulativeDistance,
          speed: Math.round(speedKmh),
          distanceLabel: formatDistance(cumulativeDistance),
          stepIndex: globalStepIndex,
          geometry: undefined // No geometry available for leg-level fallback
        });
        globalStepIndex++;
        
        cumulativeDistance += leg.distance;
      }
    }
  });

  if (speedData.length === 0) {
    console.log('❌ No speed data available');
    return null;
  }

  console.log('📈 Final speed data:', speedData);

  // Calculate speed stats
  const speeds = speedData.map(d => d.speed);
  const minSpeed = Math.min(...speeds);
  const maxSpeed = Math.max(...speeds);
  const avgSpeed = Math.round(speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length);

  return (
    <Card className="absolute bottom-4 left-4 right-4 h-48 z-10 shadow-lg animate-in slide-in-from-bottom-2 duration-300" data-testid="speed-profile">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Speed Profile</CardTitle>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Min: {minSpeed} km/h</span>
            <span>Max: {maxSpeed} km/h</span>
            <span>Avg: {avgSpeed} km/h</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <ChartContainer config={chartConfig} className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={speedData} 
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
                tickFormatter={(value) => `${value} km/h`}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <ChartTooltip
                content={<ChartTooltipContent 
                  labelFormatter={(value) => `Distance: ${formatDistance(Number(value))}`}
                  formatter={(value) => [`${value} km/h`, 'Speed']}
                />}
              />
              <Area
                type="monotone"
                dataKey="speed"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#speedGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}