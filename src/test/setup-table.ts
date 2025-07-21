import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { createMapLibreMockForTable, mockToast } from './utils/table-test-utils';

// Enhanced MapLibre mock for table functionality
const { mockMap, mockMarker } = createMapLibreMockForTable();

// Enhanced MapLibre GL mocking
vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(() => mockMap),
    Marker: vi.fn(() => mockMarker),
    Popup: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      setHTML: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      off: vi.fn().mockReturnThis(),
    })),
    LngLatBounds: vi.fn(() => ({
      extend: vi.fn().mockReturnThis(),
      getSouthWest: vi.fn(() => ({ lng: -1, lat: -1 })),
      getNorthEast: vi.fn(() => ({ lng: 1, lat: 1 })),
    }))
  },
  Map: vi.fn(() => mockMap),
  Marker: vi.fn(() => mockMarker),
  Popup: vi.fn(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    setHTML: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn().mockReturnThis(),
  })),
  LngLatBounds: vi.fn(() => ({
    extend: vi.fn().mockReturnThis(),
  }))
}));

// Mock toast notifications 
vi.mock('sonner', () => ({
  toast: mockToast,
  Toaster: () => null
}));

// Mock window.open for documentation links
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  configurable: true,
});

// Mock performance API for calculation timing
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  },
  configurable: true,
});

// Mock fetch with comprehensive response handling
global.fetch = vi.fn();

// Mock ResizeObserver for table components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver for table components
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock geolocation for click-to-place functionality
const mockGeolocation = {
  getCurrentPosition: vi.fn((success) =>
    success({
      coords: {
        latitude: 51.0543,
        longitude: 3.7174,
        accuracy: 10
      },
    })
  ),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true,
});

// Mock clipboard API for copy functionality
Object.defineProperty(global.navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve(''))
  },
  configurable: true,
});

// Mock CSS imports
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));
vi.mock('@/app/globals.css', () => ({}));

// Enhanced console filtering for table-specific logs
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

// Filter out known table test warnings/logs
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is deprecated') ||
     args[0].includes('Warning: React.createElement') ||
     args[0].includes('TableMarker: Missing map') ||
     args[0].includes('Error during background connections cleanup'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Error during TableConnections') ||
     args[0].includes('Error during popup cleanup'))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Optionally filter debug logs during testing
if (process.env.NODE_ENV === 'test') {
  console.log = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('🚗 Starting traffic impact') ||
       args[0].includes('📊 Matrix dimensions') ||
       args[0].includes('✅ Traffic impact calculated'))
    ) {
      return; // Filter out debug logs during tests
    }
    originalLog.call(console, ...args);
  };
}

// Global test utilities
declare global {
  var mockMap: any;
  var mockMarker: any;
  var mockToast: typeof mockToast;
}

globalThis.mockMap = mockMap;
globalThis.mockMarker = mockMarker;
globalThis.mockToast = mockToast;

// Test environment setup
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Reset fetch mock
  (global.fetch as any).mockClear();
  
  // Reset MapLibre state
  mockMap._getMarkers().length = 0;
  Object.keys(mockMap._getLayers()).forEach(key => delete mockMap._getLayers()[key]);
  Object.keys(mockMap._getSources()).forEach(key => delete mockMap._getSources()[key]);
  
  // Reset performance mock
  (window.performance.now as any).mockReturnValue(Date.now());
  
  // Reset toast mock
  Object.values(mockToast).forEach(fn => (fn as any).mockClear());
  
  // Reset window.open mock
  (window.open as any).mockClear();
  
  // Reset clipboard mock
  (navigator.clipboard.writeText as any).mockClear();
});

// Global cleanup after tests
afterEach(() => {
  // Clean up any remaining timers
  vi.clearAllTimers();
  
  // Clean up any pending promises
  vi.clearAllMocks();
});

export { mockMap, mockMarker, mockToast };