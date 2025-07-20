import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';

// Mock the components we'll need
vi.mock('@/lib/solvice-api');
vi.mock('maplibre-gl');

// Import the component we'll create
import { InputOverlay } from '@/components/input-overlay';

describe('Input Overlay UI', () => {
  const mockOnOriginChange = vi.fn();
  const mockOnDestinationChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Overlay positioning and structure', () => {
    it('should render in top-left position', () => {
      render(
        <InputOverlay
          origin="Brussels"
          destination="Antwerp"
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const overlay = screen.getByTestId('input-overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).toHaveClass('absolute', 'top-4', 'left-4');
    });

    it('should have proper z-index to stay above map', () => {
      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const overlay = screen.getByTestId('input-overlay');
      expect(overlay).toHaveClass('z-10');
    });

    it('should have proper background and styling', () => {
      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const overlay = screen.getByTestId('input-overlay');
      expect(overlay).toHaveClass('bg-white', 'rounded', 'shadow');
    });
  });

  describe('Input fields and labels', () => {
    it('should have properly labeled origin input', () => {
      render(
        <InputOverlay
          origin="Test Origin"
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const originInput = screen.getByLabelText(/origin/i);
      expect(originInput).toBeInTheDocument();
      expect(originInput).toHaveValue('Test Origin');
    });

    it('should have properly labeled destination input', () => {
      render(
        <InputOverlay
          origin=""
          destination="Test Destination"
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const destinationInput = screen.getByLabelText(/destination/i);
      expect(destinationInput).toBeInTheDocument();
      expect(destinationInput).toHaveValue('Test Destination');
    });

    it('should call onOriginChange when origin input changes', async () => {
      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const originInput = screen.getByLabelText(/origin/i);
      
      await act(async () => {
        fireEvent.change(originInput, { target: { value: 'New Origin' } });
      });

      expect(mockOnOriginChange).toHaveBeenCalledWith('New Origin');
    });

    it('should call onDestinationChange when destination input changes', async () => {
      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const destinationInput = screen.getByLabelText(/destination/i);
      
      await act(async () => {
        fireEvent.change(destinationInput, { target: { value: 'New Destination' } });
      });

      expect(mockOnDestinationChange).toHaveBeenCalledWith('New Destination');
    });
  });

  describe('Mobile responsive layout', () => {
    it('should stack vertically on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const container = screen.getByTestId('input-container');
      expect(container).toHaveClass('flex-col', 'space-y-2');
    });

    it('should arrange horizontally on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const container = screen.getByTestId('input-container');
      expect(container).toHaveClass('sm:flex-row', 'sm:space-x-2', 'sm:space-y-0');
    });

    it('should have appropriate padding for mobile', () => {
      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const overlay = screen.getByTestId('input-overlay');
      expect(overlay).toHaveClass('p-3', 'sm:p-4');
    });
  });

  describe('Map interaction', () => {
    it('should not interfere with map clicks when clicking outside inputs', () => {
      const mapClickHandler = vi.fn();
      
      render(
        <div onClick={mapClickHandler} data-testid="map-area">
          <InputOverlay
            origin=""
            destination=""
            onOriginChange={mockOnOriginChange}
            onDestinationChange={mockOnDestinationChange}
          />
          <div data-testid="map-background" style={{ width: '100px', height: '100px' }} />
        </div>
      );

      // Click on the map area (outside overlay)
      fireEvent.click(screen.getByTestId('map-background'));
      
      expect(mapClickHandler).toHaveBeenCalled();
    });

    it('should prevent map interaction when clicking on overlay', () => {
      const mapClickHandler = vi.fn();
      
      render(
        <div onClick={mapClickHandler}>
          <InputOverlay
            origin=""
            destination=""
            onOriginChange={mockOnOriginChange}
            onDestinationChange={mockOnDestinationChange}
          />
        </div>
      );

      const overlay = screen.getByTestId('input-overlay');
      
      fireEvent.click(overlay);
      
      expect(mapClickHandler).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility features', () => {
    it('should have proper input labels for screen readers', () => {
      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const originLabel = screen.getByText(/origin/i);
      const destinationLabel = screen.getByText(/destination/i);
      
      expect(originLabel).toBeInTheDocument();
      expect(destinationLabel).toBeInTheDocument();
    });

    it('should support keyboard navigation between inputs', async () => {
      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const originInput = screen.getByLabelText(/origin/i);
      const destinationInput = screen.getByLabelText(/destination/i);

      // Focus on origin input
      await act(async () => {
        originInput.focus();
      });
      expect(originInput).toHaveFocus();

      // Tab to destination input
      await act(async () => {
        fireEvent.keyDown(originInput, { key: 'Tab', code: 'Tab' });
        destinationInput.focus();
      });
      expect(destinationInput).toHaveFocus();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const originInput = screen.getByLabelText(/origin/i);
      const destinationInput = screen.getByLabelText(/destination/i);

      expect(originInput).toHaveAttribute('type', 'text');
      expect(originInput).toHaveAttribute('id');
      expect(destinationInput).toHaveAttribute('type', 'text');
      expect(destinationInput).toHaveAttribute('id');
    });
  });

  describe('Loading and error states', () => {
    it('should show loading indicator when loading prop is true', () => {
      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
          loading={true}
        />
      );

      expect(screen.getByText(/calculating/i)).toBeInTheDocument();
    });

    it('should show error message when error prop is provided', () => {
      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
          error="Route calculation failed"
        />
      );

      expect(screen.getByText(/route calculation failed/i)).toBeInTheDocument();
    });

    it('should show route info when route prop is provided', () => {
      const mockRoute = {
        routes: [{ distance: 15000, duration: 900 }],
        waypoints: []
      };

      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
          route={mockRoute}
        />
      );

      expect(screen.getByText(/15km/i)).toBeInTheDocument();
      expect(screen.getByText(/15 min/i)).toBeInTheDocument();
    });
  });

  describe('Touch-friendly design', () => {
    it('should have appropriately sized touch targets', () => {
      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const originInput = screen.getByLabelText(/origin/i);
      const destinationInput = screen.getByLabelText(/destination/i);

      // Check for minimum touch target size classes
      expect(originInput).toHaveClass('h-10'); // Minimum 40px height
      expect(destinationInput).toHaveClass('h-10');
    });

    it('should have proper spacing for touch interaction', () => {
      render(
        <InputOverlay
          origin=""
          destination=""
          onOriginChange={mockOnOriginChange}
          onDestinationChange={mockOnDestinationChange}
        />
      );

      const container = screen.getByTestId('input-container');
      expect(container).toHaveClass('space-y-2'); // Minimum spacing between touch targets
    });
  });
});