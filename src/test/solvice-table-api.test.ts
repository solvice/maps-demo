import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateTable, TableResponse, CreateTableOptions } from '@/lib/solvice-table-api';
import { testCoordinates, baselineResponses, errorResponses, mockFetchResponses } from './fixtures/table-api-responses';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Solvice Table API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculateTable Function', () => {
    const validCoordinates = testCoordinates.ghentBrussels;
    const defaultOptions: CreateTableOptions = {
      engine: 'OSM',
      vehicleType: 'CAR'
    };

    it('should make successful API call and return table response', async () => {
      const expectedResponse = baselineResponses.ghentBrussels;
      mockFetch.mockResolvedValueOnce(mockFetchResponses.success(expectedResponse));

      const result = await calculateTable(validCoordinates, defaultOptions);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/table'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('"engine":"OSM"')
        })
      );
      
      expect(result).toEqual(expectedResponse);
    });

    it('should include all coordinate data in request body', async () => {
      mockFetch.mockResolvedValueOnce(mockFetchResponses.success(baselineResponses.ghentBrussels));

      await calculateTable(validCoordinates, defaultOptions);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.coordinates).toEqual(validCoordinates);
      expect(requestBody.engine).toBe('OSM');
      expect(requestBody.vehicleType).toBe('CAR');
    });

    it('should handle TOMTOM engine requests', async () => {
      const trafficOptions: CreateTableOptions = {
        engine: 'TOMTOM',
        vehicleType: 'CAR',
        departureTime: '2024-01-01T12:00:00Z'
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponses.success(baselineResponses.ghentBrussels));

      await calculateTable(validCoordinates, trafficOptions);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.engine).toBe('TOMTOM');
      expect(requestBody.departureTime).toBe('2024-01-01T12:00:00Z');
    });

    it('should handle different vehicle types', async () => {
      const truckOptions: CreateTableOptions = {
        engine: 'OSM',
        vehicleType: 'TRUCK'
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponses.success(baselineResponses.ghentBrussels));

      await calculateTable(validCoordinates, truckOptions);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.vehicleType).toBe('TRUCK');
    });

    it('should include sources and destinations when provided', async () => {
      const optionsWithSources: CreateTableOptions = {
        engine: 'OSM',
        vehicleType: 'CAR',
        sources: [0, 1],
        destinations: [0, 1]
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponses.success(baselineResponses.ghentBrussels));

      await calculateTable(validCoordinates, optionsWithSources);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.sources).toEqual([0, 1]);
      expect(requestBody.destinations).toEqual([0, 1]);
    });

    it('should include annotations when provided', async () => {
      const optionsWithAnnotations: CreateTableOptions = {
        engine: 'OSM',
        vehicleType: 'CAR',
        annotations: ['duration', 'distance']
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponses.success(baselineResponses.ghentBrussels));

      await calculateTable(validCoordinates, optionsWithAnnotations);

      const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(requestBody.annotations).toEqual(['duration', 'distance']);
    });
  });

  describe('Error Handling', () => {
    const validCoordinates = testCoordinates.ghentBrussels;
    const defaultOptions: CreateTableOptions = {
      engine: 'OSM',
      vehicleType: 'CAR'
    };

    it('should handle 400 Bad Request errors', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponses.error(errorResponses.badRequest, 400)
      );

      await expect(calculateTable(validCoordinates, defaultOptions))
        .rejects.toThrow('Table calculation failed: Bad Request');
    });

    it('should handle 401 Unauthorized errors', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponses.error(errorResponses.unauthorized, 401)
      );

      await expect(calculateTable(validCoordinates, defaultOptions))
        .rejects.toThrow('Table calculation failed: Unauthorized');
    });

    it('should handle 429 Rate Limited errors', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponses.error(errorResponses.rateLimited, 429)
      );

      await expect(calculateTable(validCoordinates, defaultOptions))
        .rejects.toThrow('Rate limit exceeded');
    });

    it('should handle 500 Server errors', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponses.error(errorResponses.serverError, 500)
      );

      await expect(calculateTable(validCoordinates, defaultOptions))
        .rejects.toThrow('Table calculation failed: Internal Server Error');
    });

    it('should handle 503 Service Unavailable errors', async () => {
      mockFetch.mockResolvedValueOnce(
        mockFetchResponses.error(errorResponses.serviceUnavailable, 503)
      );

      await expect(calculateTable(validCoordinates, defaultOptions))
        .rejects.toThrow('Table calculation failed: Service Unavailable');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(errorResponses.networkError);

      await expect(calculateTable(validCoordinates, defaultOptions))
        .rejects.toThrow('Table calculation failed: Network request failed');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(() => mockFetchResponses.timeout());

      await expect(calculateTable(validCoordinates, defaultOptions))
        .rejects.toThrow('Request timeout');
    });

    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
        text: () => Promise.resolve('malformed json response')
      });

      await expect(calculateTable(validCoordinates, defaultOptions))
        .rejects.toThrow('Failed to parse table response - invalid JSON');
    });

    it('should handle empty responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(null),
        text: () => Promise.resolve('')
      });

      await expect(calculateTable(validCoordinates, defaultOptions))
        .rejects.toThrow();
    });
  });

  describe('Input Validation', () => {
    const defaultOptions: CreateTableOptions = {
      engine: 'OSM',
      vehicleType: 'CAR'
    };

    it('should reject empty coordinates array', async () => {
      await expect(calculateTable([], defaultOptions))
        .rejects.toThrow('At least 2 coordinates are required');
    });

    it('should reject single coordinate (minimum 2 required)', async () => {
      await expect(calculateTable([testCoordinates.ghentBrussels[0]], defaultOptions))
        .rejects.toThrow('At least 2 coordinates are required');
    });

    it('should reject invalid coordinate format', async () => {
      const invalidCoords = [[181, 91], [3.7174, 51.0543]] as any;
      
      await expect(calculateTable(invalidCoords, defaultOptions))
        .rejects.toThrow('Invalid coordinates at index 0');
    });

    it('should reject malformed coordinates', async () => {
      const malformedCoords = [
        [null, undefined],
        [3.7174, 51.0543]
      ] as any;
      
      await expect(calculateTable(malformedCoords, defaultOptions))
        .rejects.toThrow('Invalid coordinates at index 0');
    });

    it('should reject coordinates with wrong length', async () => {
      const wrongLengthCoords = [
        [3.7174, 51.0543, 100], // 3 elements instead of 2
        [4.3517, 50.8476]
      ] as any;
      
      await expect(calculateTable(wrongLengthCoords, defaultOptions))
        .rejects.toThrow('Invalid coordinates at index 0');
    });

    it('should handle invalid engine values', async () => {
      const invalidOptions = {
        engine: 'INVALID_ENGINE',
        vehicleType: 'CAR'
      } as any;
      
      // Should make API call and let server handle validation
      mockFetch.mockResolvedValueOnce(
        mockFetchResponses.error({error: 'Invalid engine'}, 400)
      );
      
      await expect(calculateTable(testCoordinates.ghentBrussels, invalidOptions))
        .rejects.toThrow('Table calculation failed: Invalid engine');
    });

    it('should handle invalid vehicle types', async () => {
      const invalidOptions = {
        engine: 'OSM',
        vehicleType: 'INVALID_VEHICLE'
      } as any;
      
      // Should make API call and let server handle validation
      mockFetch.mockResolvedValueOnce(
        mockFetchResponses.error({error: 'Invalid vehicle type'}, 400)
      );
      
      await expect(calculateTable(testCoordinates.ghentBrussels, invalidOptions))
        .rejects.toThrow('Table calculation failed: Invalid vehicle type');
    });
  });

  describe('Response Validation', () => {
    const validCoordinates = testCoordinates.ghentBrussels;
    const defaultOptions: CreateTableOptions = {
      engine: 'OSM',
      vehicleType: 'CAR'
    };

    it('should accept response with only durations matrix', async () => {
      const responseWithOnlyDurations = { 
        tableId: 1,
        durations: [[0, 3600], [3600, 0]] 
      };
      mockFetch.mockResolvedValueOnce(mockFetchResponses.success(responseWithOnlyDurations));

      const result = await calculateTable(validCoordinates, defaultOptions);
      
      expect(result.durations).toEqual([[0, 3600], [3600, 0]]);
      expect(result.tableId).toBe(1);
    });

    it('should accept response with only distances matrix', async () => {
      const responseWithOnlyDistances = { 
        tableId: 1,
        distances: [[0, 56000], [56000, 0]] 
      };
      mockFetch.mockResolvedValueOnce(mockFetchResponses.success(responseWithOnlyDistances));

      const result = await calculateTable(validCoordinates, defaultOptions);
      
      expect(result.distances).toEqual([[0, 56000], [56000, 0]]);
      expect(result.tableId).toBe(1);
    });

    it('should reject response with neither durations nor distances', async () => {
      const emptyResponse = { tableId: 1 };
      mockFetch.mockResolvedValueOnce(mockFetchResponses.success(emptyResponse));

      await expect(calculateTable(validCoordinates, defaultOptions))
        .rejects.toThrow('No table data found in response');
    });

    it('should reject null or invalid response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(null),
        text: () => Promise.resolve('')
      });

      await expect(calculateTable(validCoordinates, defaultOptions))
        .rejects.toThrow('Invalid table response format');
    });
  });

  describe('Performance', () => {
    const defaultOptions: CreateTableOptions = {
      engine: 'OSM',
      vehicleType: 'CAR'
    };

    it('should handle large coordinate sets efficiently', async () => {
      // Create 50x50 matrix (2500 entries)
      const largeCoordinateSet = Array.from({ length: 50 }, (_, i) => 
        [3.5 + (i * 0.01), 50.8 + (i * 0.01)]
      );
      const largeResponse = {
        durations: Array(50).fill(null).map(() => Array(50).fill(3600).map((_, j, arr) => j === arr.indexOf(3600) ? 0 : 3600)),
        distances: Array(50).fill(null).map(() => Array(50).fill(56000).map((_, j, arr) => j === arr.indexOf(56000) ? 0 : 56000))
      };

      mockFetch.mockResolvedValueOnce(mockFetchResponses.success(largeResponse));

      const startTime = performance.now();
      const result = await calculateTable(largeCoordinateSet, defaultOptions);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(result.durations.length).toBe(50);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1 second
    });

    it('should handle matrix size limits', async () => {
      // Create coordinates array that exceeds 50x50 limit
      const tooManyCoordinates = Array.from({ length: 51 }, (_, i) => 
        [3.5 + (i * 0.01), 50.8 + (i * 0.01)]
      );

      await expect(calculateTable(tooManyCoordinates, defaultOptions))
        .rejects.toThrow('Matrix size exceeds 50x50 limit');
    });
  });
});