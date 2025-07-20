import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@/src/test/utils';
import { RouteLayer } from '@/components/route-layer';
import { useMapContext } from '@/contexts/map-context';

// Mock MapLibre GL and map context
vi.mock('@/contexts/map-context');

describe('RouteLayer', () => {
  const mockMap = {
    addSource: vi.fn(),
    removeSource: vi.fn(),
    addLayer: vi.fn(),
    removeLayer: vi.fn(),
    getSource: vi.fn(),
    getLayer: vi.fn(),
    setLayoutProperty: vi.fn(),
    setPaintProperty: vi.fn(),
  };

  const mockRoute = {
    routes: [{
      distance: 55000,
      duration: 3600,
      geometry: 'u{~vFvyys@fS]'
    }]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useMapContext).mockReturnValue(mockMap as any);
    mockMap.getSource.mockReturnValue(null);
    mockMap.getLayer.mockReturnValue(null);
  });

  describe('route rendering', () => {
    it('should not render anything when map is not available', () => {
      vi.mocked(useMapContext).mockReturnValue(null);
      
      render(<RouteLayer route={mockRoute} />);
      
      expect(mockMap.addSource).not.toHaveBeenCalled();
      expect(mockMap.addLayer).not.toHaveBeenCalled();
    });

    it('should not render anything when route is null', () => {
      render(<RouteLayer route={null} />);
      
      expect(mockMap.addSource).not.toHaveBeenCalled();
      expect(mockMap.addLayer).not.toHaveBeenCalled();
    });

    it('should add route source and layer when route is provided', () => {
      render(<RouteLayer route={mockRoute} />);
      
      expect(mockMap.addSource).toHaveBeenCalledWith('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: expect.any(Array)
          }
        }
      });

      expect(mockMap.addLayer).toHaveBeenCalledWith({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    });

    it('should decode polyline geometry correctly', () => {
      render(<RouteLayer route={mockRoute} />);
      
      const addSourceCall = mockMap.addSource.mock.calls[0];
      const sourceData = addSourceCall[1].data;
      
      expect(sourceData.geometry.type).toBe('LineString');
      expect(sourceData.geometry.coordinates).toEqual(expect.any(Array));
      expect(sourceData.geometry.coordinates.length).toBeGreaterThan(0);
    });

    it('should update route when route data changes', () => {
      const { rerender } = render(<RouteLayer route={mockRoute} />);
      
      expect(mockMap.addSource).toHaveBeenCalledTimes(1);
      
      const newRoute = {
        routes: [{
          distance: 75000,
          duration: 4500,
          geometry: 'different_polyline_string'
        }]
      };
      
      // Clear the mock calls to test the rerender behavior
      vi.clearAllMocks();
      
      rerender(<RouteLayer route={newRoute} />);
      
      // Should add the new route (cleanup happens internally)
      expect(mockMap.addSource).toHaveBeenCalledTimes(1);
    });

    it('should handle existing source gracefully', () => {
      mockMap.getSource.mockReturnValue({ type: 'geojson' });
      
      render(<RouteLayer route={mockRoute} />);
      
      expect(mockMap.removeSource).toHaveBeenCalledWith('route');
      expect(mockMap.addSource).toHaveBeenCalled();
    });

    it('should handle existing layer gracefully', () => {
      mockMap.getLayer.mockReturnValue({ id: 'route' });
      
      render(<RouteLayer route={mockRoute} />);
      
      expect(mockMap.removeLayer).toHaveBeenCalledWith('route');
      expect(mockMap.addLayer).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('should remove route layer and source on unmount', () => {
      // Mock that layer and source exist
      mockMap.getLayer.mockReturnValue({ id: 'route' });
      mockMap.getSource.mockReturnValue({ type: 'geojson' });
      
      const { unmount } = render(<RouteLayer route={mockRoute} />);
      
      unmount();
      
      expect(mockMap.removeLayer).toHaveBeenCalledWith('route');
      expect(mockMap.removeSource).toHaveBeenCalledWith('route');
    });

    it('should remove route when route becomes null', () => {
      const { rerender } = render(<RouteLayer route={mockRoute} />);
      
      expect(mockMap.addSource).toHaveBeenCalled();
      
      // Clear mock calls to test null behavior
      vi.clearAllMocks();
      
      rerender(<RouteLayer route={null} />);
      
      // Should not add anything when route is null
      expect(mockMap.addSource).not.toHaveBeenCalled();
      expect(mockMap.addLayer).not.toHaveBeenCalled();
    });

    it('should handle cleanup when map is null', () => {
      const { rerender } = render(<RouteLayer route={mockRoute} />);
      
      vi.mocked(useMapContext).mockReturnValue(null);
      
      // Should not throw error when map becomes null
      expect(() => {
        rerender(<RouteLayer route={null} />);
      }).not.toThrow();
    });
  });

  describe('styling', () => {
    it('should apply custom styling when provided', () => {
      const customStyle = {
        color: '#ef4444',
        width: 6,
        opacity: 1.0
      };
      
      render(<RouteLayer route={mockRoute} style={customStyle} />);
      
      expect(mockMap.addLayer).toHaveBeenCalledWith({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ef4444',
          'line-width': 6,
          'line-opacity': 1.0
        }
      });
    });

    it('should use default styling when no style is provided', () => {
      render(<RouteLayer route={mockRoute} />);
      
      expect(mockMap.addLayer).toHaveBeenCalledWith({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.8
        }
      });
    });
  });

  describe('error handling', () => {
    it('should handle polyline decoding errors gracefully', () => {
      const invalidRoute = {
        routes: [{
          distance: 55000,
          duration: 3600,
          geometry: 'invalid_polyline'
        }]
      };
      
      // Should not throw error
      expect(() => {
        render(<RouteLayer route={invalidRoute} />);
      }).not.toThrow();
      
      // Should still try to add source with empty coordinates
      expect(mockMap.addSource).toHaveBeenCalledWith('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: []
          }
        }
      });
    });

    it('should handle map operation errors gracefully', () => {
      mockMap.addSource.mockImplementation(() => {
        throw new Error('Map error');
      });
      
      // Should not throw error
      expect(() => {
        render(<RouteLayer route={mockRoute} />);
      }).not.toThrow();
    });
  });
});