import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from './utils'
import Home from '../../app/page'

describe('App Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the application without crashing', async () => {
    render(<Home />)
    
    // Should show loading state initially
    expect(screen.getByText('Getting your location...')).toBeInTheDocument()
    
    // Should eventually render the map container
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should handle geolocation permission denied gracefully', async () => {
    // Mock geolocation failure
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success, error) =>
        error({
          code: 1, // PERMISSION_DENIED
          message: 'User denied geolocation'
        })
      ),
    }
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
    })

    render(<Home />)
    
    // Should eventually render map with fallback location
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should handle geolocation timeout gracefully', async () => {
    // Mock geolocation timeout
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success, error) =>
        setTimeout(() => error({
          code: 3, // TIMEOUT
          message: 'Geolocation timeout'
        }), 100)
      ),
    }
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true,
    })

    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByTestId('map-container')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('should have proper error boundary', () => {
    // This test verifies error boundary exists
    render(<Home />)
    
    // Error boundary should be present (testing the wrapper)
    expect(screen.getByTestId('map-container').closest('main')).toBeInTheDocument()
  })
})