'use client';

import React from 'react';
import { ArrowUpDown, Loader2 } from 'lucide-react';
import { LocationInput } from '@/components/location-input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Coordinates = [number, number];

interface GeocodingResult {
  coordinates: Coordinates;
  address: string;
  confidence: number;
}

interface LocationInputPairProps {
  // Origin
  origin: string;
  onOriginChange: (value: string) => void;
  onOriginSelect: (result: GeocodingResult) => void;
  onOriginClear?: () => void;
  originError?: string;
  
  // Destination
  destination: string;
  onDestinationChange: (value: string) => void;
  onDestinationSelect: (result: GeocodingResult) => void;
  onDestinationClear?: () => void;
  destinationError?: string;
  
  // Shared state
  disabled?: boolean;
  loading?: boolean;
  
  // Swap functionality
  onSwap?: () => void;
  
  // Styling
  className?: string;
}

export function LocationInputPair({
  origin,
  onOriginChange,
  onOriginSelect,
  onOriginClear,
  originError,
  destination,
  onDestinationChange,
  onDestinationSelect,
  onDestinationClear,
  destinationError,
  disabled = false,
  loading = false,
  onSwap,
  className,
}: LocationInputPairProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {/* Loading indicator */}
      {loading && (
        <div className="flex items-center justify-center" data-testid="loading-indicator">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      )}
      
      {/* Origin Input */}
      <LocationInput
        label="Origin"
        value={origin}
        onChange={onOriginChange}
        onSelect={onOriginSelect}
        onClear={onOriginClear}
        indicatorColor="bg-green-500"
        placeholder="Enter origin"
        error={originError}
        disabled={disabled || loading}
      />

      {/* Swap Button - positioned between inputs */}
      {onSwap && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
            onClick={onSwap}
            disabled={disabled || loading}
            aria-label="Swap origin and destination"
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Destination Input */}
      <LocationInput
        label="Destination"
        value={destination}
        onChange={onDestinationChange}
        onSelect={onDestinationSelect}
        onClear={onDestinationClear}
        indicatorColor="bg-red-500"
        placeholder="Enter destination"
        error={destinationError}
        disabled={disabled || loading}
      />
    </div>
  );
}