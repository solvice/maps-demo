import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock MapLibre GL
const mockMapInstance = {
  on: vi.fn(),
  off: vi.fn(),
  remove: vi.fn(),
  resize: vi.fn(),
  setCenter: vi.fn(),
  getCanvasContainer: vi.fn().mockReturnValue({ oncontextmenu: null }),
};

vi.mock('maplibre-gl', () => ({
  default: {
    Map: vi.fn().mockImplementation(() => mockMapInstance),
  },
}));

import { MapWithContextMenu } from '@/components/map-with-context-menu';

describe('MapWithContextMenu', () => {
  const mockOnClick = vi.fn();
  const mockOnSetOrigin = vi.fn();
  const mockOnSetDestination = vi.fn();
  const mockOnLoad = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render map container', () => {
      render(
        <MapWithContextMenu
          onClick={mockOnClick}
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
        />
      );

      expect(screen.getByTestId('map-container')).toBeInTheDocument();
    });

    it('should not show context menu initially', () => {
      render(
        <MapWithContextMenu
          onClick={mockOnClick}
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
        />
      );

      expect(screen.queryByTestId('map-context-menu')).not.toBeInTheDocument();
    });
  });

  describe('Map initialization', () => {
    it('should set up event listeners on map load', () => {
      render(
        <MapWithContextMenu
          onClick={mockOnClick}
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
          onLoad={mockOnLoad}
        />
      );

      // Verify event listeners are set up
      expect(mockMapInstance.on).toHaveBeenCalledWith('load', expect.any(Function));
      expect(mockMapInstance.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockMapInstance.on).toHaveBeenCalledWith('click', expect.any(Function));
      expect(mockMapInstance.on).toHaveBeenCalledWith('contextmenu', expect.any(Function));
    });

    it('should call onLoad when map loads', () => {
      render(
        <MapWithContextMenu
          onClick={mockOnClick}
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
          onLoad={mockOnLoad}
        />
      );

      // Find and call the load event handler
      const loadHandler = mockMapInstance.on.mock.calls.find(call => call[0] === 'load')?.[1];
      if (loadHandler) {
        loadHandler();
      }

      expect(mockOnLoad).toHaveBeenCalledWith(mockMapInstance);
    });
  });

  describe('Context menu functionality', () => {
    it('should show context menu on simulated right-click', async () => {
      render(
        <MapWithContextMenu
          onClick={mockOnClick}
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
        />
      );

      // Simulate map load
      const loadHandler = mockMapInstance.on.mock.calls.find(call => call[0] === 'load')?.[1];
      if (loadHandler) loadHandler();

      // Simulate context menu event
      const contextMenuHandler = mockMapInstance.on.mock.calls.find(call => call[0] === 'contextmenu')?.[1];
      if (contextMenuHandler) {
        contextMenuHandler({
          preventDefault: vi.fn(),
          lngLat: { lng: 4.3517, lat: 50.8503 },
          point: { x: 200, y: 150 },
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('map-context-menu')).toBeInTheDocument();
      });

      expect(screen.getByTestId('context-from-here')).toBeInTheDocument();
      expect(screen.getByTestId('context-to-here')).toBeInTheDocument();
    });

    it('should call onSetOrigin when "from here" is clicked', async () => {
      render(
        <MapWithContextMenu
          onClick={mockOnClick}
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
        />
      );

      // Simulate map load and context menu
      const loadHandler = mockMapInstance.on.mock.calls.find(call => call[0] === 'load')?.[1];
      if (loadHandler) loadHandler();

      const contextMenuHandler = mockMapInstance.on.mock.calls.find(call => call[0] === 'contextmenu')?.[1];
      if (contextMenuHandler) {
        contextMenuHandler({
          preventDefault: vi.fn(),
          lngLat: { lng: 4.3517, lat: 50.8503 },
          point: { x: 200, y: 150 },
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('map-context-menu')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('context-from-here'));

      expect(mockOnSetOrigin).toHaveBeenCalledWith([4.3517, 50.8503]);
    });

    it('should call onSetDestination when "to here" is clicked', async () => {
      render(
        <MapWithContextMenu
          onClick={mockOnClick}
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
        />
      );

      // Simulate map load and context menu
      const loadHandler = mockMapInstance.on.mock.calls.find(call => call[0] === 'load')?.[1];
      if (loadHandler) loadHandler();

      const contextMenuHandler = mockMapInstance.on.mock.calls.find(call => call[0] === 'contextmenu')?.[1];
      if (contextMenuHandler) {
        contextMenuHandler({
          preventDefault: vi.fn(),
          lngLat: { lng: 4.3517, lat: 50.8503 },
          point: { x: 200, y: 150 },
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('map-context-menu')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('context-to-here'));

      expect(mockOnSetDestination).toHaveBeenCalledWith([4.3517, 50.8503]);
    });

    it('should hide context menu when clicking outside', async () => {
      render(
        <MapWithContextMenu
          onClick={mockOnClick}
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
        />
      );

      // Simulate map load and context menu
      const loadHandler = mockMapInstance.on.mock.calls.find(call => call[0] === 'load')?.[1];
      if (loadHandler) loadHandler();

      const contextMenuHandler = mockMapInstance.on.mock.calls.find(call => call[0] === 'contextmenu')?.[1];
      if (contextMenuHandler) {
        contextMenuHandler({
          preventDefault: vi.fn(),
          lngLat: { lng: 4.3517, lat: 50.8503 },
          point: { x: 200, y: 150 },
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('map-context-menu')).toBeInTheDocument();
      });

      // Click outside
      fireEvent.click(document.body);

      await waitFor(() => {
        expect(screen.queryByTestId('map-context-menu')).not.toBeInTheDocument();
      });
    });
  });

  describe('Regular click functionality', () => {
    it('should call onClick when map is clicked', () => {
      render(
        <MapWithContextMenu
          onClick={mockOnClick}
          onSetOrigin={mockOnSetOrigin}
          onSetDestination={mockOnSetDestination}
        />
      );

      // Simulate click event
      const clickHandler = mockMapInstance.on.mock.calls.find(call => call[0] === 'click')?.[1];
      if (clickHandler) {
        clickHandler({
          lngLat: { lng: 4.3517, lat: 50.8503 },
        });
      }

      expect(mockOnClick).toHaveBeenCalledWith([4.3517, 50.8503]);
    });
  });
});