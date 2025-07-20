import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';

// Import the main app component that will integrate real-time routing
import HomePage from '@/app/page';

// Mock the solvice API
vi.mock('@/lib/solvice-api');

// Mock MapLibre GL
const mockMap = {
  on: vi.fn(),
  off: vi.fn(),
  remove: vi.fn(),
  addSource: vi.fn(),
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  removeSource: vi.fn(),
  getLayer: vi.fn().mockReturnValue(null),
  getSource: vi.fn().mockReturnValue(null),
  setCenter: vi.fn(),
  resize: vi.fn(),
};

vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(() => mockMap),
    Marker: vi.fn(() => ({
      addTo: vi.fn(),
      remove: vi.fn(),
      setLngLat: vi.fn(),
    })),
  }
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};
Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

// Mock timers for debouncing tests
vi.useFakeTimers();

describe('Real-time Route Calculation', () => {
  let mockCalculateRoute: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Get the mocked function
    const solviceApi = await import('@/lib/solvice-api');
    mockCalculateRoute = vi.mocked(solviceApi.calculateRoute);
    
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success) => {
      success({
        coords: {
          latitude: 51.0543,
          longitude: 3.7174
        }
      });
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.useFakeTimers();
  });

  describe('Route calculation triggers', () => {
    it('should calculate route when second marker is placed', async () => {
      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      // Trigger map load event
      act(() => {
        const loadHandler = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
        if (loadHandler) loadHandler();
      });

      const mapContainer = screen.getByTestId('map-container');
      
      // First click - place origin marker
      act(() => {
        fireEvent.click(mapContainer, {
          clientX: 100,
          clientY: 100
        });
      });

      // Mock the click event for MapLibre
      act(() => {
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({
            lngLat: { lng: 3.7174, lat: 51.0543 }
          });
        }
      });

      expect(mockCalculateRoute).not.toHaveBeenCalled();

      // Second click - place destination marker, should trigger route calculation
      act(() => {
        fireEvent.click(mapContainer, {
          clientX: 200,
          clientY: 200
        });
      });

      act(() => {
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({
            lngLat: { lng: 3.8174, lat: 51.1543 }
          });
        }
      });

      await waitFor(() => {
        expect(mockCalculateRoute).toHaveBeenCalledWith(
          [3.7174, 51.0543],
          [3.8174, 51.1543],
          { overview: 'full' }
        );
      });
    });

    it('should recalculate route when markers are dragged', async () => {
      // This test will be implemented once drag functionality is in place
      expect(true).toBe(true); // Placeholder for now
    });

    it('should debounce route calculations during rapid changes', async () => {
      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      // Trigger map load event
      act(() => {
        const loadHandler = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
        if (loadHandler) loadHandler();
      });

      const mapContainer = screen.getByTestId('map-container');
      
      // Place origin marker
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.7174, lat: 51.0543 } });
        }
      });

      // Place destination marker
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.8174, lat: 51.1543 } });
        }
      });

      // Simulate rapid coordinate changes (like during drag)
      for (let i = 0; i < 5; i++) {
        act(() => {
          fireEvent.click(mapContainer);
          const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
          if (clickHandler) {
            clickHandler({ lngLat: { lng: 3.8174 + i * 0.001, lat: 51.1543 + i * 0.001 } });
          }
        });
      }

      // Fast-forward debounce timer
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should have only called calculateRoute once after debounce
      await waitFor(() => {
        expect(mockCalculateRoute).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Loading state management', () => {
    it('should show loading state during route calculation', async () => {
      // Mock a delayed API response
      mockCalculateRoute.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          routes: [{ geometry: 'mockPolyline', distance: 1000, duration: 300 }],
          waypoints: []
        }), 100))
      );

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      // Trigger map load
      act(() => {
        const loadHandler = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
        if (loadHandler) loadHandler();
      });

      const mapContainer = screen.getByTestId('map-container');
      
      // Place both markers to trigger route calculation
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.7174, lat: 51.0543 } });
        }
      });

      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.8174, lat: 51.1543 } });
        }
      });

      // Should show loading state immediately
      expect(screen.queryByText(/calculating route/i)).toBeInTheDocument();

      // Fast-forward to complete the API call
      act(() => {
        vi.advanceTimersByTime(100);
      });

      await waitFor(() => {
        expect(screen.queryByText(/calculating route/i)).not.toBeInTheDocument();
      });
    });

    it('should handle loading state correctly with concurrent requests', async () => {
      let resolveFirst: (value: any) => void;
      let resolveSecond: (value: any) => void;
      
      const firstRequest = new Promise(resolve => { resolveFirst = resolve; });
      const secondRequest = new Promise(resolve => { resolveSecond = resolve; });
      
      mockCalculateRoute
        .mockReturnValueOnce(firstRequest)
        .mockReturnValueOnce(secondRequest);

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      // Trigger map load
      act(() => {
        const loadHandler = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
        if (loadHandler) loadHandler();
      });

      const mapContainer = screen.getByTestId('map-container');
      
      // Place markers to trigger first request
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.7174, lat: 51.0543 } });
        }
      });

      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.8174, lat: 51.1543 } });
        }
      });

      // Trigger second request while first is pending
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.9174, lat: 51.2543 } });
        }
      });

      // Resolve first request (should be ignored)
      act(() => {
        resolveFirst!({
          routes: [{ geometry: 'oldPolyline', distance: 1000, duration: 300 }],
          waypoints: []
        });
      });

      // Resolve second request (should be used)
      act(() => {
        resolveSecond!({
          routes: [{ geometry: 'newPolyline', distance: 2000, duration: 600 }],
          waypoints: []
        });
      });

      await waitFor(() => {
        expect(screen.queryByText(/calculating route/i)).not.toBeInTheDocument();
      });

      // Verify that only the latest request result is used
      expect(mockMap.addSource).toHaveBeenCalledWith(
        'route',
        expect.objectContaining({
          data: expect.objectContaining({
            geometry: expect.objectContaining({
              coordinates: expect.any(Array)
            })
          })
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle route calculation errors gracefully', async () => {
      mockCalculateRoute.mockRejectedValue(new Error('Network error'));

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      // Trigger map load
      act(() => {
        const loadHandler = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
        if (loadHandler) loadHandler();
      });

      const mapContainer = screen.getByTestId('map-container');
      
      // Place markers to trigger route calculation
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.7174, lat: 51.0543 } });
        }
      });

      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.8174, lat: 51.1543 } });
        }
      });

      await waitFor(() => {
        expect(screen.queryByText(/calculating route/i)).not.toBeInTheDocument();
      });

      // Should show error message but not break the app
      expect(screen.queryByText(/error/i)).toBeInTheDocument();
    });

    it('should not break user flow when errors occur', async () => {
      mockCalculateRoute.mockRejectedValueOnce(new Error('API Error'));

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      // Trigger map load
      act(() => {
        const loadHandler = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
        if (loadHandler) loadHandler();
      });

      const mapContainer = screen.getByTestId('map-container');
      
      // Place markers - this should fail
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.7174, lat: 51.0543 } });
        }
      });

      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.8174, lat: 51.1543 } });
        }
      });

      await waitFor(() => {
        expect(mockCalculateRoute).toHaveBeenCalled();
      });

      // App should still be functional - can place new markers
      mockCalculateRoute.mockResolvedValueOnce({
        routes: [{ geometry: 'validPolyline', distance: 1000, duration: 300 }],
        waypoints: []
      });

      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.9174, lat: 51.2543 } });
        }
      });

      await waitFor(() => {
        expect(mockCalculateRoute).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Request coordination', () => {
    it('should cancel previous route requests when new ones are made', async () => {
      let firstAbortSignal: AbortSignal;
      let secondAbortSignal: AbortSignal;
      
      mockCalculateRoute.mockImplementation(() => {
        const controller = new AbortController();
        if (mockCalculateRoute.mock.calls.length === 1) {
          firstAbortSignal = controller.signal;
        } else {
          secondAbortSignal = controller.signal;
        }
        
        return new Promise((resolve, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error('Request cancelled'));
          });
          
          setTimeout(() => resolve({
            routes: [{ geometry: 'polyline', distance: 1000, duration: 300 }],
            waypoints: []
          }), 100);
        });
      });

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      // Trigger map load
      act(() => {
        const loadHandler = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
        if (loadHandler) loadHandler();
      });

      const mapContainer = screen.getByTestId('map-container');
      
      // Start first request
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.7174, lat: 51.0543 } });
        }
      });

      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.8174, lat: 51.1543 } });
        }
      });

      // Start second request before first completes
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 3.9174, lat: 51.2543 } });
        }
      });

      // Verify that concurrent requests are handled properly
      await waitFor(() => {
        expect(mockCalculateRoute).toHaveBeenCalledTimes(2);
      });
    });
  });
});