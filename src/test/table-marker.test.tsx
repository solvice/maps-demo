import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TableMarker } from '@/components/table-marker';
import { mockToast, createMapContextMock } from './utils/table-test-utils';
import { testCoordinates } from './fixtures/table-api-responses';

// Test fails - need to write component first
describe('TableMarker Component', () => {
  const defaultProps = {
    coordinate: testCoordinates.ghentBrussels[0],
    index: 0,
    isSelected: false,
    map: createMapContextMock(),
    onMarkerClick: vi.fn(),
    onMarkerDrag: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      // TDD: Write failing test first
      expect(() => {
        render(<TableMarker {...defaultProps} />);
      }).not.toThrow();
    });

    it('should create a marker on the map', () => {
      render(<TableMarker {...defaultProps} />);
      
      // Verify marker was added to map
      expect(defaultProps.map._getMarkers().length).toBe(1);
    });

    it('should position marker at correct coordinates', () => {
      const testCoord = [3.7174, 51.0543];
      render(
        <TableMarker 
          {...defaultProps} 
          coordinate={testCoord}
        />
      );
      
      const markers = defaultProps.map._getMarkers();
      expect(markers[0].setLngLat).toHaveBeenCalledWith(testCoord);
    });

    it('should display marker index as label', () => {
      render(
        <TableMarker 
          {...defaultProps} 
          index={2}
        />
      );
      
      // Check marker element contains index
      const markerElement = defaultProps.map._getMarkers()[0].getElement();
      expect(markerElement.textContent).toContain('3'); // 1-based index
    });
  });

  describe('Selection States', () => {
    it('should apply selected styling when isSelected is true', () => {
      render(
        <TableMarker 
          {...defaultProps} 
          isSelected={true}
        />
      );
      
      const markerElement = defaultProps.map._getMarkers()[0].getElement();
      expect(markerElement).toHaveClass('selected');
    });

    it('should apply default styling when isSelected is false', () => {
      render(
        <TableMarker 
          {...defaultProps} 
          isSelected={false}
        />
      );
      
      const markerElement = defaultProps.map._getMarkers()[0].getElement();
      expect(markerElement).not.toHaveClass('selected');
    });

    it('should update styling when isSelected prop changes', () => {
      const { rerender } = render(
        <TableMarker 
          {...defaultProps} 
          isSelected={false}
        />
      );
      
      const markerElement = defaultProps.map._getMarkers()[0].getElement();
      expect(markerElement).not.toHaveClass('selected');
      
      rerender(
        <TableMarker 
          {...defaultProps} 
          isSelected={true}
        />
      );
      
      expect(markerElement).toHaveClass('selected');
    });
  });

  describe('Interaction Handling', () => {
    it('should call onMarkerClick when marker is clicked', () => {
      const onMarkerClick = vi.fn();
      render(
        <TableMarker 
          {...defaultProps} 
          onMarkerClick={onMarkerClick}
        />
      );
      
      const marker = defaultProps.map._getMarkers()[0];
      
      // Simulate marker click
      const clickHandlers = marker.on.mock.calls
        .filter(call => call[0] === 'click')
        .map(call => call[1]);
      
      expect(clickHandlers.length).toBe(1);
      
      // Trigger click handler
      clickHandlers[0]();
      
      expect(onMarkerClick).toHaveBeenCalledWith(defaultProps.index);
    });

    it('should call onMarkerDrag when marker is dragged', async () => {
      const onMarkerDrag = vi.fn();
      render(
        <TableMarker 
          {...defaultProps} 
          onMarkerDrag={onMarkerDrag}
        />
      );
      
      const marker = defaultProps.map._getMarkers()[0];
      
      // Simulate dragend event
      const dragHandlers = marker.on.mock.calls
        .filter(call => call[0] === 'dragend')
        .map(call => call[1]);
      
      expect(dragHandlers.length).toBe(1);
      
      const newCoordinates = [4.0, 52.0];
      const mockEvent = {
        target: {
          getLngLat: () => ({ lng: newCoordinates[0], lat: newCoordinates[1] })
        }
      };
      
      dragHandlers[0](mockEvent);
      
      expect(onMarkerDrag).toHaveBeenCalledWith(defaultProps.index, newCoordinates);
    });

    it('should enable dragging by default', () => {
      render(<TableMarker {...defaultProps} />);
      
      const marker = defaultProps.map._getMarkers()[0];
      expect(marker.setDraggable).toHaveBeenCalledWith(true);
    });

    it('should support hover events', () => {
      render(<TableMarker {...defaultProps} />);
      
      const marker = defaultProps.map._getMarkers()[0];
      
      // Check for mouseenter and mouseleave handlers
      const hoverHandlers = marker.on.mock.calls
        .filter(call => ['mouseenter', 'mouseleave'].includes(call[0]));
      
      expect(hoverHandlers.length).toBe(2);
    });
  });

  describe('Coordinate Updates', () => {
    it('should update marker position when coordinate prop changes', () => {
      const initialCoord = [3.7174, 51.0543];
      const { rerender } = render(
        <TableMarker 
          {...defaultProps} 
          coordinate={initialCoord}
        />
      );
      
      const marker = defaultProps.map._getMarkers()[0];
      expect(marker.setLngLat).toHaveBeenCalledWith(initialCoord);
      
      const newCoord = [4.3517, 50.8476];
      rerender(
        <TableMarker 
          {...defaultProps} 
          coordinate={newCoord}
        />
      );
      
      expect(marker.setLngLat).toHaveBeenCalledWith(newCoord);
    });

    it('should handle invalid coordinates gracefully', () => {
      expect(() => {
        render(
          <TableMarker 
            {...defaultProps} 
            coordinate={null as any}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should remove marker from map on unmount', () => {
      const { unmount } = render(<TableMarker {...defaultProps} />);
      
      expect(defaultProps.map._getMarkers().length).toBe(1);
      
      unmount();
      
      expect(defaultProps.map._getMarkers().length).toBe(0);
    });

    it('should remove all event listeners on unmount', () => {
      const { unmount } = render(<TableMarker {...defaultProps} />);
      
      const marker = defaultProps.map._getMarkers()[0];
      
      unmount();
      
      // Verify remove was called on marker
      expect(marker.remove).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <TableMarker 
          {...defaultProps} 
          index={1}
        />
      );
      
      const markerElement = defaultProps.map._getMarkers()[0].getElement();
      expect(markerElement).toHaveAttribute('role', 'button');
      expect(markerElement).toHaveAttribute('aria-label');
      expect(markerElement.getAttribute('aria-label')).toContain('Marker 2'); // 1-based
    });

    it('should support keyboard navigation', () => {
      render(<TableMarker {...defaultProps} />);
      
      const markerElement = defaultProps.map._getMarkers()[0].getElement();
      expect(markerElement).toHaveAttribute('tabindex', '0');
    });

    it('should handle keyboard events', () => {
      const onMarkerClick = vi.fn();
      render(
        <TableMarker 
          {...defaultProps} 
          onMarkerClick={onMarkerClick}
        />
      );
      
      const markerElement = defaultProps.map._getMarkers()[0].getElement();
      
      // Simulate Enter key press
      fireEvent.keyDown(markerElement, { key: 'Enter' });
      expect(onMarkerClick).toHaveBeenCalledWith(defaultProps.index);
      
      // Simulate Space key press
      fireEvent.keyDown(markerElement, { key: ' ' });
      expect(onMarkerClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing map prop gracefully', () => {
      expect(() => {
        render(
          <TableMarker 
            {...defaultProps} 
            map={null as any}
          />
        );
      }).not.toThrow();
    });

    it('should handle missing event handlers gracefully', () => {
      expect(() => {
        render(
          <TableMarker 
            {...defaultProps} 
            onMarkerClick={undefined as any}
            onMarkerDrag={undefined as any}
          />
        );
      }).not.toThrow();
    });

    it('should recover from coordinate update errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const { rerender } = render(<TableMarker {...defaultProps} />);
      
      // Try to update with invalid coordinates
      rerender(
        <TableMarker 
          {...defaultProps} 
          coordinate={[NaN, NaN]}
        />
      );
      
      // Component should not crash
      expect(defaultProps.map._getMarkers().length).toBe(1);
      
      consoleSpy.mockRestore();
    });
  });
});