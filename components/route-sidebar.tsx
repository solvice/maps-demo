'use client';

import React from 'react';
import { RouteResponse } from '@/lib/solvice-api';
import { cn } from '@/lib/utils';
import { formatDistance, formatDuration } from '@/lib/format';

interface RouteSidebarProps {
  route: RouteResponse | null;
  loading?: boolean;
  onClose?: () => void;
}

export function RouteSidebar({
  route,
  loading = false,
  onClose,
}: RouteSidebarProps) {
  // Don't render if no route data and not loading
  if (!loading && (!route || !route.routes || route.routes.length === 0)) {
    return null;
  }

  // Loading state
  if (loading) {
    return (
      <div
        data-testid="route-sidebar-loading"
        className={cn(
          "absolute z-10 bg-white rounded shadow-lg p-4",
          "top-4 right-4",
          "bottom-4 left-4 right-4", // Mobile positioning
          "sm:w-80 sm:bottom-auto sm:left-auto" // Desktop positioning
        )}
        role="region"
        aria-label="Route information"
        aria-live="polite"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Route Details</h3>
          {onClose && (
            <button
              data-testid="close-sidebar"
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onClose();
                }
              }}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close route details"
            >
              ×
            </button>
          )}
        </div>
        
        <div data-testid="loading-skeleton" className="space-y-3">
          <p className="text-sm text-blue-600">Calculating route...</p>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const routeData = route?.routes?.[0];
  
  // Handle empty route data
  if (!routeData || (!routeData.distance && !routeData.duration)) {
    return (
      <div
        data-testid="route-sidebar"
        className={cn(
          "absolute z-10 bg-white rounded shadow-lg p-4",
          "top-4 right-4",
          "bottom-4 left-4 right-4", // Mobile positioning
          "sm:w-80 sm:bottom-auto sm:left-auto" // Desktop positioning
        )}
        role="region"
        aria-label="Route information"
        aria-live="polite"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Route Details</h3>
          {onClose && (
            <button
              data-testid="close-sidebar"
              onClick={onClose}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  onClose();
                }
              }}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close route details"
            >
              ×
            </button>
          )}
        </div>
        
        <p className="text-sm text-gray-500">No route data available</p>
      </div>
    );
  }


  return (
    <div
      data-testid="route-sidebar"
      className={cn(
        "absolute z-10 bg-white rounded shadow-lg p-4",
        "top-4 right-4",
        "bottom-4 left-4 right-4", // Mobile positioning
        "sm:w-80 sm:bottom-auto sm:left-auto" // Desktop positioning
      )}
      role="region"
      aria-label="Route information"
      aria-live="polite"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Route Details</h3>
        {onClose && (
          <button
            data-testid="close-sidebar"
            onClick={onClose}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onClose();
              }
            }}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close route details"
          >
            ×
          </button>
        )}
      </div>

      {/* Distance and Duration */}
      <div className="space-y-2 mb-4">
        {routeData.distance && (
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700">Distance:</span>
            <span className="ml-2">{formatDistance(routeData.distance)}</span>
          </div>
        )}
        
        {routeData.duration && (
          <div className="flex items-center text-sm">
            <span className="font-medium text-gray-700">Time:</span>
            <span className="ml-2">{formatDuration(routeData.duration)}</span>
          </div>
        )}
      </div>

      {/* Route Summary/Legs */}
      {routeData.legs && routeData.legs.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Route</h4>
          {routeData.legs.map((leg, index) => (
            leg.summary && (
              <div key={index} className="text-sm text-gray-600">
                {leg.summary}
              </div>
            )
          ))}
        </div>
      )}

      {/* Waypoints */}
      {route?.waypoints && route.waypoints.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Waypoints</h4>
          <div className="space-y-1">
            {route.waypoints.map((waypoint, index) => (
              <div key={index} className="text-sm text-gray-600">
                {waypoint.name || `${waypoint.location[1]}, ${waypoint.location[0]}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}