import { useState, useCallback, useRef, useEffect } from 'react';
import { reverseGeocode, forwardGeocode } from '@/lib/geocoding';
import { Coordinates } from '@/lib/coordinates';

interface GeocodingState {
  loading: boolean;
  error: string | null;
}

export function useGeocoding() {
  const [state, setState] = useState<GeocodingState>({
    loading: false,
    error: null,
  });

  // Refs for request coordination and debouncing
  const currentRequestRef = useRef<number>(0);
  const forwardDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reverse geocode: coordinates to address
  const getAddressFromCoordinates = useCallback(async (
    coordinates: Coordinates
  ): Promise<string | null> => {
    const requestId = Date.now();
    currentRequestRef.current = requestId;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const address = await reverseGeocode(coordinates);
      
      // Only update state if this is still the current request
      if (currentRequestRef.current === requestId) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: null,
        }));
        return address;
      }
      return null;
    } catch (error) {
      // Only update state if this is still the current request
      if (currentRequestRef.current === requestId) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Geocoding failed',
        }));
      }
      return null;
    }
  }, []);

  // Forward geocode: address to coordinates (with debouncing)
  const getCoordinatesFromAddress = useCallback((
    address: string,
    debounceMs: number = 500
  ): Promise<Coordinates | null> => {
    return new Promise((resolve) => {
      // Clear any existing debounce timeout
      if (forwardDebounceTimeoutRef.current) {
        clearTimeout(forwardDebounceTimeoutRef.current);
      }

      // If address is empty, resolve immediately with null
      if (!address || address.trim().length === 0) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: null,
        }));
        resolve(null);
        return;
      }

      // Set up debounced execution
      forwardDebounceTimeoutRef.current = setTimeout(async () => {
        const requestId = Date.now();
        currentRequestRef.current = requestId;

        setState(prev => ({
          ...prev,
          loading: true,
          error: null,
        }));

        try {
          const coordinates = await forwardGeocode(address);
          
          // Only update state if this is still the current request
          if (currentRequestRef.current === requestId) {
            setState(prev => ({
              ...prev,
              loading: false,
              error: null,
            }));
            resolve(coordinates);
          } else {
            resolve(null);
          }
        } catch (error) {
          // Only update state if this is still the current request
          if (currentRequestRef.current === requestId) {
            const errorMessage = error instanceof Error ? error.message : 'Geocoding failed';
            setState(prev => ({
              ...prev,
              loading: false,
              error: errorMessage,
            }));
          }
          resolve(null);
        }
      }, debounceMs);
    });
  }, []);

  // Clear any pending debounce timeouts on unmount
  useEffect(() => {
    return () => {
      if (forwardDebounceTimeoutRef.current) {
        clearTimeout(forwardDebounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    loading: state.loading,
    error: state.error,
    getAddressFromCoordinates,
    getCoordinatesFromAddress,
  };
}