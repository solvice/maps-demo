import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';

// Mock the solvice API
vi.mock('@/lib/solvice-api', () => ({
  calculateRoute: vi.fn(),
}));

// Mock MapLibre GL
vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn(() => ({
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
    })),
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

describe('Simple Route Test', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const solviceApi = await import('@/lib/solvice-api');
    const mockCalculateRoute = vi.mocked(solviceApi.calculateRoute);
    mockCalculateRoute.mockResolvedValue({
      routes: [{ geometry: 'mockPolyline', distance: 1000, duration: 300 }],
      waypoints: []
    });
  });

  it('should render the home page', async () => {
    render(<HomePage />);
    expect(screen.getByText('Origin: Not set')).toBeInTheDocument();
    expect(screen.getByText('Destination: Not set')).toBeInTheDocument();
  });

  it('should have a map container', async () => {
    render(<HomePage />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
});