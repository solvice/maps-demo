import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock CSS imports
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}))
vi.mock('@/app/globals.css', () => ({}))

// Mock MapLibre GL
const mockMap = {
  on: vi.fn(),
  off: vi.fn(),
  remove: vi.fn(),
  resize: vi.fn(),
  setCenter: vi.fn(),
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  addSource: vi.fn(),
  removeSource: vi.fn(),
  getLayer: vi.fn(),
  getSource: vi.fn(),
}

const mockMarker = {
  setLngLat: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis(),
  remove: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
}

vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(() => mockMap),
    Marker: vi.fn(() => mockMarker),
  },
  Map: vi.fn(() => mockMap),
  Marker: vi.fn(() => mockMarker),
}))

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn((success) =>
    success({
      coords: {
        latitude: 51.0543,
        longitude: 3.7174,
      },
    })
  ),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
}

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  configurable: true,
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Console error filtering for expected warnings
const originalError = console.error
console.error = (...args) => {
  // Filter out known test warnings
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning: ReactDOM.render is deprecated') ||
     args[0].includes('Warning: React.createElement'))
  ) {
    return
  }
  originalError.call(console, ...args)
}