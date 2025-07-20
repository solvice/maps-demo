'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { AutocompleteInput } from '@/components/autocomplete-input';
import { RouteResponse } from '@/lib/solvice-api';
import { Coordinates } from '@/lib/coordinates';
import { formatDistance, formatDuration } from '@/lib/format';

interface GeocodingResult {
  coordinates: Coordinates;
  address: string;
  confidence: number;
}

interface InputOverlayProps {
  origin: string;
  destination: string;
  onOriginChange: (value: string) => void;
  onDestinationChange: (value: string) => void;
  onOriginSelect?: (result: GeocodingResult) => void;
  onDestinationSelect?: (result: GeocodingResult) => void;
  loading?: boolean;
  error?: string | null;
  route?: RouteResponse | null;
}

export function InputOverlay({
  origin,
  destination,
  onOriginChange,
  onDestinationChange,
  onOriginSelect,
  onDestinationSelect,
  loading = false,
  error = null,
  route = null,
}: InputOverlayProps) {
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Prevent map interaction when clicking on overlay
    e.stopPropagation();
  };


  return (
    <div
      data-testid="input-overlay"
      className="absolute top-4 left-4 right-4 sm:right-auto z-10 bg-white rounded shadow p-3 sm:p-4 max-w-full sm:max-w-none"
      onClick={handleOverlayClick}
    >
      <div data-testid="input-container" className="flex flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
        <div className="flex flex-col space-y-1">
          <Label htmlFor="origin-input" className="text-sm font-medium">
            Origin
          </Label>
          <AutocompleteInput
            value={origin}
            onChange={onOriginChange}
            onSelect={onOriginSelect || (() => {})}
            placeholder="Enter origin"
            className="h-10 w-full sm:w-48"
          />
        </div>

        <div className="flex flex-col space-y-1">
          <Label htmlFor="destination-input" className="text-sm font-medium">
            Destination
          </Label>
          <AutocompleteInput
            value={destination}
            onChange={onDestinationChange}
            onSelect={onDestinationSelect || (() => {})}
            placeholder="Enter destination"
            className="h-10 w-full sm:w-48"
          />
        </div>
      </div>

      {/* Status and route information */}
      <div className="mt-3 space-y-1">
        {loading && (
          <div data-testid="loading-indicator" className="flex items-center space-x-2 text-sm text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Calculating route...</span>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        {route && route.routes && route.routes[0] && (
          <div className="text-sm text-gray-600 flex space-x-4">
            {route.routes[0].distance && (
              <span>{formatDistance(route.routes[0].distance)}</span>
            )}
            {route.routes[0].duration && (
              <span>{formatDuration(route.routes[0].duration)}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}