'use client';

import { useMemo, useCallback } from 'react';
import { RouteResponse } from '@/lib/solvice-api';
import { RouteConfig } from '@/components/route-control-panel';
import { calculateTrafficDifference, formatTrafficDifference } from '@/lib/route-utils';

export interface UseRouteStatsParams {
  route: RouteResponse | null;
  trafficRoute: RouteResponse | null | undefined;
  routeConfig: RouteConfig;
  originCoordinates: [number, number] | null | undefined;
  destinationCoordinates: [number, number] | null | undefined;
}

export interface UseRouteStatsReturn {
  // Route validation
  hasRoute: boolean;
  hasTrafficRoute: boolean;
  
  // Traffic difference calculations
  trafficDifference: number | null;
  trafficDifferenceText: string;
  
  // Traffic difference styling
  getTrafficDifferenceStyle: (seconds: number | null) => string;
  
  // Route colors
  routeColors: string[];
  
  // URL generation
  getRequestJson: () => object | null;
  getShareUrl: () => string | null;
}

export function useRouteStats({
  route,
  trafficRoute,
  routeConfig,
  originCoordinates,
  destinationCoordinates
}: UseRouteStatsParams): UseRouteStatsReturn {

  // Route validation logic
  const hasRoute = useMemo(() => {
    return Boolean(route && 
           route.routes && 
           route.routes[0] && 
           route.routes[0].distance !== undefined && 
           route.routes[0].duration !== undefined);
  }, [route]);

  const hasTrafficRoute = useMemo(() => {
    return Boolean(trafficRoute && 
           trafficRoute.routes && 
           trafficRoute.routes[0] && 
           trafficRoute.routes[0].distance !== undefined && 
           trafficRoute.routes[0].duration !== undefined);
  }, [trafficRoute]);

  // Traffic difference calculations
  const trafficDifference = useMemo(() => {
    return hasRoute && hasTrafficRoute 
      ? calculateTrafficDifference(route, trafficRoute)
      : null;
  }, [hasRoute, hasTrafficRoute, route, trafficRoute]);

  const trafficDifferenceText = useMemo(() => {
    return trafficDifference !== null 
      ? formatTrafficDifference(trafficDifference) 
      : '';
  }, [trafficDifference]);

  // Traffic difference styling function
  const getTrafficDifferenceStyle = useCallback((seconds: number | null): string => {
    if (seconds === null) return '';
    if (seconds === 0) return 'text-green-600'; // No delay
    if (seconds < 0) return 'text-green-600'; // Traffic savings
    if (seconds < 900) return 'text-yellow-600'; // Small delay (< 15 min)
    return 'text-red-600'; // Severe delay (>= 15 min)
  }, []);

  // Route colors matching the RouteLayer colors
  const routeColors = useMemo(() => [
    '#3b82f6', // Blue for primary route
    '#93c5fd', // Light blue for alternatives
    '#93c5fd', // Light blue for alternatives
    '#93c5fd'  // Light blue for alternatives
  ], []);

  // Request JSON generation
  const getRequestJson = useCallback(() => {
    if (!originCoordinates || !destinationCoordinates) {
      return null;
    }
    return {
      coordinates: [originCoordinates, destinationCoordinates],
      ...routeConfig
    };
  }, [originCoordinates, destinationCoordinates, routeConfig]);

  // Share URL generation
  const getShareUrl = useCallback(() => {
    if (!originCoordinates || !destinationCoordinates) {
      return null;
    }
    
    const url = new URL(window.location.origin + '/route');
    url.searchParams.set('origin', `${originCoordinates[0]},${originCoordinates[1]}`);
    url.searchParams.set('destination', `${destinationCoordinates[0]},${destinationCoordinates[1]}`);
    
    if (routeConfig.departureTime) {
      url.searchParams.set('departureTime', routeConfig.departureTime);
    }
    
    return url.toString();
  }, [originCoordinates, destinationCoordinates, routeConfig]);

  return {
    hasRoute,
    hasTrafficRoute,
    trafficDifference,
    trafficDifferenceText,
    getTrafficDifferenceStyle,
    routeColors,
    getRequestJson,
    getShareUrl
  };
}