import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';

// Mock the geocoding service
const mockReverseGeocode = vi.fn();
const mockForwardGeocode = vi.fn();

vi.mock('@/lib/geocoding', () => ({
  reverseGeocode: mockReverseGeocode,
  forwardGeocode: mockForwardGeocode,
}));

// Mock solvice API
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
Object.defineProperty(global.navigator, 'geolocation', {
  value: {
    getCurrentPosition: vi.fn((success) => success({
      coords: { latitude: 51.0543, longitude: 3.7174 }
    })),
  },
  writable: true
});

import HomePage from '@/app/page';

describe('Input-Map Synchronization', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    mockReverseGeocode.mockResolvedValue('Brussels, Belgium');
    mockForwardGeocode.mockResolvedValue([4.3517, 50.8503]); // Brussels coordinates
    
    // Mock solvice API
    const solviceApi = await import('@/lib/solvice-api');
    const mockCalculateRoute = vi.mocked(solviceApi.calculateRoute);
    mockCalculateRoute.mockResolvedValue({
      routes: [{ geometry: 'mockPolyline', distance: 1000, duration: 300 }],
      waypoints: []
    });
  });

  describe('Marker to Input Synchronization', () => {
    it('should update origin input when origin marker is placed', async () => {
      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      // Trigger map load event
      act(() => {
        const loadHandler = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
        if (loadHandler) loadHandler();
      });

      // Click to place origin marker
      const mapContainer = screen.getByTestId('map-container');
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 4.3517, lat: 50.8503 } });
        }
      });

      // Wait for reverse geocoding to complete
      await waitFor(() => {
        expect(mockReverseGeocode).toHaveBeenCalledWith([4.3517, 50.8503]);
      });

      // Check that origin input is updated with address
      const originInput = screen.getByLabelText(/origin/i);
      await waitFor(() => {
        expect(originInput).toHaveValue('Brussels, Belgium');
      });
    });

    it('should update destination input when destination marker is placed', async () => {
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
      
      // Place origin marker first
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 4.3517, lat: 50.8503 } });
        }
      });

      // Place destination marker
      mockReverseGeocode.mockResolvedValueOnce('Antwerp, Belgium');
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 4.4025, lat: 51.2194 } });
        }
      });

      // Wait for reverse geocoding to complete
      await waitFor(() => {
        expect(mockReverseGeocode).toHaveBeenCalledWith([4.4025, 51.2194]);
      });

      // Check that destination input is updated with address
      const destinationInput = screen.getByLabelText(/destination/i);
      await waitFor(() => {
        expect(destinationInput).toHaveValue('Antwerp, Belgium');
      });
    });

    it('should handle reverse geocoding errors gracefully', async () => {
      mockReverseGeocode.mockRejectedValue(new Error('Geocoding service unavailable'));

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      // Trigger map load event
      act(() => {
        const loadHandler = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
        if (loadHandler) loadHandler();
      });

      // Click to place marker
      const mapContainer = screen.getByTestId('map-container');
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 4.3517, lat: 50.8503 } });
        }
      });

      // Should fall back to coordinate display
      await waitFor(() => {
        const originInput = screen.getByLabelText(/origin/i);
        expect(originInput).toHaveValue('50.8503, 4.3517');
      });
    });
  });

  describe('Input to Marker Synchronization', () => {
    it('should update origin marker when typing address in origin input', async () => {
      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      const originInput = screen.getByLabelText(/origin/i);
      
      // Type address in origin input
      act(() => {
        fireEvent.change(originInput, { target: { value: 'Brussels, Belgium' } });
      });

      // Wait for forward geocoding to complete
      await waitFor(() => {
        expect(mockForwardGeocode).toHaveBeenCalledWith('Brussels, Belgium');
      });

      // Should place marker at the geocoded coordinates
      // (This would be verified by checking if marker component receives correct coordinates)
    });

    it('should update destination marker when typing address in destination input', async () => {
      mockForwardGeocode.mockResolvedValueOnce([4.4025, 51.2194]); // Antwerp

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      const destinationInput = screen.getByLabelText(/destination/i);
      
      // Type address in destination input
      act(() => {
        fireEvent.change(destinationInput, { target: { value: 'Antwerp, Belgium' } });
      });

      // Wait for forward geocoding to complete
      await waitFor(() => {
        expect(mockForwardGeocode).toHaveBeenCalledWith('Antwerp, Belgium');
      });

      // Should place marker at the geocoded coordinates
      // (This would be verified by checking if marker component receives correct coordinates)
    });

    it('should handle forward geocoding errors gracefully', async () => {
      mockForwardGeocode.mockRejectedValue(new Error('Address not found'));

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      const originInput = screen.getByLabelText(/origin/i);
      
      // Type invalid address
      act(() => {
        fireEvent.change(originInput, { target: { value: 'Invalid Address 12345' } });
      });

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/address not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Debounced Geocoding', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should debounce forward geocoding calls when typing rapidly', async () => {
      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      const originInput = screen.getByLabelText(/origin/i);
      
      // Type rapidly
      act(() => {
        fireEvent.change(originInput, { target: { value: 'B' } });
      });
      act(() => {
        fireEvent.change(originInput, { target: { value: 'Br' } });
      });
      act(() => {
        fireEvent.change(originInput, { target: { value: 'Bru' } });
      });
      act(() => {
        fireEvent.change(originInput, { target: { value: 'Brussels' } });
      });

      // Advance timers to trigger debounce
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Should only call geocoding once with final value
      await waitFor(() => {
        expect(mockForwardGeocode).toHaveBeenCalledTimes(1);
        expect(mockForwardGeocode).toHaveBeenCalledWith('Brussels');
      });
    });

    it('should cancel previous geocoding requests when new ones are made', async () => {
      let firstResolve: (value: any) => void;
      let secondResolve: (value: any) => void;
      
      const firstRequest = new Promise(resolve => { firstResolve = resolve; });
      const secondRequest = new Promise(resolve => { secondResolve = resolve; });
      
      mockForwardGeocode
        .mockReturnValueOnce(firstRequest)
        .mockReturnValueOnce(secondRequest);

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      const originInput = screen.getByLabelText(/origin/i);
      
      // Start first geocoding request
      act(() => {
        fireEvent.change(originInput, { target: { value: 'Brussels' } });
      });
      
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Start second request before first completes
      act(() => {
        fireEvent.change(originInput, { target: { value: 'Antwerp' } });
      });
      
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Resolve first request (should be ignored)
      act(() => {
        firstResolve!([4.3517, 50.8503]);
      });

      // Resolve second request (should be used)
      act(() => {
        secondResolve!([4.4025, 51.2194]);
      });

      await waitFor(() => {
        expect(mockForwardGeocode).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('State Consistency', () => {
    it('should maintain consistency between input values and marker positions', async () => {
      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      // Trigger map load event
      act(() => {
        const loadHandler = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
        if (loadHandler) loadHandler();
      });

      const originInput = screen.getByLabelText(/origin/i);
      const mapContainer = screen.getByTestId('map-container');
      
      // Place marker via map click
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 4.3517, lat: 50.8503 } });
        }
      });

      // Input should be updated
      await waitFor(() => {
        expect(originInput).toHaveValue('Brussels, Belgium');
      });

      // Now type in input
      mockForwardGeocode.mockResolvedValueOnce([4.4025, 51.2194]);
      act(() => {
        fireEvent.change(originInput, { target: { value: 'Antwerp, Belgium' } });
      });

      // Marker position should be updated to match input
      await waitFor(() => {
        expect(mockForwardGeocode).toHaveBeenCalledWith('Antwerp, Belgium');
      });
    });

    it('should clear destination when origin is moved via input', async () => {
      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      // Trigger map load event
      act(() => {
        const loadHandler = mockMap.on.mock.calls.find(call => call[0] === 'load')?.[1];
        if (loadHandler) loadHandler();
      });

      const originInput = screen.getByLabelText(/origin/i);
      const destinationInput = screen.getByLabelText(/destination/i);
      const mapContainer = screen.getByTestId('map-container');
      
      // Place both markers via map clicks
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 4.3517, lat: 50.8503 } });
        }
      });

      mockReverseGeocode.mockResolvedValueOnce('Antwerp, Belgium');
      act(() => {
        fireEvent.click(mapContainer);
        const clickHandler = mockMap.on.mock.calls.find(call => call[0] === 'click')?.[1];
        if (clickHandler) {
          clickHandler({ lngLat: { lng: 4.4025, 51.2194 } });
        }
      });

      // Wait for both inputs to be populated
      await waitFor(() => {
        expect(originInput).toHaveValue('Brussels, Belgium');
      });
      await waitFor(() => {
        expect(destinationInput).toHaveValue('Antwerp, Belgium');
      });

      // Change origin via input
      mockForwardGeocode.mockResolvedValueOnce([3.7174, 51.0543]); // Ghent
      act(() => {
        fireEvent.change(originInput, { target: { value: 'Ghent, Belgium' } });
      });

      // Destination should be cleared
      await waitFor(() => {
        expect(destinationInput).toHaveValue('');
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover from geocoding errors and allow new attempts', async () => {
      // First call fails
      mockForwardGeocode.mockRejectedValueOnce(new Error('Network error'));
      // Second call succeeds
      mockForwardGeocode.mockResolvedValueOnce([4.3517, 50.8503]);

      render(<HomePage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('map-container')).toBeInTheDocument();
      });

      const originInput = screen.getByLabelText(/origin/i);
      
      // First attempt - should fail
      act(() => {
        fireEvent.change(originInput, { target: { value: 'Brussels' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Second attempt - should succeed
      act(() => {
        fireEvent.change(originInput, { target: { value: 'Brussels, Belgium' } });
      });

      await waitFor(() => {
        expect(mockForwardGeocode).toHaveBeenCalledTimes(2);
      });

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/network error/i)).not.toBeInTheDocument();
      });
    });
  });
});