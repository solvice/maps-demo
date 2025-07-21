'use client';

import { Clock, MapPin } from 'lucide-react';
import { Route } from '@/lib/solvice-api';
import { formatDuration, formatDistance } from '@/lib/format';

export interface RouteInfoCardProps {
  route: Route;
  routeIndex: number;
  routeColor: string;
  mode?: 'regular' | 'traffic-only';
  onRouteHover?: (routeIndex: number | null) => void;
  
  // Traffic comparison props (only for regular mode)
  trafficRoute?: Route | null;
  trafficLoading?: boolean;
  trafficDifferenceText: string | null;
  trafficDifferenceStyle: string;
}

export function RouteInfoCard({
  route,
  routeIndex,
  routeColor,
  mode = 'regular',
  onRouteHover,
  trafficRoute,
  trafficLoading = false,
  trafficDifferenceText,
  trafficDifferenceStyle
}: RouteInfoCardProps) {
  const handleMouseEnter = () => {
    onRouteHover?.(routeIndex);
  };

  const handleMouseLeave = () => {
    onRouteHover?.(null);
  };

  // Only show traffic comparison in regular mode and when not loading
  const showTrafficComparison = mode === 'regular' && trafficRoute && !trafficLoading;

  return (
    <div 
      className="p-2 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-testid="route-info-card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: mode === 'traffic-only' ? '#f97316' : routeColor }}
            data-testid="route-color-indicator"
          />
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span 
            className="font-medium"
            data-testid={mode === 'traffic-only' ? 'traffic-route-duration' : 'regular-route-duration'}
            aria-label={mode === 'traffic-only' ? 'Traffic route duration' : 'Regular route duration'}
          >
            {mode === 'traffic-only' ? `With traffic: ${formatDuration(route.duration)}` : formatDuration(route.duration)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {formatDistance(route.distance)}
          </span>
        </div>
      </div>
      
      {/* Traffic comparison for regular routes */}
      {showTrafficComparison && (
        <div className="mt-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full bg-orange-500" 
              data-testid="traffic-color-indicator"
            />
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span 
              className="font-medium"
              data-testid="traffic-route-duration"
              aria-label="Traffic route duration"
            >
              With traffic: {formatDuration(trafficRoute.duration)}
            </span>
          </div>
          {trafficDifferenceText && (
            <span 
              className={`font-medium ${trafficDifferenceStyle}`}
              data-testid="traffic-difference"
              aria-label={`Traffic delay: ${trafficDifferenceText}`}
            >
              {trafficDifferenceText}
            </span>
          )}
        </div>
      )}
    </div>
  );
}