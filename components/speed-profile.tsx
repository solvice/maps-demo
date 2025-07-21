'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig } from '@/components/ui/chart';
import { RouteResponse } from '@/lib/solvice-api';
import { extractRouteCoordinates } from '@/lib/route-utils';
import { useSpeedData } from '@/hooks/use-speed-data';
import { SpeedChart } from '@/components/speed-chart';

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
  // Use the hook to get processed speed data (hooks must be called before any early returns)
  const { combinedData, avgSpeed, avgTrafficSpeed } = useSpeedData({
    route,
    trafficRoute,
    selectedRouteIndex
  });

  if (!show || !route || !route.routes || route.routes.length === 0) {
    return null;
  }

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
        <SpeedChart
          combinedData={combinedData}
          chartConfig={chartConfig}
          hasTrafficData={!!trafficRoute}
          onStepHover={onStepHover}
          getCoordinatesAtDistance={getCoordinatesAtDistance}
        />
      </CardContent>
    </Card>
  );
}