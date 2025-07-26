import { useState, useCallback, useRef, useEffect } from 'react';
import { calculateRoute as apiCalculateRoute, calculateRouteMulti as apiCalculateRouteMulti, RouteResponse, CreateRouteOptions } from '@/lib/solvice-api';
import { Coordinates } from '@/lib/coordinates';
import { createTrafficRouteConfig } from '@/lib/route-utils';
import { RoutePoint, getCoordinatesInOrder, isRouteCalculable } from '@/lib/route-point';

interface UseRouteState {
  route: RouteResponse | null;
  loading: boolean;
  error: string | null;
  calculationTime: number | null;
  trafficRoute: RouteResponse | null;
  trafficLoading: boolean;
  trafficError: string | null;
  trafficCalculationTime: number | null;
}

export function useRoute() {
  
  const [state, setState] = useState<UseRouteState>({
    route: null,
    loading: false,
    error: null,
    calculationTime: null,
    trafficRoute: null,
    trafficLoading: false,
    trafficError: null,
    trafficCalculationTime: null,
  });

  // Ref to track the current request timestamp for cancellation
  const currentRequestRef = useRef<number>(0);
  // Ref for debounce timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateRoute = useCallback((
    origin: Coordinates | null,
    destination: Coordinates | null,
    options?: CreateRouteOptions,
    debounceMs: number = 300,
    compareTraffic?: boolean
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
        trafficRoute: null,
        trafficError: null,
        trafficLoading: false,
        trafficCalculationTime: null,
      }));
      return;
    }

    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Execute immediately if no debounce, otherwise set up debounced execution
    const executeRouteCalculation = async () => {
      // Generate unique request ID
      const requestId = Date.now();
      currentRequestRef.current = requestId;

      // Set loading states and clear previous errors
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        trafficLoading: compareTraffic || false,
        trafficError: null,
      }));

      // Execute requests
      if (compareTraffic) {
        // Dual requests: regular + traffic
        const promises = [
          // Regular route request
          (async () => {
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
          })(),
          
          // Traffic route request
          (async () => {
            try {
              const trafficConfig = createTrafficRouteConfig(options);
              const startTime = performance.now();
              const trafficData = await apiCalculateRoute(origin, destination, trafficConfig);
              const endTime = performance.now();
              const trafficCalculationTime = Math.round(endTime - startTime);
              
              // Only update state if this is still the current request
              if (currentRequestRef.current === requestId) {
                setState(prev => ({
                  ...prev,
                  trafficRoute: trafficData,
                  trafficLoading: false,
                  trafficError: null,
                  trafficCalculationTime,
                }));
              }
            } catch (error) {
              // Only update state if this is still the current request
              if (currentRequestRef.current === requestId) {
                setState(prev => ({
                  ...prev,
                  trafficRoute: null,
                  trafficLoading: false,
                  trafficError: error instanceof Error ? error.message : 'Unknown error occurred',
                  trafficCalculationTime: null,
                }));
              }
            }
          })()
        ];

        // Execute both requests concurrently
        await Promise.allSettled(promises);
      } else {
        // Single request: regular route only
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
              // Clear any previous traffic data
              trafficRoute: null,
              trafficError: null,
              trafficCalculationTime: null,
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
              // Clear any previous traffic data
              trafficRoute: null,
              trafficError: null,
              trafficCalculationTime: null,
            }));
          }
        }
      }
    };

    if (debounceMs === 0) {
      // Execute immediately for tests
      executeRouteCalculation();
    } else {
      // Set up debounced execution
      debounceTimeoutRef.current = setTimeout(executeRouteCalculation, debounceMs);
    }
  }, []);

  const calculateRouteMulti = useCallback((
    routePoints: RoutePoint[],
    options?: CreateRouteOptions,
    debounceMs: number = 300,
    compareTraffic?: boolean
  ) => {
    // Clear route if insufficient points
    if (!isRouteCalculable(routePoints)) {
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
        trafficRoute: null,
        trafficError: null,
        trafficLoading: false,
        trafficCalculationTime: null,
      }));
      return;
    }

    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Execute immediately if no debounce, otherwise set up debounced execution
    const executeRouteCalculation = async () => {
      // Generate unique request ID
      const requestId = Date.now();
      currentRequestRef.current = requestId;

      // Get coordinates in order
      const coordinates = getCoordinatesInOrder(routePoints);

      // Set loading states and clear previous errors
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        trafficLoading: compareTraffic || false,
        trafficError: null,
      }));

      // Execute requests
      if (compareTraffic) {
        // Dual requests: regular + traffic
        const promises = [
          // Regular route request
          (async () => {
            try {
              const startTime = performance.now();
              const routeData = await apiCalculateRouteMulti(coordinates, options);
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
          })(),
          
          // Traffic route request
          (async () => {
            try {
              const trafficConfig = createTrafficRouteConfig(options);
              const startTime = performance.now();
              const trafficData = await apiCalculateRouteMulti(coordinates, trafficConfig);
              const endTime = performance.now();
              const trafficCalculationTime = Math.round(endTime - startTime);
              
              // Only update state if this is still the current request
              if (currentRequestRef.current === requestId) {
                setState(prev => ({
                  ...prev,
                  trafficRoute: trafficData,
                  trafficLoading: false,
                  trafficError: null,
                  trafficCalculationTime,
                }));
              }
            } catch (error) {
              // Only update state if this is still the current request
              if (currentRequestRef.current === requestId) {
                setState(prev => ({
                  ...prev,
                  trafficRoute: null,
                  trafficLoading: false,
                  trafficError: error instanceof Error ? error.message : 'Unknown error occurred',
                  trafficCalculationTime: null,
                }));
              }
            }
          })()
        ];

        // Execute both requests concurrently
        await Promise.allSettled(promises);
      } else {
        // Single request: regular route only
        try {
          const startTime = performance.now();
          const routeData = await apiCalculateRouteMulti(coordinates, options);
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
              // Clear any previous traffic data
              trafficRoute: null,
              trafficError: null,
              trafficCalculationTime: null,
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
              // Clear any previous traffic data
              trafficRoute: null,
              trafficError: null,
              trafficCalculationTime: null,
            }));
          }
        }
      }
    };

    if (debounceMs === 0) {
      // Execute immediately for tests
      executeRouteCalculation();
    } else {
      // Set up debounced execution
      debounceTimeoutRef.current = setTimeout(executeRouteCalculation, debounceMs);
    }
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
      trafficRoute: null,
      trafficLoading: false,
      trafficError: null,
      trafficCalculationTime: null,
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
    trafficRoute: state.trafficRoute,
    trafficLoading: state.trafficLoading,
    trafficError: state.trafficError,
    trafficCalculationTime: state.trafficCalculationTime,
    calculateRoute,
    calculateRouteMulti,
    clearRoute,
  };
}