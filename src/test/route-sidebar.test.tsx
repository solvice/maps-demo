import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock dependencies
vi.mock('@/lib/solvice-api');
vi.mock('@/lib/geocoding');

import { RouteSidebar } from '@/components/route-sidebar';
import { RouteResponse } from '@/lib/solvice-api';

describe('Route Details Sidebar', () => {
  const mockRoute: RouteResponse = {
    routes: [{
      distance: 15000, // 15km
      duration: 1200, // 20 minutes
      geometry: 'mockPolylineString',
      legs: [{
        distance: 15000,
        duration: 1200,
        summary: 'Main route segment'
      }]
    }],
    waypoints: [
      { location: [4.3517, 50.8503], name: 'Brussels, Belgium' },
      { location: [4.4025, 51.2194], name: 'Antwerp, Belgium' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sidebar visibility and layout', () => {
    it('should display when route is calculated', () => {
      render(<RouteSidebar route={mockRoute} />);
      
      expect(screen.getByTestId('route-sidebar')).toBeInTheDocument();
      expect(screen.getByText(/route details/i)).toBeInTheDocument();
    });

    it('should not display when route is null', () => {
      render(<RouteSidebar route={null} />);
      
      expect(screen.queryByTestId('route-sidebar')).not.toBeInTheDocument();
    });

    it('should not display when route has no routes', () => {
      const emptyRoute: RouteResponse = {
        routes: [],
        waypoints: []
      };
      
      render(<RouteSidebar route={emptyRoute} />);
      
      expect(screen.queryByTestId('route-sidebar')).not.toBeInTheDocument();
    });

    it('should have proper responsive positioning', () => {
      render(<RouteSidebar route={mockRoute} />);
      
      const sidebar = screen.getByTestId('route-sidebar');
      expect(sidebar).toHaveClass('absolute', 'top-4', 'right-4');
      expect(sidebar).toHaveClass('sm:w-80'); // Responsive width on desktop
    });

    it('should be properly styled with background and shadow', () => {
      render(<RouteSidebar route={mockRoute} />);
      
      const sidebar = screen.getByTestId('route-sidebar');
      expect(sidebar).toHaveClass('bg-white', 'rounded', 'shadow-lg');
    });
  });

  describe('Distance and time formatting', () => {
    it('should display distance in kilometers correctly', () => {
      render(<RouteSidebar route={mockRoute} />);
      
      expect(screen.getByText('15.0 km')).toBeInTheDocument();
    });

    it('should display time in minutes for short durations', () => {
      render(<RouteSidebar route={mockRoute} />);
      
      expect(screen.getByText('20 min')).toBeInTheDocument();
    });

    it('should display time in hours and minutes for long durations', () => {
      const longRoute: RouteResponse = {
        routes: [{
          distance: 150000,
          duration: 7200, // 2 hours
          geometry: 'mockPolylineString'
        }],
        waypoints: []
      };
      
      render(<RouteSidebar route={longRoute} />);
      
      expect(screen.getByText('2h 0min')).toBeInTheDocument();
    });

    it('should handle mixed hours and minutes correctly', () => {
      const mixedRoute: RouteResponse = {
        routes: [{
          distance: 120000,
          duration: 5430, // 1 hour 30.5 minutes
          geometry: 'mockPolylineString'
        }],
        waypoints: []
      };
      
      render(<RouteSidebar route={mixedRoute} />);
      
      expect(screen.getByText('1h 31min')).toBeInTheDocument();
    });

    it('should handle very short distances correctly', () => {
      const shortRoute: RouteResponse = {
        routes: [{
          distance: 500, // 0.5km
          duration: 60,
          geometry: 'mockPolylineString'
        }],
        waypoints: []
      };
      
      render(<RouteSidebar route={shortRoute} />);
      
      expect(screen.getByText('0.5 km')).toBeInTheDocument();
    });
  });

  describe('Responsive behavior', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<RouteSidebar route={mockRoute} />);
      
      const sidebar = screen.getByTestId('route-sidebar');
      expect(sidebar).toHaveClass('sm:w-80'); // Responsive width
    });

    it('should position differently on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<RouteSidebar route={mockRoute} />);
      
      const sidebar = screen.getByTestId('route-sidebar');
      // Should be positioned at bottom on mobile
      expect(sidebar).toHaveClass('bottom-4', 'left-4', 'right-4');
    });
  });

  describe('Loading and empty states', () => {
    it('should show loading state when loading prop is true', () => {
      render(<RouteSidebar route={null} loading={true} />);
      
      expect(screen.getByTestId('route-sidebar-loading')).toBeInTheDocument();
      expect(screen.getByText(/calculating route/i)).toBeInTheDocument();
    });

    it('should show loading skeleton content', () => {
      render(<RouteSidebar route={null} loading={true} />);
      
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    });

    it('should handle empty route data gracefully', () => {
      const emptyRoute: RouteResponse = {
        routes: [{}], // Empty route object
        waypoints: []
      };
      
      render(<RouteSidebar route={emptyRoute} />);
      
      expect(screen.getByText(/no route data available/i)).toBeInTheDocument();
    });
  });

  describe('Route updates and transitions', () => {
    it('should update when route data changes', () => {
      const { rerender } = render(<RouteSidebar route={mockRoute} />);
      
      expect(screen.getByText('15.0 km')).toBeInTheDocument();
      
      const newRoute: RouteResponse = {
        routes: [{
          distance: 25000,
          duration: 1800,
          geometry: 'newPolylineString'
        }],
        waypoints: []
      };
      
      rerender(<RouteSidebar route={newRoute} />);
      
      expect(screen.getByText('25.0 km')).toBeInTheDocument();
      expect(screen.getByText('30 min')).toBeInTheDocument();
    });

    it('should handle transitions smoothly', () => {
      const { rerender } = render(<RouteSidebar route={null} />);
      
      expect(screen.queryByTestId('route-sidebar')).not.toBeInTheDocument();
      
      rerender(<RouteSidebar route={mockRoute} />);
      
      expect(screen.getByTestId('route-sidebar')).toBeInTheDocument();
    });
  });

  describe('Additional route information', () => {
    it('should display waypoint information when available', () => {
      render(<RouteSidebar route={mockRoute} />);
      
      expect(screen.getByText(/brussels/i)).toBeInTheDocument();
      expect(screen.getByText(/antwerp/i)).toBeInTheDocument();
    });

    it('should show route summary when available', () => {
      const routeWithSummary: RouteResponse = {
        routes: [{
          distance: 15000,
          duration: 1200,
          geometry: 'mockPolylineString',
          legs: [{
            distance: 15000,
            duration: 1200,
            summary: 'Via A1 Highway'
          }]
        }],
        waypoints: []
      };
      
      render(<RouteSidebar route={routeWithSummary} />);
      
      expect(screen.getByText(/via a1 highway/i)).toBeInTheDocument();
    });

    it('should handle missing optional data gracefully', () => {
      const minimalRoute: RouteResponse = {
        routes: [{
          distance: 15000,
          duration: 1200,
          geometry: 'mockPolylineString'
        }],
        waypoints: []
      };
      
      render(<RouteSidebar route={minimalRoute} />);
      
      // Should still display basic info
      expect(screen.getByText('15.0 km')).toBeInTheDocument();
      expect(screen.getByText('20 min')).toBeInTheDocument();
    });
  });

  describe('Interactive features', () => {
    it('should be closable with close button', () => {
      const mockOnClose = vi.fn();
      render(<RouteSidebar route={mockRoute} onClose={mockOnClose} />);
      
      const closeButton = screen.getByTestId('close-sidebar');
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should prevent map interaction when clicking on sidebar', () => {
      const mockMapClick = vi.fn();
      
      render(
        <div onClick={mockMapClick}>
          <RouteSidebar route={mockRoute} />
        </div>
      );
      
      const sidebar = screen.getByTestId('route-sidebar');
      fireEvent.click(sidebar);
      
      expect(mockMapClick).not.toHaveBeenCalled();
    });

    it('should support keyboard navigation', () => {
      const mockOnClose = vi.fn();
      render(<RouteSidebar route={mockRoute} onClose={mockOnClose} />);
      
      const closeButton = screen.getByTestId('close-sidebar');
      
      // Should be focusable
      closeButton.focus();
      expect(closeButton).toHaveFocus();
      
      // Should close on Enter key
      fireEvent.keyDown(closeButton, { key: 'Enter', code: 'Enter' });
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility features', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<RouteSidebar route={mockRoute} />);
      
      const sidebar = screen.getByTestId('route-sidebar');
      expect(sidebar).toHaveAttribute('role', 'region');
      expect(sidebar).toHaveAttribute('aria-label', 'Route information');
    });

    it('should have accessible close button', () => {
      const mockOnClose = vi.fn();
      render(<RouteSidebar route={mockRoute} onClose={mockOnClose} />);
      
      const closeButton = screen.getByTestId('close-sidebar');
      expect(closeButton).toHaveAttribute('aria-label', 'Close route details');
    });

    it('should announce route changes to screen readers', () => {
      render(<RouteSidebar route={mockRoute} />);
      
      const sidebar = screen.getByTestId('route-sidebar');
      expect(sidebar).toHaveAttribute('aria-live', 'polite');
    });
  });
});