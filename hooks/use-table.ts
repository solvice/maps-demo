import { useState, useCallback, useRef, useEffect } from 'react';
import { calculateTable as apiCalculateTable, TableResponse, CreateTableOptions } from '@/lib/solvice-table-api';
import { Coordinates } from '@/lib/coordinates';

// Calculate traffic impact percentages between baseline and traffic-aware matrices
function calculateTrafficImpacts(baselineTable: TableResponse, trafficTable: TableResponse): {
  trafficImpacts: number[][];
  maxTrafficImpact: number;
} {
  if (!baselineTable.durations || !trafficTable.durations) {
    console.log('⚠️ Missing durations in one or both tables');
    return { trafficImpacts: [], maxTrafficImpact: 1.0 };
  }

  console.log('🧮 Calculating traffic impacts for', baselineTable.durations.length, 'x', baselineTable.durations[0]?.length || 0, 'matrix');

  const impacts: number[][] = [];
  let maxImpact = 1.0;
  let significantImpacts = 0;

  for (let i = 0; i < baselineTable.durations.length; i++) {
    impacts[i] = [];
    for (let j = 0; j < baselineTable.durations[i].length; j++) {
      const baselineDuration = baselineTable.durations[i][j];
      const trafficDuration = trafficTable.durations[i][j];
      
      if (baselineDuration > 0 && trafficDuration > 0) {
        const impact = trafficDuration / baselineDuration;
        impacts[i][j] = impact;
        maxImpact = Math.max(maxImpact, impact);
        
        if (impact > 1.1) { // More than 10% increase
          significantImpacts++;
        }
      } else {
        impacts[i][j] = 1.0; // No impact if no valid duration data
      }
    }
  }

  console.log('🎯 Traffic impact:', `${significantImpacts} routes with >10% delay, max ${(maxImpact * 100).toFixed(1)}%`);

  return { trafficImpacts: impacts, maxTrafficImpact: maxImpact };
}

interface UseTableState {
  table: TableResponse | null;
  trafficTable: TableResponse | null;
  loading: boolean;
  error: string | null;
  calculationTime: number | null;
  trafficImpacts: number[][] | null;
  maxTrafficImpact: number;
}

export function useTable() {
  
  const [state, setState] = useState<UseTableState>({
    table: null,
    trafficTable: null,
    loading: false,
    error: null,
    calculationTime: null,
    trafficImpacts: null,
    maxTrafficImpact: 1.0,
  });

  // Ref to track the current request timestamp for cancellation
  const currentRequestRef = useRef<number>(0);
  // Ref for debounce timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculateTable = useCallback((
    coordinates: Coordinates[] | null,
    options?: CreateTableOptions,
    debounceMs: number = 300
  ) => {
    // Clear table if coordinates are missing or invalid
    if (!coordinates || coordinates.length < 2) {
      // Clear any pending debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
      
      setState(prev => ({
        ...prev,
        table: null,
        trafficTable: null,
        error: null,
        loading: false,
        calculationTime: null,
        trafficImpacts: null,
        maxTrafficImpact: 1.0,
      }));
      return;
    }

    // Clear any existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Execute immediately if no debounce, otherwise set up debounced execution
    const executeTableCalculation = async () => {
      // Generate unique request ID
      const requestId = Date.now();
      currentRequestRef.current = requestId;

      // Set loading state and clear previous errors
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const startTime = performance.now();
        
        // Prepare requests for both baseline and traffic-aware routing
        const baselineOptions = { ...options, engine: 'OSM' as const };
        const trafficOptions = { 
          ...options, 
          engine: 'TOMTOM' as const,
          departureTime: new Date().toISOString() // Current time for traffic-aware routing
        };
        
        // Send both OSM (baseline) and TOMTOM (traffic) requests simultaneously
        const [baselineTable, trafficTable] = await Promise.all([
          apiCalculateTable(coordinates, baselineOptions),
          apiCalculateTable(coordinates, trafficOptions)
        ]);
        
        const endTime = performance.now();
        const calculationTime = Math.round(endTime - startTime);
        
        // Calculate traffic impact percentages
        const { trafficImpacts, maxTrafficImpact } = calculateTrafficImpacts(baselineTable, trafficTable);
        
        // Only update state if this is still the current request
        if (currentRequestRef.current === requestId) {
          setState(prev => ({
            ...prev,
            table: baselineTable,
            trafficTable,
            loading: false,
            error: null,
            calculationTime,
            trafficImpacts,
            maxTrafficImpact,
          }));
        }
      } catch (error) {
        // Only update state if this is still the current request
        if (currentRequestRef.current === requestId) {
          setState(prev => ({
            ...prev,
            table: null,
            trafficTable: null,
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            calculationTime: null,
            trafficImpacts: null,
            maxTrafficImpact: 1.0,
          }));
        }
      }
    };

    if (debounceMs === 0) {
      // Execute immediately for tests
      executeTableCalculation();
    } else {
      // Set up debounced execution
      debounceTimeoutRef.current = setTimeout(executeTableCalculation, debounceMs);
    }
  }, []);

  const clearTable = useCallback(() => {
    // Clear any pending debounce
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    
    setState({
      table: null,
      trafficTable: null,
      loading: false,
      error: null,
      calculationTime: null,
      trafficImpacts: null,
      maxTrafficImpact: 1.0,
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
    table: state.table,
    trafficTable: state.trafficTable,
    loading: state.loading,
    error: state.error,
    calculationTime: state.calculationTime,
    trafficImpacts: state.trafficImpacts,
    maxTrafficImpact: state.maxTrafficImpact,
    calculateTable,
    clearTable,
  };
}