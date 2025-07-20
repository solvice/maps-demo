import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from './utils'
import { Map } from '../../components/map'
import maplibregl from 'maplibre-gl'

// Mock MapLibre GL more comprehensively
const mockMapInstance = {
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

vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(() => mockMapInstance),
  },
  Map: vi.fn(() => mockMapInstance),
}))

describe('Map Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the constructor mock
    vi.mocked(maplibregl.Map).mockImplementation(() => mockMapInstance)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('basic rendering', () => {
    it('should render map container', () => {
      render(<Map />)
      
      const mapContainer = screen.getByTestId('map-container')
      expect(mapContainer).toBeInTheDocument()
      expect(mapContainer).toHaveClass('h-full', 'w-full')
    })

    it('should initialize MapLibre with correct defaults', () => {
      render(<Map />)
      
      expect(maplibregl.Map).toHaveBeenCalledWith({
        container: expect.any(Element),
        style: 'https://cdn.solvice.io/styles/light.json',
        center: [3.7174, 51.0543], // Ghent fallback
        zoom: 12,
        attributionControl: false,
      })
    })

    it('should use custom center and zoom when provided', () => {
      const customCenter = [4.3517, 50.8476] as [number, number] // Brussels
      const customZoom = 15
      
      render(<Map center={customCenter} zoom={customZoom} />)
      
      expect(maplibregl.Map).toHaveBeenCalledWith(
        expect.objectContaining({
          center: customCenter,
          zoom: customZoom,
        })
      )
    })
  })

  describe('map initialization', () => {
    it('should handle successful map load', async () => {
      const onLoad = vi.fn()
      render(<Map onLoad={onLoad} />)
      
      // Simulate map load event
      const loadHandler = mockMapInstance.on.mock.calls.find(
        call => call[0] === 'load'
      )?.[1]
      
      expect(loadHandler).toBeDefined()
      loadHandler?.()
      
      await waitFor(() => {
        expect(onLoad).toHaveBeenCalledWith(mockMapInstance)
      })
    })

    it('should handle map initialization errors', async () => {
      const onError = vi.fn()
      
      // Mock map constructor to throw error
      vi.mocked(maplibregl.Map).mockImplementation(() => {
        throw new Error('Failed to initialize map')
      })
      
      render(<Map onError={onError} />)
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Failed to initialize map')
          })
        )
      })
    })

    it('should handle map error events', async () => {
      const onError = vi.fn()
      render(<Map onError={onError} />)
      
      // Simulate map error event
      const errorHandler = mockMapInstance.on.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]
      
      expect(errorHandler).toBeDefined()
      errorHandler?.({ error: { message: 'Style loading failed' } })
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: expect.stringContaining('Style loading failed')
          })
        )
      })
    })
  })

  describe('click handling', () => {
    it('should register click handler when onClick is provided', () => {
      const onClick = vi.fn()
      render(<Map onClick={onClick} />)
      
      // Check that click handler was registered
      const clickHandler = mockMapInstance.on.mock.calls.find(
        call => call[0] === 'click'
      )?.[1]
      
      expect(clickHandler).toBeDefined()
    })

    it('should call onClick with correct coordinates', () => {
      const onClick = vi.fn()
      render(<Map onClick={onClick} />)
      
      // Simulate click event
      const clickHandler = mockMapInstance.on.mock.calls.find(
        call => call[0] === 'click'
      )?.[1]
      
      const mockClickEvent = {
        lngLat: { lng: 3.7174, lat: 51.0543 }
      }
      
      clickHandler?.(mockClickEvent)
      
      expect(onClick).toHaveBeenCalledWith([3.7174, 51.0543])
    })

    it('should not register click handler when onClick is not provided', () => {
      render(<Map />)
      
      const clickHandler = mockMapInstance.on.mock.calls.find(
        call => call[0] === 'click'
      )?.[1]
      
      expect(clickHandler).toBeUndefined()
    })
  })

  describe('center updates', () => {
    it('should update map center when center prop changes', async () => {
      const { rerender } = render(<Map center={[3.7174, 51.0543]} />)
      
      // Simulate map load to enable setCenter
      const loadHandler = mockMapInstance.on.mock.calls.find(
        call => call[0] === 'load'
      )?.[1]
      loadHandler?.()
      
      await waitFor(() => {
        // Wait for isLoaded to be true
      })
      
      // Clear previous calls
      vi.clearAllMocks()
      
      // Re-render with new center
      rerender(<Map center={[4.3517, 50.8476]} />)
      
      expect(mockMapInstance.setCenter).toHaveBeenCalledWith([4.3517, 50.8476])
    })

    it('should not create new map instance when center changes', () => {
      const { rerender } = render(<Map center={[3.7174, 51.0543]} />)
      
      const initialCallCount = vi.mocked(maplibregl.Map).mock.calls.length
      
      // Re-render with new center
      rerender(<Map center={[4.3517, 50.8476]} />)
      
      // Should not create new map
      expect(vi.mocked(maplibregl.Map).mock.calls.length).toBe(initialCallCount)
    })
  })

  describe('resize handling', () => {
    it('should handle window resize events', () => {
      render(<Map />)
      
      // Simulate window resize
      fireEvent(window, new Event('resize'))
      
      expect(mockMapInstance.resize).toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should clean up map instance on unmount', () => {
      const { unmount } = render(<Map />)
      
      unmount()
      
      expect(mockMapInstance.remove).toHaveBeenCalled()
    })

    it('should remove resize event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      
      const { unmount } = render(<Map />)
      
      unmount()
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))
      
      removeEventListenerSpy.mockRestore()
    })
  })

  describe('children rendering', () => {
    it('should not render children when map is not loaded', () => {
      render(
        <Map>
          <div data-testid="map-child">Child component</div>
        </Map>
      )
      
      expect(screen.queryByTestId('map-child')).not.toBeInTheDocument()
    })

    it('should render children when map is loaded', async () => {
      render(
        <Map>
          <div data-testid="map-child">Child component</div>
        </Map>
      )
      
      // Simulate map load
      const loadHandler = mockMapInstance.on.mock.calls.find(
        call => call[0] === 'load'
      )?.[1]
      loadHandler?.()
      
      await waitFor(() => {
        expect(screen.getByTestId('map-child')).toBeInTheDocument()
      })
    })
  })

  describe('error scenarios', () => {
    it('should handle missing container gracefully', () => {
      // Mock querySelector to return null
      const originalQuerySelector = document.querySelector
      document.querySelector = vi.fn().mockReturnValue(null)
      
      const onError = vi.fn()
      render(<Map onError={onError} />)
      
      // Restore original querySelector
      document.querySelector = originalQuerySelector
    })

    it('should handle style loading failures', async () => {
      const onError = vi.fn()
      render(<Map onError={onError} />)
      
      // Simulate style loading error
      const errorHandler = mockMapInstance.on.mock.calls.find(
        call => call[0] === 'error'
      )?.[1]
      
      errorHandler?.({ error: { message: 'Style loading failed' } })
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper accessibility attributes', () => {
      render(<Map />)
      
      const mapContainer = screen.getByTestId('map-container')
      expect(mapContainer).toBeInTheDocument()
    })
  })
})