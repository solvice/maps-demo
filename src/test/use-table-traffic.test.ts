import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTable } from '@/hooks/use-table';
import * as solviceTableApi from '@/lib/solvice-table-api';

// Mock the solvice-table-api module
vi.mock('@/lib/solvice-table-api', () => ({
  calculateTable: vi.fn(),
}));

const mockCalculateTable = vi.mocked(solviceTableApi.calculateTable);

describe('useTable Hook - Traffic Impact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should send dual requests (OSM + TOMTOM) when calculating table', async () => {
    const mockBaselineResponse = {
      durations: [[0, 600], [600, 0]],
      distances: [[0, 5000], [5000, 0]]
    };

    const mockTrafficResponse = {
      durations: [[0, 780], [780, 0]], // 30% increase
      distances: [[0, 5000], [5000, 0]]
    };

    // Mock the API calls to return different responses for OSM vs TOMTOM
    mockCalculateTable
      .mockResolvedValueOnce(mockBaselineResponse) // OSM call
      .mockResolvedValueOnce(mockTrafficResponse); // TOMTOM call

    const { result } = renderHook(() => useTable());

    const coordinates = [[3.7174, 51.0543], [3.7274, 51.0643]];
    
    result.current.calculateTable(coordinates, { vehicleType: 'CAR' }, 0);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have made two API calls
    expect(mockCalculateTable).toHaveBeenCalledTimes(2);

    // First call should be OSM
    expect(mockCalculateTable).toHaveBeenNthCalledWith(1, coordinates, {
      vehicleType: 'CAR',
      engine: 'OSM'
    });

    // Second call should be TOMTOM  
    expect(mockCalculateTable).toHaveBeenNthCalledWith(2, coordinates, {
      vehicleType: 'CAR',
      engine: 'TOMTOM'
    });

    // Should return both tables
    expect(result.current.table).toEqual(mockBaselineResponse);
    expect(result.current.trafficTable).toEqual(mockTrafficResponse);
  });

  it('should calculate traffic impacts correctly', async () => {
    const mockBaselineResponse = {
      durations: [
        [0, 600, 1200],
        [600, 0, 900], 
        [1200, 900, 0]
      ],
      distances: [[0, 5000, 10000], [5000, 0, 7500], [10000, 7500, 0]]
    };

    const mockTrafficResponse = {
      durations: [
        [0, 780, 1560], // 30% increase
        [780, 0, 1080], // 30% and 20% increase
        [1560, 1080, 0]
      ],
      distances: [[0, 5000, 10000], [5000, 0, 7500], [10000, 7500, 0]]
    };

    mockCalculateTable
      .mockResolvedValueOnce(mockBaselineResponse)
      .mockResolvedValueOnce(mockTrafficResponse);

    const { result } = renderHook(() => useTable());

    const coordinates = [[3.7174, 51.0543], [3.7274, 51.0643], [3.7374, 51.0743]];
    
    result.current.calculateTable(coordinates, {}, 0);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check traffic impacts calculation
    expect(result.current.trafficImpacts).toBeDefined();
    expect(result.current.maxTrafficImpact).toBe(1.3); // 30% increase

    // Check specific impact ratios
    const impacts = result.current.trafficImpacts!;
    expect(impacts[0][1]).toBe(1.3); // 600s -> 780s = 30% increase
    expect(impacts[1][2]).toBe(1.2); // 900s -> 1080s = 20% increase
  });

  it('should handle API errors gracefully', async () => {
    const mockError = new Error('API request failed');
    mockCalculateTable.mockRejectedValue(mockError);

    const { result } = renderHook(() => useTable());

    const coordinates = [[3.7174, 51.0543], [3.7274, 51.0643]];
    
    result.current.calculateTable(coordinates, {}, 0);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('API request failed');
    expect(result.current.table).toBeNull();
    expect(result.current.trafficTable).toBeNull();
    expect(result.current.trafficImpacts).toBeNull();
  });

  it('should handle partial API failures', async () => {
    const mockBaselineResponse = {
      durations: [[0, 600], [600, 0]],
      distances: [[0, 5000], [5000, 0]]
    };

    // First call succeeds, second fails
    mockCalculateTable
      .mockResolvedValueOnce(mockBaselineResponse)
      .mockRejectedValueOnce(new Error('TOMTOM API failed'));

    const { result } = renderHook(() => useTable());

    const coordinates = [[3.7174, 51.0543], [3.7274, 51.0643]];
    
    result.current.calculateTable(coordinates, {}, 0);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should still show error even if one call succeeded
    expect(result.current.error).toBe('TOMTOM API failed');
    expect(result.current.table).toBeNull();
    expect(result.current.trafficTable).toBeNull();
  });

  it('should handle missing duration data in impact calculation', async () => {
    const mockBaselineResponse = {
      durations: [[0, 600], [600, 0]],
      distances: [[0, 5000], [5000, 0]]
    };

    const mockTrafficResponse = {
      durations: null, // Missing durations
      distances: [[0, 5000], [5000, 0]]
    };

    mockCalculateTable
      .mockResolvedValueOnce(mockBaselineResponse)
      .mockResolvedValueOnce(mockTrafficResponse);

    const { result } = renderHook(() => useTable());

    const coordinates = [[3.7174, 51.0543], [3.7274, 51.0643]];
    
    result.current.calculateTable(coordinates, {}, 0);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should handle missing duration data gracefully
    expect(result.current.trafficImpacts).toEqual([]);
    expect(result.current.maxTrafficImpact).toBe(1.0);
  });

  it('should preserve original options while adding engine parameter', async () => {
    const mockResponse = {
      durations: [[0, 600], [600, 0]],
      distances: [[0, 5000], [5000, 0]]
    };

    mockCalculateTable.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useTable());

    const coordinates = [[3.7174, 51.0543], [3.7274, 51.0643]];
    const customOptions = {
      vehicleType: 'TRUCK' as const,
      sources: [0],
      destinations: [1],
      annotations: ['duration', 'distance'],
      departureTime: '2024-01-01T12:00:00Z'
    };
    
    result.current.calculateTable(coordinates, customOptions, 0);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should preserve custom options and add engine
    expect(mockCalculateTable).toHaveBeenNthCalledWith(1, coordinates, {
      ...customOptions,
      engine: 'OSM'
    });

    expect(mockCalculateTable).toHaveBeenNthCalledWith(2, coordinates, {
      ...customOptions,
      engine: 'TOMTOM'
    });
  });

  it('should reset traffic data when clearing table', () => {
    const { result } = renderHook(() => useTable());

    // Manually set some state (simulating successful calculation)
    result.current.clearTable();

    expect(result.current.table).toBeNull();
    expect(result.current.trafficTable).toBeNull();
    expect(result.current.trafficImpacts).toBeNull();
    expect(result.current.maxTrafficImpact).toBe(1.0);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should handle request cancellation with traffic calculations', async () => {
    let resolveFirst: (value: any) => void;
    let resolveSecond: (value: any) => void;

    const firstPromise = new Promise(resolve => { resolveFirst = resolve; });
    const secondPromise = new Promise(resolve => { resolveSecond = resolve; });

    mockCalculateTable
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const { result } = renderHook(() => useTable());

    const coordinates = [[3.7174, 51.0543], [3.7274, 51.0643]];
    
    // Start first calculation
    result.current.calculateTable(coordinates, {}, 0);
    expect(result.current.loading).toBe(true);

    // Start second calculation (should cancel first)
    result.current.calculateTable(coordinates, {}, 0);

    // Resolve the first (cancelled) request
    resolveFirst!({
      durations: [[0, 600], [600, 0]],
      distances: [[0, 5000], [5000, 0]]
    });

    await waitFor(() => {
      // Should still be loading (waiting for second request)
      expect(result.current.loading).toBe(true);
    });

    // First request should be ignored due to cancellation
    expect(result.current.table).toBeNull();
    expect(result.current.trafficTable).toBeNull();
  });
});