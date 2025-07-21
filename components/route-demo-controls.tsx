'use client';

import { RouteControlPanel } from './route-control-panel';
import { SpeedProfile } from './speed-profile';
import { Coordinates } from '@/lib/coordinates';
import { RouteResponse } from '@/lib/solvice-api';
import { RouteConfig } from './route-config';

interface RouteDemoControlsProps {
  origin: Coordinates | null;
  destination: Coordinates | null;
  originText: string;
  destinationText: string;
  originSelected: boolean;
  destinationSelected: boolean;
  onOriginChange: (origin: Coordinates | null) => void;
  onDestinationChange: (destination: Coordinates | null) => void;
  onOriginTextChange: (text: string) => void;
  onDestinationTextChange: (text: string) => void;
  onOriginSelect: (result: { coordinates: Coordinates; address: string; confidence: number }) => void;
  onDestinationSelect: (result: { coordinates: Coordinates; address: string; confidence: number }) => void;
  routeConfig: RouteConfig;
  onRouteConfigChange: (config: RouteConfig) => void;
  onClearRoute: () => void;
  route: RouteResponse | null;
  trafficRoute: RouteResponse | null;
  loading: boolean;
  trafficLoading: boolean;
  error: string | null;
  trafficError: string | null;
  calculationTime: number | null;
  trafficCalculationTime: number | null;
  showInstructions: boolean;
  onShowInstructionsChange: (show: boolean) => void;
  highlightedStepIndex: number | null;
  onHighlightedStepIndexChange: (index: number | null) => void;
  onHighlightedStepGeometryChange: (geometry: string | null) => void;
}

export function RouteDemoControls({
  origin,
  destination,
  originText,
  destinationText,
  originSelected,
  destinationSelected,
  onOriginChange,
  onDestinationChange,
  onOriginTextChange,
  onDestinationTextChange,
  onOriginSelect,
  onDestinationSelect,
  routeConfig,
  onRouteConfigChange,
  onClearRoute,
  route,
  trafficRoute,
  loading,
  trafficLoading,
  error,
  trafficError,
  calculationTime,
  trafficCalculationTime,
  showInstructions,
  onShowInstructionsChange,
  highlightedStepIndex,
  onHighlightedStepIndexChange,
  onHighlightedStepGeometryChange,
}: RouteDemoControlsProps) {
  return (
    <>
      <RouteControlPanel
        origin={origin}
        destination={destination}
        originText={originText}
        destinationText={destinationText}
        originSelected={originSelected}
        destinationSelected={destinationSelected}
        onOriginChange={onOriginChange}
        onDestinationChange={onDestinationChange}
        onOriginTextChange={onOriginTextChange}
        onDestinationTextChange={onDestinationTextChange}
        onOriginSelect={onOriginSelect}
        onDestinationSelect={onDestinationSelect}
        routeConfig={routeConfig}
        onRouteConfigChange={onRouteConfigChange}
        onClearRoute={onClearRoute}
        route={route}
        trafficRoute={trafficRoute}
        loading={loading}
        trafficLoading={trafficLoading}
        error={error}
        trafficError={trafficError}
        calculationTime={calculationTime}
        trafficCalculationTime={trafficCalculationTime}
        showInstructions={showInstructions}
        onShowInstructionsChange={onShowInstructionsChange}
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