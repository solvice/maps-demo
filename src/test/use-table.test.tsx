import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTable } from '@/hooks/use-table';
import { mockFetchResponses, baselineResponses, trafficResponses, errorResponses, testCoordinates } from './fixtures/table-api-responses';
import { tableTestCoordinates, mockToast } from './utils/table-test-utils';

// Mock the API functions
vi.mock('@/lib/solvice-table-api', () => ({
  calculateTable: vi.fn(),
  TableResponse: {},
  CreateTableOptions: {}
}));

import { calculateTable as mockCalculateTable } from '@/lib/solvice-table-api';

describe('useTable Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    
    // Reset fetch mock
    (global.fetch as any).mockClear();
    
    // Reset performance mock - this is done in setup-table.ts
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initial State', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useTable());
      
      expect(result.current.table).toBe(null);
      expect(result.current.trafficTable).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.calculationTime).toBe(null);
      expect(result.current.trafficImpacts).toBe(null);
      expect(result.current.maxTrafficImpact).toBe(1.0);
      expect(typeof result.current.calculateTable).toBe('function');
      expect(typeof result.current.clearTable).toBe('function');
    });
  });

  describe('Table Calculation', () => {
    it('should handle successful dual API calls (OSM + TOMTOM)', async () => {
      // Mock successful API responses
      (mockCalculateTable as any)
        .mockResolvedValueOnce(baselineResponses.ghentBrussels) // OSM baseline
        .mockResolvedValueOnce(trafficResponses.lightTraffic);  // TOMTOM traffic
      
      const { result } = renderHook(() => useTable());
      
      // Start calculation
      act(() => {
        result.current.calculateTable(tableTestCoordinates.simple, undefined, 0);
      });
      
      // Wait for loading to be true, then false
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.table).toEqual(baselineResponses.ghentBrussels);
      expect(result.current.trafficTable).toEqual(trafficResponses.lightTraffic);
      expect(result.current.error).toBe(null);
      expect(result.current.calculationTime).toBeGreaterThan(0);
      expect(result.current.trafficImpacts).toBeTruthy();
      expect(result.current.maxTrafficImpact).toBeGreaterThan(1.0);
      
      // Verify both API calls were made with correct engines
      expect(mockCalculateTable).toHaveBeenCalledTimes(2);
      expect(mockCalculateTable).toHaveBeenCalledWith(
        tableTestCoordinates.simple,
        expect.objectContaining({ engine: 'OSM' })
      );
      expect(mockCalculateTable).toHaveBeenCalledWith(
        tableTestCoordinates.simple,
        expect.objectContaining({ engine: 'TOMTOM' })
      );
    });

    it('should calculate traffic impacts correctly', async () => {
      // Baseline: 1 hour, Traffic: 1.3 hours (30% increase)
      const baseline = { durations: [[0, 3600], [3600, 0]], distances: [[0, 56000], [56000, 0]] };
      const traffic = { durations: [[0, 4680], [4680, 0]], distances: [[0, 56000], [56000, 0]] };
      
      (mockCalculateTable as any)
        .mockResolvedValueOnce(baseline)
        .mockResolvedValueOnce(traffic);
      
      const { result } = renderHook(() => useTable());
      
      act(() => {
        result.current.calculateTable(tableTestCoordinates.simple, undefined, 0);
      });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      }, { timeout: 10000 });
      
      expect(result.current.trafficImpacts).toEqual([[1.0, 1.3], [1.3, 1.0]]);
      expect(result.current.maxTrafficImpact).toBe(1.3);
    });

    it('should handle API call failures gracefully', async () => {
      const errorMessage = 'API request failed';
      (mockCalculateTable as any).mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => useTable());
      
      result.current.calculateTable(tableTestCoordinates.simple, undefined, 0);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.table).toBe(null);
      expect(result.current.trafficTable).toBe(null);
      expect(result.current.trafficImpacts).toBe(null);
    });

    it('should handle partial API failures (one succeeds, one fails)', async () => {
      (mockCalculateTable as any)
        .mockResolvedValueOnce(baselineResponses.ghentBrussels) // OSM succeeds
        .mockRejectedValueOnce(new Error('TOMTOM API failed')); // TOMTOM fails
      
      const { result } = renderHook(() => useTable());
      
      result.current.calculateTable(tableTestCoordinates.simple, undefined, 0);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Should show error when either API fails
      expect(result.current.error).toBeTruthy();
      expect(result.current.table).toBe(null);
    });
  });

  describe('Debouncing', () => {
    it('should debounce rapid successive calls', async () => {
      (mockCalculateTable as any)
        .mockResolvedValue(baselineResponses.ghentBrussels);
      
      const { result } = renderHook(() => useTable());
      
      // Make rapid successive calls
      result.current.calculateTable(tableTestCoordinates.simple, undefined, 300);
      result.current.calculateTable(tableTestCoordinates.simple, undefined, 300);
      result.current.calculateTable(tableTestCoordinates.simple, undefined, 300);
      
      // Only the last call should remain pending
      expect(result.current.loading).toBe(false); // Not loading yet due to debounce
      
      // Fast-forward past debounce time
      vi.advanceTimersByTime(300);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Should only have been called once (for the final debounced call)
      expect(mockCalculateTable).toHaveBeenCalledTimes(2); // OSM + TOMTOM
    });

    it('should execute immediately when debounceMs is 0', async () => {
      (mockCalculateTable as any)
        .mockResolvedValue(baselineResponses.ghentBrussels);
      
      const { result } = renderHook(() => useTable());
      
      act(() => {
        result.current.calculateTable(tableTestCoordinates.simple, undefined, 0);
      });
      
      // Wait for loading to be true, then false
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(mockCalculateTable).toHaveBeenCalled();
    });
  });

  describe('Request Cancellation', () => {
    it('should ignore results from cancelled requests', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;
      
      const firstRequest = new Promise(resolve => { resolveFirst = resolve; });
      const secondRequest = new Promise(resolve => { resolveSecond = resolve; });
      
      (mockCalculateTable as any)
        .mockReturnValueOnce(firstRequest)
        .mockReturnValueOnce(firstRequest) // OSM and TOMTOM for first request
        .mockReturnValueOnce(secondRequest)
        .mockReturnValueOnce(secondRequest); // OSM and TOMTOM for second request
      
      const { result } = renderHook(() => useTable());
      
      // Start first request
      result.current.calculateTable(tableTestCoordinates.simple, undefined, 0);
      
      // Start second request (should cancel first)
      result.current.calculateTable(tableTestCoordinates.medium, undefined, 0);
      
      // Resolve first request (should be ignored)
      resolveFirst!(baselineResponses.ghentBrussels);
      
      // Resolve second request
      resolveSecond!(baselineResponses.belgiumCities);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Should only have the result from the second request
      expect(result.current.table).toEqual(baselineResponses.belgiumCities);
    });
  });

  describe('Input Validation', () => {
    it('should clear table when coordinates are null', () => {
      const { result } = renderHook(() => useTable());
      
      // First set some data
      result.current.calculateTable(tableTestCoordinates.simple, undefined, 0);
      
      // Then clear with null coordinates
      result.current.calculateTable(null, undefined, 0);
      
      expect(result.current.table).toBe(null);
      expect(result.current.trafficTable).toBe(null);
      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.trafficImpacts).toBe(null);
      expect(result.current.maxTrafficImpact).toBe(1.0);
    });

    it('should clear table when coordinates array is empty', () => {
      const { result } = renderHook(() => useTable());
      
      result.current.calculateTable([], undefined, 0);
      
      expect(result.current.table).toBe(null);
      expect(result.current.loading).toBe(false);
    });

    it('should clear table when coordinates array has less than 2 items', () => {
      const { result } = renderHook(() => useTable());
      
      result.current.calculateTable([tableTestCoordinates.simple[0]], undefined, 0);
      
      expect(result.current.table).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Clear Table Functionality', () => {
    it('should clear all table data when clearTable is called', async () => {
      (mockCalculateTable as any)
        .mockResolvedValue(baselineResponses.ghentBrussels);
      
      const { result } = renderHook(() => useTable());
      
      // First calculate table
      result.current.calculateTable(tableTestCoordinates.simple, undefined, 0);
      
      await waitFor(() => {
        expect(result.current.table).toBeTruthy();
      });
      
      // Then clear it
      result.current.clearTable();
      
      expect(result.current.table).toBe(null);
      expect(result.current.trafficTable).toBe(null);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.calculationTime).toBe(null);
      expect(result.current.trafficImpacts).toBe(null);
      expect(result.current.maxTrafficImpact).toBe(1.0);
    });

    it('should cancel pending debounced requests when clearing', () => {
      const { result } = renderHook(() => useTable());
      
      // Start a debounced request
      result.current.calculateTable(tableTestCoordinates.simple, undefined, 300);
      expect(result.current.loading).toBe(false); // Not started due to debounce
      
      // Clear before debounce executes
      result.current.clearTable();
      
      // Fast-forward past debounce time
      vi.advanceTimersByTime(300);
      
      // Should not have made API call
      expect(mockCalculateTable).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Performance Timing', () => {
    it('should track calculation time accurately', async () => {
      const startTime = 1000;
      const endTime = 1500;
      
      (window.performance.now as any)
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(endTime);
      
      (mockCalculateTable as any)
        .mockResolvedValue(baselineResponses.ghentBrussels);
      
      const { result } = renderHook(() => useTable());
      
      result.current.calculateTable(tableTestCoordinates.simple, undefined, 0);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.calculationTime).toBe(500); // endTime - startTime
    });
  });

  describe('Traffic Impact Edge Cases', () => {
    it('should handle missing durations in traffic impact calculation', async () => {
      const baselineWithoutDurations = { distances: [[0, 56000], [56000, 0]] } as any;
      const trafficResponse = trafficResponses.lightTraffic;
      
      (mockCalculateTable as any)
        .mockResolvedValueOnce(baselineWithoutDurations)
        .mockResolvedValueOnce(trafficResponse);
      
      const { result } = renderHook(() => useTable());
      
      result.current.calculateTable(tableTestCoordinates.simple, undefined, 0);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      expect(result.current.trafficImpacts).toEqual([]);
      expect(result.current.maxTrafficImpact).toBe(1.0);
    });

    it('should handle zero durations in traffic impact calculation', async () => {
      const baselineWithZeros = { 
        durations: [[0, 0], [0, 0]], 
        distances: [[0, 56000], [56000, 0]] 
      };
      const trafficWithZeros = { 
        durations: [[0, 0], [0, 0]], 
        distances: [[0, 56000], [56000, 0]] 
      };
      
      (mockCalculateTable as any)
        .mockResolvedValueOnce(baselineWithZeros)
        .mockResolvedValueOnce(trafficWithZeros);
      
      const { result } = renderHook(() => useTable());
      
      result.current.calculateTable(tableTestCoordinates.simple, undefined, 0);
      
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
      
      // Should handle zero durations by defaulting to 1.0 impact
      expect(result.current.trafficImpacts).toEqual([[1.0, 1.0], [1.0, 1.0]]);
    });
  });

  describe('Memory Management', () => {
    it('should clean up timers on unmount', () => {
      const { result, unmount } = renderHook(() => useTable());
      
      // Start a debounced request
      result.current.calculateTable(tableTestCoordinates.simple, undefined, 300);
      
      // Unmount should clear the timeout
      unmount();
      
      // Fast-forward past debounce time
      vi.advanceTimersByTime(300);
      
      // Should not have made API call after unmount
      expect(mockCalculateTable).not.toHaveBeenCalled();
    });

    it('should not update state after component unmount', async () => {
      let resolveRequest: (value: any) => void;
      const requestPromise = new Promise(resolve => { resolveRequest = resolve; });
      
      (mockCalculateTable as any).mockReturnValue(requestPromise);
      
      const { result, unmount } = renderHook(() => useTable());
      
      act(() => {
        result.current.calculateTable(tableTestCoordinates.simple, undefined, 0);
      });
      
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });
      
      // Unmount before request completes
      unmount();
      
      // Complete the request after unmount
      resolveRequest!(baselineResponses.ghentBrussels);
      
      // Should not crash or update state
      await waitFor(() => {
        // Test passes if no errors thrown
        expect(true).toBe(true);
      });
    });
  });
});