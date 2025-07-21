'use client';

import { RouteResponse } from '@/lib/solvice-api';
import { RouteInfoCard } from '@/components/route-info-card';

export interface RouteInfoListProps {
  route: RouteResponse | null;
  trafficRoute?: RouteResponse | null;
  trafficLoading?: boolean;
  loading?: boolean;
  routeColors: string[];
  onRouteHover?: (routeIndex: number | null) => void;
  
  // Traffic comparison props
  trafficDifference: number | null;
  trafficDifferenceText: string | null;
  getTrafficDifferenceStyle: (difference: number | null) => string;
}

export function RouteInfoList({
  route,
  trafficRoute,
  trafficLoading = false,
  loading = false,
  routeColors,
  onRouteHover,
  trafficDifference,
  trafficDifferenceText,
  getTrafficDifferenceStyle
}: RouteInfoListProps) {
  // Don't render anything if loading or no routes available
  if (loading || (!route && !trafficRoute)) {
    return null;
  }

  const hasRoute = route && route.routes && route.routes.length > 0;
  const hasTrafficRoute = trafficRoute && trafficRoute.routes && trafficRoute.routes.length > 0;

  return (
    <div className="space-y-2 pt-2 border-t" data-testid="route-info">
      {/* Regular route display */}
      {hasRoute && route && route.routes.map((routeData, index) => 
        routeData.distance !== undefined && routeData.duration !== undefined && (
          <RouteInfoCard
            key={`regular-${index}`}
            route={routeData}
            routeIndex={index}
            routeColor={routeColors[index] || routeColors[0]}
            mode="regular"
            onRouteHover={onRouteHover}
            trafficRoute={hasTrafficRoute && trafficRoute ? trafficRoute.routes[index] : undefined}
            trafficLoading={trafficLoading}
            trafficDifferenceText={trafficDifferenceText}
            trafficDifferenceStyle={getTrafficDifferenceStyle(trafficDifference)}
          />
        )
      )}
      
      {/* Traffic-only route display (when regular route failed) */}
      {!hasRoute && hasTrafficRoute && trafficRoute && trafficRoute.routes.map((routeData, index) => 
        routeData.distance !== undefined && routeData.duration !== undefined && (
          <RouteInfoCard
            key={`traffic-only-${index}`}
            route={routeData}
            routeIndex={index}
            routeColor={routeColors[index] || routeColors[0]}
            mode="traffic-only"
            onRouteHover={onRouteHover}
            trafficDifferenceText={null}
            trafficDifferenceStyle=""
          />
        )
      )}
    </div>
  );
}