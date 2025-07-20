import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the map context
const mockMapInstance = {
  unproject: vi.fn().mockReturnValue({ lng: 4.3517, lat: 50.8503 }),
};

vi.mock('@/contexts/map-context', () => ({
  useMapContext: () => mockMapInstance,
}));

import { MapContextMenu } from '@/components/map-context-menu';

describe('Map Context Menu', () => {
  const mockOnSetOrigin = vi.fn();
  const mockOnSetDestination = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render children without context menu initially', () => {
      render(
        <MapContextMenu
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
        >
          <div data-testid="map-content">Map Content</div>
        </MapContextMenu>
      );

      expect(screen.getByTestId('map-content')).toBeInTheDocument();
      expect(screen.queryByTestId('map-context-menu')).not.toBeInTheDocument();
    });

    it('should have the correct test id on trigger', () => {
      render(
        <MapContextMenu
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
        >
          <div data-testid="map-content">Map Content</div>
        </MapContextMenu>
      );

      expect(screen.getByTestId('map-context-trigger')).toBeInTheDocument();
    });
  });

  describe('Context menu interaction', () => {
    it('should handle context menu trigger correctly', () => {
      render(
        <MapContextMenu
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
        >
          <div data-testid="map-content">
            <div data-testid="map-container">Map Content</div>
          </div>
        </MapContextMenu>
      );

      const trigger = screen.getByTestId('map-context-trigger');
      
      // Should not throw error when right-clicking
      expect(() => {
        fireEvent.contextMenu(trigger);
      }).not.toThrow();
    });

    it('should set up event listener for context menu', () => {
      const addEventListenerSpy = vi.spyOn(HTMLDivElement.prototype, 'addEventListener');
      
      render(
        <MapContextMenu
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
        >
          <div data-testid="map-content">
            <div data-testid="map-container">Map Content</div>
          </div>
        </MapContextMenu>
      );

      expect(addEventListenerSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });
  });

  describe('Coordinate handling', () => {
    it('should store coordinates when context menu is triggered', () => {
      const mockGetBoundingClientRect = vi.fn().mockReturnValue({
        left: 100,
        top: 50,
        width: 400,
        height: 300,
      });

      render(
        <MapContextMenu
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
        >
          <div data-testid="map-content">
            <div 
              data-testid="map-container"
              ref={(el) => {
                if (el) {
                  el.getBoundingClientRect = mockGetBoundingClientRect;
                }
              }}
            >
              Map Content
            </div>
          </div>
        </MapContextMenu>
      );

      const trigger = screen.getByTestId('map-context-trigger');
      fireEvent.contextMenu(trigger, { clientX: 200, clientY: 150 });

      // Verify map.unproject was called with correct pixel coordinates
      expect(mockMapInstance.unproject).toHaveBeenCalledWith([100, 100]);
    });

    it('should handle missing map container gracefully', () => {
      render(
        <MapContextMenu
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
        >
          <div data-testid="map-content">Map Content Without Container</div>
        </MapContextMenu>
      );

      const trigger = screen.getByTestId('map-context-trigger');
      
      // Should not throw error even without map container
      expect(() => {
        fireEvent.contextMenu(trigger);
      }).not.toThrow();
    });
  });

  describe('Map integration', () => {
    it('should handle context menu when map is not available', () => {
      // Create a component with no map context
      const MapContextMenuNoMap = () => {
        return (
          <MapContextMenu
            onSetOrigin={mockOnSetOrigin}
            onSetDestination={mockOnSetDestination}
          >
            <div data-testid="map-content">Map Content</div>
          </MapContextMenu>
        );
      };

      // Mock useMapContext to return null
      vi.doMock('@/contexts/map-context', () => ({
        useMapContext: () => null,
      }));

      render(<MapContextMenuNoMap />);

      const trigger = screen.getByTestId('map-context-trigger');
      
      // Should not throw error when map is not available
      expect(() => {
        fireEvent.contextMenu(trigger);
      }).not.toThrow();
    });
  });
});