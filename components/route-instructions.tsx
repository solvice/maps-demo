'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUpLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowDownRight,
  RotateCw,
  RotateCcw,
  MapPin,
  Flag
} from 'lucide-react';
import { RouteResponse, RouteStep } from '@/lib/solvice-api';
import { formatDistance } from '@/lib/format';

interface RouteInstructionsProps {
  route: RouteResponse | null;
  selectedRouteIndex?: number;
  onClose?: () => void;
}

// Mapping of maneuver types to icons
const getManeuverIcon = (type: string, modifier?: string) => {
  const iconProps = { className: "h-4 w-4" };
  
  switch (type) {
    case 'depart':
      return <Flag {...iconProps} className="h-4 w-4 text-green-600" />;
    case 'arrive':
      return <MapPin {...iconProps} className="h-4 w-4 text-red-600" />;
    case 'turn':
      switch (modifier) {
        case 'left':
          return <ArrowLeft {...iconProps} />;
        case 'right':
          return <ArrowRight {...iconProps} />;
        case 'sharp left':
          return <ArrowUpLeft {...iconProps} />;
        case 'sharp right':
          return <ArrowUpRight {...iconProps} />;
        case 'slight left':
          return <ArrowUpLeft {...iconProps} className="h-4 w-4 opacity-70" />;
        case 'slight right':
          return <ArrowUpRight {...iconProps} className="h-4 w-4 opacity-70" />;
        default:
          return <ArrowUp {...iconProps} />;
      }
    case 'continue':
      return <ArrowUp {...iconProps} />;
    case 'merge':
      return modifier === 'left' ? <ArrowUpLeft {...iconProps} /> : <ArrowUpRight {...iconProps} />;
    case 'on ramp':
    case 'off ramp':
      return modifier === 'left' ? <ArrowUpLeft {...iconProps} /> : <ArrowUpRight {...iconProps} />;
    case 'fork':
      return modifier === 'left' ? <ArrowUpLeft {...iconProps} /> : <ArrowUpRight {...iconProps} />;
    case 'roundabout':
    case 'rotary':
      return <RotateCw {...iconProps} />;
    case 'roundabout turn':
      return <RotateCw {...iconProps} />;
    case 'exit roundabout':
    case 'exit rotary':
      return <ArrowUp {...iconProps} />;
    default:
      return <ArrowUp {...iconProps} />;
  }
};

// Generate instruction text from step data
const getInstructionText = (step: RouteStep): string => {
  const { maneuver, name, ref } = step;
  const roadName = name || (ref ? `${ref}` : 'unnamed road');
  
  switch (maneuver.type) {
    case 'depart':
      return `Start on ${roadName}`;
    case 'arrive':
      return `Arrive at destination`;
    case 'turn':
      const turnDirection = maneuver.modifier || 'straight';
      return `Turn ${turnDirection} onto ${roadName}`;
    case 'continue':
      return `Continue on ${roadName}`;
    case 'merge':
      return `Merge onto ${roadName}`;
    case 'on ramp':
      return `Take the ramp onto ${roadName}`;
    case 'off ramp':
      return `Take the exit onto ${roadName}`;
    case 'fork':
      const forkDirection = maneuver.modifier || 'straight';
      return `At the fork, go ${forkDirection} onto ${roadName}`;
    case 'roundabout':
    case 'rotary':
      return `Enter the roundabout and take exit onto ${roadName}`;
    case 'roundabout turn':
      return `In the roundabout, turn onto ${roadName}`;
    case 'exit roundabout':
    case 'exit rotary':
      return `Exit the roundabout onto ${roadName}`;
    default:
      return `Continue on ${roadName}`;
  }
};

export function RouteInstructions({ route, selectedRouteIndex = 0, onClose }: RouteInstructionsProps) {
  if (!route || !route.routes || route.routes.length === 0) {
    return null;
  }

  const selectedRoute = route.routes[selectedRouteIndex];
  if (!selectedRoute || !selectedRoute.legs || selectedRoute.legs.length === 0) {
    return null;
  }

  // Collect all steps from all legs
  const allSteps: RouteStep[] = [];
  selectedRoute.legs.forEach(leg => {
    if (leg.steps) {
      allSteps.push(...leg.steps);
    }
  });

  if (allSteps.length === 0) {
    return null;
  }

  return (
    <Card className="absolute top-4 right-4 w-80 h-96 z-10 shadow-lg" data-testid="route-instructions">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Turn-by-Turn Directions</CardTitle>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close directions"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {allSteps.length} steps
          </Badge>
          <span>•</span>
          <span>{formatDistance(selectedRoute.distance)}</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80 px-4">
          <div className="space-y-1 pb-4">
            {allSteps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-background border rounded-full">
                  {getManeuverIcon(step.maneuver.type, step.maneuver.modifier)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">
                    {getInstructionText(step)}
                  </p>
                  {step.distance > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistance(step.distance)}
                    </p>
                  )}
                  {step.destinations && (
                    <p className="text-xs text-muted-foreground mt-1">
                      towards {step.destinations}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}