import { useState, useCallback, useRef, useEffect } from 'react';
import { calculateRoute as apiCalculateRoute, RouteResponse, CreateRouteOptions } from '@/lib/solvice-api';
import { Coordinates } from '@/lib/coordinates';

interface UseRouteState {
  route: RouteResponse | null;
  loading: boolean;
  error: string | null;
  calculationTime: number | null;
}

export function useRoute() {
  
  const [state, setState] = useState<UseRouteState>({
    route: null,
    loading: false,
    error: null,
    calculationTime: null,
  });

  // Ref to track the current request timestamp for cancellation
  const currentRequestRef = useRef<number>(0);
  // Ref for debounce timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateRoute = useCallback((
    origin: Coordinates | null,
    destination: Coordinates | null,
    options?: CreateRouteOptions,
    debounceMs: number = 300
  ) => {
    // Clear route if either coordinate is missing
    if (!origin || !destination) {
      // Clear any pending debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      
      setState(prev => ({
        ...prev,
        route: null,
        error: null,
        loading: false,
        calculationTime: null,
      }));
      return;
    }

    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set up debounced execution
    debounceTimeoutRef.current = setTimeout(async () => {
      // Generate unique request ID
      const requestId = Date.now();
      currentRequestRef.current = requestId;

      // Set loading state and clear previous error
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const startTime = performance.now();
        const routeData = await apiCalculateRoute(origin, destination, options);
        const endTime = performance.now();
        const calculationTime = Math.round(endTime - startTime);
        
        // Only update state if this is still the current request
        if (currentRequestRef.current === requestId) {
          setState(prev => ({
            ...prev,
            route: routeData,
            loading: false,
            error: null,
            calculationTime,
          }));
        }
      } catch (error) {
        // Only update state if this is still the current request
        if (currentRequestRef.current === requestId) {
          setState(prev => ({
            ...prev,
            route: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            calculationTime: null,
          }));
        }
      }
    }, debounceMs);
  }, []);

  const clearRoute = useCallback(() => {
    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    setState({
      route: null,
      loading: false,
      error: null,
      calculationTime: null,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    route: state.route,
    loading: state.loading,
    error: state.error,
    calculationTime: state.calculationTime,
    calculateRoute,
    clearRoute,
  };
}