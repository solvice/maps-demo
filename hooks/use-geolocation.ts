'use client';

import { useEffect, useState } from 'react';

interface GeolocationState {
  coordinates: [number, number] | null; // [longitude, latitude]
  error: string | null;
  loading: boolean;
}

interface UseGeolocationOptions {
  timeout?: number;
  enableHighAccuracy?: boolean;
  fallback?: [number, number]; // [longitude, latitude]
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const { 
    timeout = 10000, 
    enableHighAccuracy = true,
    fallback = [3.7174, 51.0543] // Ghent coordinates 
  } = options;

  const [state, setState] = useState<GeolocationState>({
    coordinates: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        coordinates: fallback,
        error: 'Geolocation is not supported by this browser',
        loading: false,
      });
      return;
    }

    const successHandler = (position: GeolocationPosition) => {
      const { longitude, latitude } = position.coords;
      setState({
        coordinates: [longitude, latitude],
        error: null,
        loading: false,
      });
    };

    const errorHandler = (error: GeolocationPositionError) => {
      let errorMessage: string;
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'User denied the request for Geolocation.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'The request to get user location timed out.';
          break;
        default:
          errorMessage = 'An unknown error occurred.';
          break;
      }

      setState({
        coordinates: fallback,
        error: errorMessage,
        loading: false,
      });
    };

    navigator.geolocation.getCurrentPosition(
      successHandler,
      errorHandler,
      {
        enableHighAccuracy,
        timeout,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, [timeout, enableHighAccuracy, fallback]);

  return state;
}