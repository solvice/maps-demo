import { vi } from 'vitest';
import { TableResponse } from '@/lib/solvice-table-api';
import type { Coordinates } from '@/lib/coordinates';

// Enhanced MapLibre mock specifically for table functionality
export const createMapLibreMockForTable = () => {
  const markers: any[] = [];
  const layers: Record<string, any> = {};
  const sources: Record<string, any> = {};
  const eventHandlers: Record<string, Map<string, Function[]>> = {};

  const mockMap = {
    // Core map methods
    on: vi.fn((event: string, layerId: string, handler?: Function) => {
      if (typeof layerId === 'function') {
        // Global event
        handler = layerId;
        layerId = '_global';
      }
      if (!eventHandlers[layerId]) {
        eventHandlers[layerId] = new Map();
      }
      if (!eventHandlers[layerId].has(event)) {
        eventHandlers[layerId].set(event, []);
      }
      eventHandlers[layerId].get(event)!.push(handler!);
    }),
    off: vi.fn((event: string, layerId: string, handler?: Function) => {
      if (typeof layerId === 'function') {
        handler = layerId;
        layerId = '_global';
      }
      if (eventHandlers[layerId]?.has(event)) {
        const handlers = eventHandlers[layerId].get(event)!;
        const index = handlers.indexOf(handler!);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    }),
    once: vi.fn(),
    remove: vi.fn(),
    resize: vi.fn(),
    setCenter: vi.fn(),
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
    
    // Style and loading
    loaded: vi.fn(() => true),
    isStyleLoaded: vi.fn(() => true),
    
    // Layer management
    addLayer: vi.fn((layer) => {
      layers[layer.id] = layer;
    }),
    removeLayer: vi.fn((layerId) => {
      delete layers[layerId];
    }),
    getLayer: vi.fn((layerId) => layers[layerId] || null),
    
    // Source management
    addSource: vi.fn((sourceId, source) => {
      sources[sourceId] = source;
    }),
    removeSource: vi.fn((sourceId) => {
      delete sources[sourceId];
    }),
    getSource: vi.fn((sourceId) => sources[sourceId] || null),
    
    // Testing helpers
    _getMarkers: () => markers,
    _getLayers: () => layers,
    _getSources: () => sources,
    _getEventHandlers: () => eventHandlers,
    _triggerEvent: (event: string, layerId: string = '_global', data?: any) => {
      const handlers = eventHandlers[layerId]?.get(event) || [];
      handlers.forEach(handler => handler(data));
    }
  };

  const mockMarker = {
    setLngLat: vi.fn().mockReturnThis(),
    addTo: vi.fn((map) => {
      markers.push(mockMarker);
      return mockMarker;
    }),
    remove: vi.fn(() => {
      const index = markers.indexOf(mockMarker);
      if (index > -1) markers.splice(index, 1);
      return mockMarker;
    }),
    on: vi.fn().mockReturnThis(),
    off: vi.fn().mockReturnThis(),
    getElement: vi.fn(() => {
      const el = document.createElement('div');
      el.className = 'table-marker';
      return el;
    }),
    _element: null as HTMLElement | null
  };

  return { mockMap, mockMarker };
};

// Mock toast notifications for table testing
export const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  dismiss: vi.fn(),
};

// Enhanced mock for map context
export const createMapContextMock = () => {
  const { mockMap } = createMapLibreMockForTable();
  return mockMap;
};

// Table-specific coordinate sets for testing
export const tableTestCoordinates = {
  // Small test set (2 coordinates)
  simple: [
    [3.7174, 51.0543], // Ghent
    [4.3517, 50.8476]  // Brussels
  ] as Coordinates[],
  
  // Medium test set (4 coordinates)
  medium: [
    [3.7174, 51.0543], // Ghent
    [4.3517, 50.8476], // Brussels
    [4.4024, 51.2194], // Antwerp
    [5.5797, 50.6338]  // Liège
  ] as Coordinates[],
  
  // Large test set (8 coordinates)
  large: [
    [3.7174, 51.0543], // Ghent
    [4.3517, 50.8476], // Brussels
    [4.4024, 51.2194], // Antwerp
    [5.5797, 50.6338], // Liège
    [3.2219, 51.2067], // Bruges
    [4.8719, 50.4669], // Namur
    [5.8037, 50.2649], // Bastogne
    [6.1296, 50.4106]  // Arlon
  ] as Coordinates[],
  
  // Invalid coordinates for error testing
  invalid: [
    [181, 91],        // Out of bounds
    [null, undefined], // Invalid types
    [],               // Empty
    [1, 2, 3]        // Wrong length
  ] as any[],
  
  // Edge case coordinates
  edge: [
    [-180, -90],      // Min valid
    [180, 90],        // Max valid
    [0, 0],           // Null island
    [-0.1, 0.1]       // Near zero
  ] as Coordinates[]
};

// Table API response fixtures
export const tableAPIFixtures = {
  // Successful response for 2x2 matrix
  simple: {
    durations: [[0, 3600], [3600, 0]], // 1 hour travel time
    distances: [[0, 100000], [100000, 0]] // 100km distance
  } as TableResponse,
  
  // Medium matrix with varied travel times
  medium: {
    durations: [
      [0, 3600, 7200, 10800],
      [3600, 0, 3600, 7200],
      [7200, 3600, 0, 3600],
      [10800, 7200, 3600, 0]
    ],
    distances: [
      [0, 100000, 200000, 300000],
      [100000, 0, 150000, 250000],
      [200000, 150000, 0, 100000],
      [300000, 250000, 100000, 0]
    ]
  } as TableResponse,
  
  // Traffic-impacted response (30% slower than baseline)
  withTraffic: {
    durations: [[0, 4680], [4680, 0]], // 30% increase
    distances: [[0, 100000], [100000, 0]]
  } as TableResponse,
  
  // Error response formats
  error: {
    invalidCoordinates: { error: 'Invalid coordinates format' },
    rateLimited: { error: 'Rate limit exceeded' },
    serverError: { error: 'Internal server error' },
    timeout: { error: 'Request timeout' }
  },
  
  // Edge case responses
  edge: {
    empty: { durations: [], distances: [] } as TableResponse,
    nullValues: { durations: null, distances: null } as any,
    partialData: { durations: [[0, 3600]], distances: null } as any
  }
};

// JSON request fixtures for testing parsing
export const tableJSONFixtures = {
  valid: {
    simple: JSON.stringify({
      coordinates: tableTestCoordinates.simple,
      sources: [0, 1],
      destinations: [0, 1],
      annotations: ['duration', 'distance'],
      vehicleType: 'CAR',
      engine: 'OSM'
    }),
    
    minimal: JSON.stringify({
      coordinates: tableTestCoordinates.simple
    }),
    
    complete: JSON.stringify({
      coordinates: tableTestCoordinates.medium,
      sources: [0, 1, 2, 3],
      destinations: [0, 1, 2, 3],
      annotations: ['duration', 'distance'],
      vehicleType: 'TRUCK',
      engine: 'TOMTOM',
      departureTime: '2024-01-01T12:00:00Z'
    })
  },
  
  invalid: {
    malformedJSON: '{"coordinates": [3.7174, 51.0543]',
    emptyObject: '{}',
    missingCoordinates: JSON.stringify({ vehicleType: 'CAR' }),
    wrongCoordinateFormat: JSON.stringify({ coordinates: 'invalid' }),
    invalidCoordinateValues: JSON.stringify({ 
      coordinates: [[181, 91], [3.7174, 51.0543]] 
    })
  }
};

// Utility functions for table testing
export const tableTestUtils = {
  // Create a mock coordinate array with specified size
  createCoordinateArray: (size: number): Coordinates[] => {
    const coords: Coordinates[] = [];
    for (let i = 0; i < size; i++) {
      coords.push([
        3.5 + (i * 0.1), // Vary longitude
        50.8 + (i * 0.05) // Vary latitude
      ]);
    }
    return coords;
  },

  // Calculate expected matrix size for given coordinates
  getExpectedMatrixSize: (coordinates: Coordinates[]): number => {
    return coordinates.length;
  },

  // Validate table response structure
  validateTableResponse: (response: TableResponse, expectedSize: number): boolean => {
    if (!response.durations || !response.distances) return false;
    
    const durationsValid = Array.isArray(response.durations) &&
      response.durations.length === expectedSize &&
      response.durations.every(row => 
        Array.isArray(row) && row.length === expectedSize
      );
    
    const distancesValid = Array.isArray(response.distances) &&
      response.distances.length === expectedSize &&
      response.distances.every(row => 
        Array.isArray(row) && row.length === expectedSize
      );
    
    return durationsValid && distancesValid;
  },

  // Create traffic impact test data
  createTrafficImpactData: (baselineResponse: TableResponse, impactFactor: number = 1.3) => {
    if (!baselineResponse.durations) return baselineResponse;
    
    const trafficDurations = baselineResponse.durations.map(row =>
      row.map(duration => Math.round(duration * impactFactor))
    );
    
    return {
      ...baselineResponse,
      durations: trafficDurations
    } as TableResponse;
  },

  // Wait for debounced operations in tests
  waitForDebounce: (ms: number = 1100) => 
    new Promise(resolve => setTimeout(resolve, ms)),

  // Simulate user typing in textarea
  simulateTextareaInput: (element: HTMLTextAreaElement, text: string) => {
    element.focus();
    element.value = text;
    element.dispatchEvent(new Event('change', { bubbles: true }));
  },

  // Simulate map click
  simulateMapClick: (coordinates: Coordinates, mockMap: any) => {
    const clickEvent = {
      lngLat: { lng: coordinates[0], lat: coordinates[1] },
      point: { x: 100, y: 100 },
      preventDefault: vi.fn(),
      originalEvent: new MouseEvent('click')
    };
    
    mockMap._triggerEvent('click', '_global', clickEvent);
    return clickEvent;
  },

  // Validate coordinate format
  isValidCoordinate: (coord: any): coord is Coordinates => {
    return Array.isArray(coord) &&
      coord.length === 2 &&
      typeof coord[0] === 'number' &&
      typeof coord[1] === 'number' &&
      coord[0] >= -180 && coord[0] <= 180 &&
      coord[1] >= -90 && coord[1] <= 90;
  }
};

// Performance testing utilities
export const performanceTestUtils = {
  // Measure function execution time
  measureExecutionTime: async <T>(fn: () => Promise<T> | T): Promise<{ result: T; time: number }> => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, time: end - start };
  },

  // Create large coordinate dataset for performance testing
  createLargeDataset: (size: number): Coordinates[] => {
    return Array.from({ length: size }, (_, i) => [
      -10 + (i % 20) * 1, // Spread across longitude
      45 + Math.floor(i / 20) * 1 // Spread across latitude
    ]);
  },

  // Memory usage tracker (mock for testing environment)
  trackMemoryUsage: () => {
    const initial = performance.memory?.usedJSHeapSize || 0;
    return {
      getUsage: () => (performance.memory?.usedJSHeapSize || 0) - initial,
      reset: () => initial
    };
  }
};

// Export all utilities as a comprehensive testing toolkit
export default {
  createMapLibreMockForTable,
  mockToast,
  createMapContextMock,
  tableTestCoordinates,
  tableAPIFixtures,
  tableJSONFixtures,
  tableTestUtils,
  performanceTestUtils
};