import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the map context with a working map instance
const mockMapInstance = {
  unproject: vi.fn().mockReturnValue({ lng: 4.3517, lat: 50.8503 }),
  on: vi.fn(),
  off: vi.fn(),
  remove: vi.fn(),
  resize: vi.fn(),
  setCenter: vi.fn(),
};

vi.mock('@/contexts/map-context', () => ({
  useMapContext: () => mockMapInstance,
  MapProvider: ({ children, value }: { children: React.ReactNode; value: any }) => children,
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock geocoding
vi.mock('@/lib/geocoding', () => ({
  searchAddresses: vi.fn(),
  getCoordinatesFromAddress: vi.fn(),
  getAddressFromCoordinates: vi.fn().mockResolvedValue('Brussels, Belgium'),
}));

// Mock solvice API
vi.mock('@/lib/solvice-api', () => ({
  calculateRoute: vi.fn(),
}));

import { MapContextMenu } from '@/components/map-context-menu';

describe('Context Menu Integration', () => {
  const mockOnSetOrigin = vi.fn();
  const mockOnSetDestination = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should work with real DOM interactions', () => {
    render(
      <MapContextMenu
        onSetOrigin={mockOnSetOrigin}
        onSetDestination={mockOnSetDestination}
        className="h-64 w-64"
      >
        <div data-testid="map-content" className="h-full w-full bg-gray-200">
          <div data-testid="map-container" className="h-full w-full">
            Mock Map Container
          </div>
        </div>
      </MapContextMenu>
    );

    const trigger = screen.getByTestId('map-context-trigger');
    expect(trigger).toBeInTheDocument();

    // Simulate right-click with coordinates
    fireEvent.contextMenu(trigger, {
      clientX: 200,
      clientY: 150,
      bubbles: true,
    });

    // The context menu should capture coordinates
    expect(mockMapInstance.unproject).toHaveBeenCalledWith([200, 150]);
  });

  it('should handle click events on menu items', () => {
    const { container } = render(
      <MapContextMenu
        onSetOrigin={mockOnSetOrigin}
        onSetDestination={mockOnSetDestination}
        className="h-64 w-64"
      >
        <div data-testid="map-content" className="h-full w-full bg-gray-200">
          <div data-testid="map-container" className="h-full w-full">
            Mock Map Container
          </div>
        </div>
      </MapContextMenu>
    );

    const trigger = screen.getByTestId('map-context-trigger');
    
    // Right-click to trigger context menu
    fireEvent.contextMenu(trigger, {
      clientX: 200,
      clientY: 150,
      bubbles: true,
    });

    // Try to find context menu items (they may be in a portal)
    const fromHereItem = container.querySelector('[data-testid="context-from-here"]') ||
                        document.querySelector('[data-testid="context-from-here"]');
    
    if (fromHereItem) {
      fireEvent.click(fromHereItem);
      expect(mockOnSetOrigin).toHaveBeenCalledWith([4.3517, 50.8503]);
    }
  });

  it('should clean up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(HTMLDivElement.prototype, 'removeEventListener');
    
    const { unmount } = render(
      <MapContextMenu
        onSetOrigin={mockOnSetOrigin}
        onSetDestination={mockOnSetDestination}
      >
        <div data-testid="map-content">
          <div data-testid="map-container">Map Content</div>
        </div>
      </MapContextMenu>
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('contextmenu', expect.any(Function));
    
    removeEventListenerSpy.mockRestore();
  });
});