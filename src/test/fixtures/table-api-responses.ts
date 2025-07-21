import { TableResponse } from '@/lib/solvice-table-api';
import type { Coordinates } from '@/lib/coordinates';

// Standard test coordinate sets
export const testCoordinates = {
  ghentBrussels: [
    [3.7174, 51.0543], // Ghent
    [4.3517, 50.8476]  // Brussels
  ] as Coordinates[],
  
  belgiumCities: [
    [3.7174, 51.0543], // Ghent
    [4.3517, 50.8476], // Brussels
    [4.4024, 51.2194], // Antwerp
    [5.5797, 50.6338]  // Liège
  ] as Coordinates[]
};

// Baseline API responses (OSM engine)
export const baselineResponses: Record<string, TableResponse> = {
  // 2x2 matrix: Ghent ↔ Brussels
  ghentBrussels: {
    durations: [
      [0, 3600],     // Ghent to Brussels: 1 hour
      [3600, 0]      // Brussels to Ghent: 1 hour
    ],
    distances: [
      [0, 56000],    // 56 km
      [56000, 0]
    ]
  },
  
  // 4x4 matrix: Belgian cities
  belgiumCities: {
    durations: [
      [0, 3600, 2400, 7200],      // From Ghent
      [3600, 0, 2700, 6300],      // From Brussels  
      [2400, 2700, 0, 7800],      // From Antwerp
      [7200, 6300, 7800, 0]       // From Liège
    ],
    distances: [
      [0, 56000, 60000, 120000],  // From Ghent (km)
      [56000, 0, 45000, 95000],   // From Brussels
      [60000, 45000, 0, 130000],  // From Antwerp  
      [120000, 95000, 130000, 0]  // From Liège
    ]
  },
  
  // Single coordinate (edge case)
  single: {
    durations: [[0]],
    distances: [[0]]
  },
  
  // Empty matrix (edge case)
  empty: {
    durations: [],
    distances: []
  }
};

// Traffic-aware API responses (TOMTOM engine)
export const trafficResponses: Record<string, TableResponse> = {
  // Light traffic impact (10-20% increase)
  lightTraffic: {
    durations: [
      [0, 3960],     // 10% increase: 3600s -> 3960s
      [4320, 0]      // 20% increase: 3600s -> 4320s
    ],
    distances: [
      [0, 56000],    // Distance unchanged
      [56000, 0]
    ]
  },
  
  // Heavy traffic impact (30-50% increase)
  heavyTraffic: {
    durations: [
      [0, 4680],     // 30% increase: 3600s -> 4680s  
      [5400, 0]      // 50% increase: 3600s -> 5400s
    ],
    distances: [
      [0, 56000],    // Distance unchanged
      [56000, 0]
    ]
  },
  
  // Mixed traffic conditions
  mixedTraffic: {
    durations: [
      [0, 3600, 2880, 8640],      // From Ghent: 0%, 20%, 20% increases
      [3960, 0, 3510, 7560],      // From Brussels: 10%, 30%, 20% increases
      [2640, 3240, 0, 9360],      // From Antwerp: 10%, 20%, 20% increases
      [7920, 7560, 9360, 0]       // From Liège: 10%, 20%, 20% increases
    ],
    distances: [
      [0, 56000, 60000, 120000],  // Distances unchanged
      [56000, 0, 45000, 95000],
      [60000, 45000, 0, 130000],
      [120000, 95000, 130000, 0]
    ]
  }
};

// API error responses
export const errorResponses = {
  // Client errors (4xx)
  badRequest: {
    status: 400,
    error: 'Bad Request',
    message: 'Invalid coordinates format',
    code: 'INVALID_COORDINATES'
  },
  
  unauthorized: {
    status: 401, 
    error: 'Unauthorized',
    message: 'Invalid API key',
    code: 'INVALID_API_KEY'
  },
  
  rateLimited: {
    status: 429,
    error: 'Too Many Requests', 
    message: 'Rate limit exceeded',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60
  },
  
  // Server errors (5xx)
  serverError: {
    status: 500,
    error: 'Internal Server Error',
    message: 'Server encountered an error',
    code: 'INTERNAL_ERROR'
  },
  
  serviceUnavailable: {
    status: 503,
    error: 'Service Unavailable', 
    message: 'Routing service temporarily unavailable',
    code: 'SERVICE_UNAVAILABLE',
    retryAfter: 300
  },
  
  // Network errors
  networkError: new Error('Network request failed'),
  timeoutError: new Error('Request timeout'),
  
  // Malformed responses
  malformedResponse: '{"incomplete": json',
  emptyResponse: '',
  nullResponse: null
};

// Real-world inspired response data
export const realWorldResponses = {
  // Rush hour traffic in Brussels area
  rushHour: {
    durations: [
      [0, 5400, 3600, 10800],     // Significantly increased times
      [5400, 0, 4050, 9450],      // Heavy traffic between major cities
      [3600, 4050, 0, 11700],     // Rush hour congestion
      [10800, 9450, 11700, 0]
    ],
    distances: [
      [0, 56000, 60000, 120000],
      [56000, 0, 45000, 95000], 
      [60000, 45000, 0, 130000],
      [120000, 95000, 130000, 0]
    ]
  },
  
  // Night/weekend with minimal traffic
  offPeak: {
    durations: [
      [0, 3240, 2160, 6480],      // Faster than baseline
      [3240, 0, 2430, 5670],      // Minimal traffic impact
      [2160, 2430, 0, 7020],      // Clear roads
      [6480, 5670, 7020, 0]
    ],
    distances: [
      [0, 56000, 60000, 120000],
      [56000, 0, 45000, 95000],
      [60000, 45000, 0, 130000], 
      [120000, 95000, 130000, 0]
    ]
  }
};

// Utility functions for generating test responses
export const responseGenerators = {
  // Create a symmetric matrix with specified size and base duration
  createSymmetricMatrix: (size: number, baseDuration: number = 3600): TableResponse => {
    const durations: number[][] = [];
    const distances: number[][] = [];
    
    for (let i = 0; i < size; i++) {
      durations[i] = [];
      distances[i] = [];
      
      for (let j = 0; j < size; j++) {
        if (i === j) {
          durations[i][j] = 0;
          distances[i][j] = 0;
        } else {
          // Vary durations based on distance from diagonal
          const variation = Math.abs(i - j) * 0.5;
          durations[i][j] = Math.round(baseDuration * (1 + variation));
          distances[i][j] = Math.round(durations[i][j] * 20); // ~20m/s average
        }
      }
    }
    
    return { durations, distances };
  },
  
  // Apply traffic impact to a baseline response
  applyTrafficImpact: (baseline: TableResponse, impactFactors: number[][]): TableResponse => {
    if (!baseline.durations || !baseline.distances) {
      return baseline;
    }
    
    const trafficDurations = baseline.durations.map((row, i) =>
      row.map((duration, j) => {
        const factor = impactFactors[i]?.[j] || 1.0;
        return Math.round(duration * factor);
      })
    );
    
    return {
      durations: trafficDurations,
      distances: baseline.distances // Distances typically don't change
    };
  },
  
  // Create response with missing or null data
  createPartialResponse: (type: 'missingDurations' | 'missingDistances' | 'bothNull'): Partial<TableResponse> => {
    const base = baselineResponses.ghentBrussels;
    
    switch (type) {
      case 'missingDurations':
        return { distances: base.distances } as Partial<TableResponse>;
      case 'missingDistances':
        return { durations: base.durations } as Partial<TableResponse>;
      case 'bothNull':
        return { durations: null, distances: null } as any;
      default:
        return base;
    }
  }
};

// Mock fetch responses for different scenarios
export const mockFetchResponses = {
  success: (data: TableResponse) => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  } as Response),
  
  error: (errorData: any, status: number = 500) => Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve(errorData),
    text: () => Promise.resolve(JSON.stringify(errorData)),
    statusText: errorData.error || 'Error'
  } as Response),
  
  networkError: () => Promise.reject(errorResponses.networkError),
  
  timeout: () => new Promise((_, reject) => {
    setTimeout(() => reject(errorResponses.timeoutError), 100);
  })
};

// Performance test data generators
export const performanceData = {
  // Generate large coordinate set
  generateLargeCoordinateSet: (size: number): Coordinates[] => {
    return Array.from({ length: size }, (_, i) => {
      // Distribute points across Belgium roughly
      const baseLatitude = 50.5 + (i % 10) * 0.05;
      const baseLongitude = 3.5 + Math.floor(i / 10) * 0.1;
      return [baseLongitude, baseLatitude];
    });
  },
  
  // Generate correspondingly large response matrix
  generateLargeResponseMatrix: (size: number): TableResponse => {
    return responseGenerators.createSymmetricMatrix(size, 3600);
  }
};

// Export comprehensive fixture collection
export default {
  testCoordinates,
  baselineResponses,
  trafficResponses,
  errorResponses,
  realWorldResponses,
  responseGenerators,
  mockFetchResponses,
  performanceData
};