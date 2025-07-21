import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouteInfoList } from '@/components/route-info-list';
import { RouteResponse } from '@/lib/solvice-api';

describe('RouteInfoList', () => {
  const mockRegularRoute: RouteResponse = {
    code: 'Ok',
    routes: [
      {
        distance: 55000,
        duration: 1380, // 23 minutes
        geometry: 'regular_polyline_1',
        weight: 100,
        weight_name: 'routability',
        legs: []
      },
      {
        distance: 62000,
        duration: 1500, // 25 minutes
        geometry: 'regular_polyline_2',
        weight: 110,
        weight_name: 'routability',
        legs: []
      }
    ],
    waypoints: []
  };

  const mockTrafficRoute: RouteResponse = {
    code: 'Ok',
    routes: [
      {
        distance: 55000,
        duration: 1560, // 26 minutes (+3 minutes traffic delay)
        geometry: 'traffic_polyline_1',
        weight: 100,
        weight_name: 'routability',
        legs: []
      },
      {
        distance: 62000,
        duration: 1680, // 28 minutes (+3 minutes traffic delay)
        geometry: 'traffic_polyline_2',
        weight: 110,
        weight_name: 'routability',
        legs: []
      }
    ],
    waypoints: []
  };

  const defaultProps = {
    route: mockRegularRoute,
    routeColors: ['#3b82f6', '#10b981', '#f59e0b'],
    onRouteHover: vi.fn(),
    trafficDifference: 180, // 3 minutes in seconds
    trafficDifferenceText: '+3 min',
    getTrafficDifferenceStyle: vi.fn(() => 'text-yellow-600'),
  };

  describe('Route list display', () => {
    it('should render all routes when only regular routes are available', () => {
      render(<RouteInfoList {...defaultProps} />);

      expect(screen.getByTestId('route-info')).toBeInTheDocument();
      expect(screen.getByText('23 min')).toBeInTheDocument(); // First route
      expect(screen.getByText('25 min')).toBeInTheDocument(); // Second route
      expect(screen.getByText('55.0 km')).toBeInTheDocument(); // First route distance
      expect(screen.getByText('62.0 km')).toBeInTheDocument(); // Second route distance
    });

    it('should render routes with traffic comparison when both are available', () => {
      render(
        <RouteInfoList 
          {...defaultProps}
          trafficRoute={mockTrafficRoute}
        />
      );

      // Regular routes
      expect(screen.getByText('23 min')).toBeInTheDocument();
      expect(screen.getByText('25 min')).toBeInTheDocument();
      
      // Traffic routes
      expect(screen.getAllByText(/With traffic:/)).toHaveLength(2);
      expect(screen.getByText('With traffic: 26 min')).toBeInTheDocument();
      expect(screen.getByText('With traffic: 28 min')).toBeInTheDocument();
      
      // Traffic differences
      expect(screen.getAllByText('+3 min')).toHaveLength(2);
    });

    it('should render only traffic routes when regular routes are not available', () => {
      render(
        <RouteInfoList 
          route={null}
          trafficRoute={mockTrafficRoute}
          routeColors={['#f97316', '#f97316']}
          onRouteHover={vi.fn()}
          trafficDifference={null}
          trafficDifferenceText={null}
          getTrafficDifferenceStyle={vi.fn()}
        />
      );

      expect(screen.getByTestId('route-info')).toBeInTheDocument();
      expect(screen.getByText('With traffic: 26 min')).toBeInTheDocument();
      expect(screen.getByText('With traffic: 28 min')).toBeInTheDocument();
      expect(screen.queryByTestId('traffic-difference')).not.toBeInTheDocument();
    });

    it('should not render when no routes are available', () => {
      render(
        <RouteInfoList 
          route={null}
          trafficRoute={null}
          routeColors={[]}
          onRouteHover={vi.fn()}
          trafficDifference={null}
          trafficDifferenceText={null}
          getTrafficDifferenceStyle={vi.fn()}
        />
      );

      expect(screen.queryByTestId('route-info')).not.toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it('should hide traffic comparison when traffic is loading', () => {
      render(
        <RouteInfoList 
          {...defaultProps}
          trafficRoute={mockTrafficRoute}
          trafficLoading={true}
        />
      );

      // Regular routes should be visible
      expect(screen.getByText('23 min')).toBeInTheDocument();
      expect(screen.getByText('25 min')).toBeInTheDocument();
      
      // Traffic routes should be hidden when loading
      expect(screen.queryByText(/With traffic:/)).not.toBeInTheDocument();
    });

    it('should not render when main route is loading', () => {
      render(
        <RouteInfoList 
          {...defaultProps}
          loading={true}
        />
      );

      expect(screen.queryByTestId('route-info')).not.toBeInTheDocument();
    });
  });

  describe('Route filtering', () => {
    it('should filter out routes without distance or duration', () => {
      const incompleteRoute: RouteResponse = {
        code: 'Ok',
        routes: [
          {
            distance: 55000,
            duration: 1380,
            geometry: 'complete_route',
            weight: 100,
            weight_name: 'routability',
            legs: []
          },
          {
            // Missing distance and duration
            geometry: 'incomplete_route',
            weight: 110,
            weight_name: 'routability',
            legs: []
          } as any
        ],
        waypoints: []
      };

      render(
        <RouteInfoList 
          route={incompleteRoute}
          trafficRoute={null}
          routeColors={['#3b82f6']}
          onRouteHover={vi.fn()}
          trafficDifference={null}
          trafficDifferenceText={null}
          getTrafficDifferenceStyle={vi.fn()}
        />
      );

      // Should only show the complete route
      expect(screen.getByText('23 min')).toBeInTheDocument();
      expect(screen.getByText('55.0 km')).toBeInTheDocument();
      
      // Should not show incomplete route
      expect(screen.getAllByTestId('route-info-card')).toHaveLength(1);
    });
  });

  describe('Route colors', () => {
    it('should apply correct route colors to route indicators', () => {
      const { container } = render(<RouteInfoList {...defaultProps} />);

      const routeCards = container.querySelectorAll('[data-testid="route-info-card"]');
      expect(routeCards).toHaveLength(2);
      
      // Check first route color
      const firstColorIndicator = routeCards[0].querySelector('[data-testid="route-color-indicator"]');
      expect(firstColorIndicator).toHaveStyle({ backgroundColor: '#3b82f6' });
      
      // Check second route color
      const secondColorIndicator = routeCards[1].querySelector('[data-testid="route-color-indicator"]');
      expect(secondColorIndicator).toHaveStyle({ backgroundColor: '#10b981' });
    });

    it('should fall back to first color when route index exceeds colors array', () => {
      const singleColorProps = {
        ...defaultProps,
        routeColors: ['#3b82f6'] // Only one color for two routes
      };

      const { container } = render(<RouteInfoList {...singleColorProps} />);

      const routeCards = container.querySelectorAll('[data-testid="route-info-card"]');
      expect(routeCards).toHaveLength(2);
      
      // Both should use the first (and only) color
      const colorIndicators = container.querySelectorAll('[data-testid="route-color-indicator"]');
      colorIndicators.forEach(indicator => {
        expect(indicator).toHaveStyle({ backgroundColor: '#3b82f6' });
      });
    });
  });

  describe('Traffic difference styling', () => {
    it('should call getTrafficDifferenceStyle with correct traffic difference', () => {
      const getTrafficDifferenceStyle = vi.fn(() => 'text-red-600');
      
      render(
        <RouteInfoList 
          {...defaultProps}
          trafficRoute={mockTrafficRoute}
          trafficDifference={900} // 15 minutes
          trafficDifferenceText='+15 min'
          getTrafficDifferenceStyle={getTrafficDifferenceStyle}
        />
      );

      expect(getTrafficDifferenceStyle).toHaveBeenCalledWith(900);
    });
  });
});