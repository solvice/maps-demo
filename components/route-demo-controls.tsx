'use client';

import { RouteControlPanel } from './route-control-panel';
import { SpeedProfile } from './speed-profile';
import { Coordinates } from '@/lib/coordinates';
import { RouteResponse } from '@/lib/solvice-api';
import { RouteConfig } from './route-config';
import { RoutePoint } from '@/lib/route-point';

interface RouteDemoControlsProps {
  origin: Coordinates | null;
  destination: Coordinates | null;
  originText: string;
  destinationText: string;
  onOriginTextChange: (text: string) => void;
  onDestinationTextChange: (text: string) => void;
  onOriginSelect: (result: { coordinates: Coordinates; address: string; confidence: number }) => void;
  onDestinationSelect: (result: { coordinates: Coordinates; address: string; confidence: number }) => void;
  routeConfig: RouteConfig;
  onRouteConfigChange: (config: RouteConfig) => void;
  route: RouteResponse | null;
  trafficRoute: RouteResponse | null;
  loading: boolean;
  trafficLoading: boolean;
  error: string | null;
  trafficError: string | null;
  showInstructions: boolean;
  onShowInstructionsChange: (show: boolean) => void;
  onHighlightedStepGeometryChange: (geometry: string | null) => void;
  routePoints?: RoutePoint[];
  onRemoveWaypoint?: (waypointId: string) => void;
}

export function RouteDemoControls({
  origin,
  destination,
  originText,
  destinationText,
  onOriginTextChange,
  onDestinationTextChange,
  onOriginSelect,
  onDestinationSelect,
  routeConfig,
  onRouteConfigChange,
  route,
  trafficRoute,
  loading,
  trafficLoading,
  error,
  trafficError,
  showInstructions,
  onShowInstructionsChange,
  onHighlightedStepGeometryChange,
  routePoints,
  onRemoveWaypoint,
}: RouteDemoControlsProps) {
  return (
    <>
      <RouteControlPanel
        origin={originText}
        destination={destinationText}
        onOriginChange={onOriginTextChange}
        onDestinationChange={onDestinationTextChange}
        onOriginSelect={onOriginSelect}
        onDestinationSelect={onDestinationSelect}
        vehicleType={routeConfig.vehicleType}
        onVehicleTypeChange={(value) => onRouteConfigChange({ ...routeConfig, vehicleType: value as 'CAR' | 'BIKE' | 'TRUCK' | 'ELECTRIC_CAR' | 'ELECTRIC_BIKE' })}
        routeConfig={routeConfig}
        onRouteConfigChange={onRouteConfigChange}
        route={route}
        trafficRoute={trafficRoute}
        loading={loading}
        trafficLoading={trafficLoading}
        error={error}
        trafficError={trafficError}
        showInstructions={showInstructions}
        onShowInstructionsChange={onShowInstructionsChange}
        originCoordinates={origin}
        destinationCoordinates={destination}
        routePoints={routePoints}
        onRemoveWaypoint={onRemoveWaypoint}
      />
      
      {(route || trafficRoute) && (
        <SpeedProfile
          route={route}
          trafficRoute={trafficRoute}
          show={true}
          onStepHover={onHighlightedStepGeometryChange}
          showInstructions={showInstructions}
        />
      )}
    </>
  );
}