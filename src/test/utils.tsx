import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Toaster } from 'sonner'

// Custom render function with providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <Toaster />
    </>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

// Mock coordinates for testing
export const mockCoordinates = {
  ghent: [3.7174, 51.0543] as [number, number],
  brussels: [4.3517, 50.8476] as [number, number],
  antwerp: [4.4024, 51.2194] as [number, number],
}

// Mock geolocation responses
export const mockGeolocationSuccess = (coords: [number, number]) => ({
  coords: {
    longitude: coords[0],
    latitude: coords[1],
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
})

export const mockGeolocationError = (code: number, message: string) => ({
  code,
  message,
  PERMISSION_DENIED: 1,
  POSITION_UNAVAILABLE: 2,
  TIMEOUT: 3,
})

// Test utilities for coordinate validation
export const expectValidCoordinates = (coords: unknown) => {
  if (typeof expect !== 'undefined') {
    expect(coords).toEqual(
      expect.arrayContaining([
        expect.any(Number),
        expect.any(Number)
      ])
    )
    
    if (Array.isArray(coords) && coords.length === 2) {
      const [lng, lat] = coords
      expect(lng).toBeGreaterThanOrEqual(-180)
      expect(lng).toBeLessThanOrEqual(180)
      expect(lat).toBeGreaterThanOrEqual(-90)
      expect(lat).toBeLessThanOrEqual(90)
    }
  }
}

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0))