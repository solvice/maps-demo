import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouteControlPanel } from '@/components/route-control-panel';
import { RouteResponse } from '@/lib/solvice-api';

// Mock the autocomplete input component
vi.mock('@/components/autocomplete-input', () => ({
  AutocompleteInput: ({ placeholder, value }: { placeholder: string; value: string }) => (
    <input placeholder={placeholder} value={value} readOnly />
  )
}));

describe('RouteControlPanel - Traffic Comparison', () => {
  const mockRegularRoute: RouteResponse = {
    code: 'Ok',
    routes: [{
      distance: 55000,
      duration: 1380, // 23 minutes
      geometry: 'regular_polyline',
      weight: 100,
      weight_name: 'routability',
      legs: []
    }],
    waypoints: []
  };

  const mockTrafficRoute: RouteResponse = {
    code: 'Ok',
    routes: [{
      distance: 55000,
      duration: 1560, // 26 minutes (+3 minutes traffic delay)
      geometry: 'traffic_polyline',
      weight: 100,
      weight_name: 'routability',
      legs: []
    }],
    waypoints: []
  };

  const defaultProps = {
    origin: 'Origin Address',
    destination: 'Destination Address',
    onOriginChange: vi.fn(),
    onDestinationChange: vi.fn(),
    onOriginSelect: vi.fn(),
    onDestinationSelect: vi.fn(),
    vehicleType: 'CAR' as const,
    onVehicleTypeChange: vi.fn(),
    routeConfig: {},
    onRouteConfigChange: vi.fn(),
    route: null,
    loading: false,
    error: null,
  };

  describe('Traffic comparison display', () => {
    it('should display traffic comparison when both regular and traffic routes are available', () => {
      render(
        <RouteControlPanel
          {...defaultProps}
          route={mockRegularRoute}
          trafficRoute={mockTrafficRoute}
        />
      );

      expect(screen.getByTestId('route-info')).toBeInTheDocument();
      expect(screen.getByText('23 min')).toBeInTheDocument(); // Regular duration
      expect(screen.getByText('With traffic: 26 min')).toBeInTheDocument(); // Traffic duration
      expect(screen.getByText('+3 min')).toBeInTheDocument(); // Traffic difference
    });

    it('should highlight traffic delay with appropriate styling', () => {
      render(
        <RouteControlPanel
          {...defaultProps}
          route={mockRegularRoute}
          trafficRoute={mockTrafficRoute}
        />
      );

      const trafficDifference = screen.getByTestId('traffic-difference');
      expect(trafficDifference).toBeInTheDocument();
      expect(trafficDifference).toHaveClass('text-yellow-600'); // Delay styling
      expect(trafficDifference.textContent).toBe('+3 min');
    });

    it('should show "No delay" for same duration routes', () => {
      const sameTrafficRoute = {
        ...mockTrafficRoute,
        routes: [{ ...mockTrafficRoute.routes[0], duration: 1380 }] // Same as regular
      };

      render(
        <RouteControlPanel
          {...defaultProps}
          route={mockRegularRoute}
          trafficRoute={sameTrafficRoute}
        />
      );

      expect(screen.getByText('No delay')).toBeInTheDocument();
      const trafficDifference = screen.getByTestId('traffic-difference');
      expect(trafficDifference).toHaveClass('text-green-600'); // No delay styling
    });

    it('should show traffic savings with negative difference', () => {
      const fasterTrafficRoute = {
        ...mockTrafficRoute,
        routes: [{ ...mockTrafficRoute.routes[0], duration: 1200 }] // 20 minutes (3 min faster)
      };

      render(
        <RouteControlPanel
          {...defaultProps}
          route={mockRegularRoute}
          trafficRoute={fasterTrafficRoute}
        />
      );

      expect(screen.getByText('-3 min')).toBeInTheDocument();
      const trafficDifference = screen.getByTestId('traffic-difference');
      expect(trafficDifference).toHaveClass('text-green-600'); // Savings styling
    });

    it('should display only regular route when no traffic route is available', () => {
      render(
        <RouteControlPanel
          {...defaultProps}
          route={mockRegularRoute}
        />
      );

      expect(screen.getByTestId('route-info')).toBeInTheDocument();
      expect(screen.getByText('23 min')).toBeInTheDocument(); // Regular duration
      expect(screen.queryByText('With traffic:')).not.toBeInTheDocument();
      expect(screen.queryByTestId('traffic-difference')).not.toBeInTheDocument();
    });

    it('should display traffic route partial results when regular route is not available', () => {
      render(
        <RouteControlPanel
          {...defaultProps}
          trafficRoute={mockTrafficRoute}
        />
      );

      expect(screen.getByTestId('route-info')).toBeInTheDocument();
      expect(screen.getByText('With traffic: 26 min')).toBeInTheDocument();
      expect(screen.queryByTestId('traffic-difference')).not.toBeInTheDocument(); // No comparison without regular route
    });
  });

  describe('Loading states for traffic comparison', () => {
    it('should show "Calculating..." when regular route is loading', () => {
      render(
        <RouteControlPanel
          {...defaultProps}
          loading={true}
        />
      );

      expect(screen.getByText('Calculating route...')).toBeInTheDocument();
    });

    it('should show "Checking traffic..." when traffic route is loading', () => {
      render(
        <RouteControlPanel
          {...defaultProps}
          route={mockRegularRoute}
          trafficLoading={true}
        />
      );

      expect(screen.getByText('23 min')).toBeInTheDocument(); // Regular route available
      expect(screen.getByText('Checking traffic...')).toBeInTheDocument();
    });

    it('should show both loading indicators when both routes are loading', () => {
      render(
        <RouteControlPanel
          {...defaultProps}
          loading={true}
          trafficLoading={true}
        />
      );

      expect(screen.getByText('Calculating route...')).toBeInTheDocument();
      expect(screen.getByText('Checking traffic...')).toBeInTheDocument();
    });

    it('should show partial results when one request completes first', () => {
      render(
        <RouteControlPanel
          {...defaultProps}
          route={mockRegularRoute}
          trafficLoading={true}
        />
      );

      expect(screen.getByText('23 min')).toBeInTheDocument(); // Regular route completed
      expect(screen.getByText('Checking traffic...')).toBeInTheDocument(); // Traffic still loading
      expect(screen.queryByTestId('traffic-difference')).not.toBeInTheDocument(); // No comparison yet
    });
  });

  describe('Error states for traffic comparison', () => {
    it('should display regular route error only', () => {
      render(
        <RouteControlPanel
          {...defaultProps}
          error="Regular route failed"
        />
      );

      expect(screen.getByText('Error: Regular route failed')).toBeInTheDocument();
    });

    it('should display traffic route error with regular route success', () => {
      render(
        <RouteControlPanel
          {...defaultProps}
          route={mockRegularRoute}
          trafficError="Traffic API failed"
        />
      );

      expect(screen.getByText('23 min')).toBeInTheDocument(); // Regular route successful
      expect(screen.getByText('Traffic info unavailable')).toBeInTheDocument(); // Traffic error message
    });

    it('should display both error messages when both fail', () => {
      render(
        <RouteControlPanel
          {...defaultProps}
          error="Regular route failed"
          trafficError="Traffic API failed"
        />
      );

      expect(screen.getByText('Error: Regular route failed')).toBeInTheDocument();
      expect(screen.getByText('Traffic info unavailable')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for traffic comparison', () => {
      render(
        <RouteControlPanel
          {...defaultProps}
          route={mockRegularRoute}
          trafficRoute={mockTrafficRoute}
        />
      );

      expect(screen.getByLabelText('Regular route duration')).toBeInTheDocument();
      expect(screen.getByLabelText('Traffic route duration')).toBeInTheDocument();
      expect(screen.getByLabelText('Traffic delay: +3 min')).toBeInTheDocument();
    });

    it('should have proper test IDs for traffic comparison elements', () => {
      render(
        <RouteControlPanel
          {...defaultProps}
          route={mockRegularRoute}
          trafficRoute={mockTrafficRoute}
        />
      );

      expect(screen.getByTestId('regular-route-duration')).toBeInTheDocument();
      expect(screen.getByTestId('traffic-route-duration')).toBeInTheDocument();
      expect(screen.getByTestId('traffic-difference')).toBeInTheDocument();
    });
  });

  describe('Large traffic differences', () => {
    it('should format large traffic delays correctly', () => {
      const severeTrafficRoute = {
        ...mockTrafficRoute,
        routes: [{ ...mockTrafficRoute.routes[0], duration: 5280 }] // 88 minutes (+65 minutes delay)
      };

      render(
        <RouteControlPanel
          {...defaultProps}
          route={mockRegularRoute}
          trafficRoute={severeTrafficRoute}
        />
      );

      expect(screen.getByText('+1h 5m')).toBeInTheDocument(); // 65 minutes formatted
      const trafficDifference = screen.getByTestId('traffic-difference');
      expect(trafficDifference).toHaveClass('text-red-600'); // Severe delay styling
    });

    it('should use red styling for delays over 15 minutes', () => {
      const severeTrafficRoute = {
        ...mockTrafficRoute,
        routes: [{ ...mockTrafficRoute.routes[0], duration: 2340 }] // 39 minutes (+16 minutes delay)
      };

      render(
        <RouteControlPanel
          {...defaultProps}
          route={mockRegularRoute}
          trafficRoute={severeTrafficRoute}
        />
      );

      const trafficDifference = screen.getByTestId('traffic-difference');
      expect(trafficDifference).toHaveClass('text-red-600'); // Severe delay styling
    });
  });
});