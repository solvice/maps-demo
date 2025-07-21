import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RouteInfoCard } from '@/components/route-info-card';
import { Route } from '@/lib/solvice-api';

describe('RouteInfoCard', () => {
  const mockRoute: Route = {
    distance: 55000,
    duration: 1380, // 23 minutes
    geometry: 'regular_polyline',
    weight: 100,
    weight_name: 'routability',
    legs: []
  };

  const mockTrafficRoute: Route = {
    distance: 55000,
    duration: 1560, // 26 minutes (+3 minutes traffic delay)
    geometry: 'traffic_polyline',
    weight: 100,
    weight_name: 'routability',
    legs: []
  };

  const defaultProps = {
    route: mockRoute,
    routeIndex: 0,
    routeColor: '#3b82f6',
    onRouteHover: vi.fn(),
    trafficDifferenceText: null,
    trafficDifferenceStyle: '',
  };

  describe('Basic route display', () => {
    it('should display route duration and distance', () => {
      render(<RouteInfoCard {...defaultProps} />);

      expect(screen.getByText('23 min')).toBeInTheDocument();
      expect(screen.getByText('55.0 km')).toBeInTheDocument();
    });

    it('should display route color indicator', () => {
      render(<RouteInfoCard {...defaultProps} />);

      const colorIndicator = screen.getByTestId('route-color-indicator');
      expect(colorIndicator).toBeInTheDocument();
      expect(colorIndicator).toHaveStyle({ backgroundColor: '#3b82f6' });
    });

    it('should have proper accessibility labels', () => {
      render(<RouteInfoCard {...defaultProps} />);

      expect(screen.getByLabelText('Regular route duration')).toBeInTheDocument();
      expect(screen.getByTestId('regular-route-duration')).toHaveTextContent('23 min');
    });
  });

  describe('Traffic comparison', () => {
    it('should display traffic comparison when provided', () => {
      render(
        <RouteInfoCard
          {...defaultProps}
          trafficRoute={mockTrafficRoute}
          trafficDifferenceText="+3 min"
          trafficDifferenceStyle="text-yellow-600"
        />
      );

      expect(screen.getByText('With traffic: 26 min')).toBeInTheDocument();
      expect(screen.getByText('+3 min')).toBeInTheDocument();
      expect(screen.getByTestId('traffic-difference')).toHaveClass('text-yellow-600');
    });

    it('should not display traffic comparison when not provided', () => {
      render(<RouteInfoCard {...defaultProps} />);

      expect(screen.queryByText('With traffic:')).not.toBeInTheDocument();
      expect(screen.queryByTestId('traffic-difference')).not.toBeInTheDocument();
    });

    it('should show traffic route with orange indicator', () => {
      render(
        <RouteInfoCard
          {...defaultProps}
          trafficRoute={mockTrafficRoute}
          trafficDifferenceText="+3 min"
          trafficDifferenceStyle="text-yellow-600"
        />
      );

      const trafficIndicator = screen.getByTestId('traffic-color-indicator');
      expect(trafficIndicator).toBeInTheDocument();
      expect(trafficIndicator).toHaveClass('bg-orange-500');
    });
  });

  describe('Traffic-only mode', () => {
    it('should display as traffic-only route when mode is traffic-only', () => {
      render(
        <RouteInfoCard
          route={mockTrafficRoute}
          routeIndex={0}
          routeColor="#f97316"
          mode="traffic-only"
          onRouteHover={vi.fn()}
          trafficDifferenceText={null}
          trafficDifferenceStyle=""
        />
      );

      expect(screen.getByText('With traffic: 26 min')).toBeInTheDocument();
      expect(screen.getByText('55.0 km')).toBeInTheDocument();
      expect(screen.queryByTestId('traffic-difference')).not.toBeInTheDocument();
    });
  });

  describe('Hover interactions', () => {
    it('should call onRouteHover when mouse enters', () => {
      const onRouteHover = vi.fn();
      render(<RouteInfoCard {...defaultProps} onRouteHover={onRouteHover} />);

      const card = screen.getByTestId('route-info-card');
      fireEvent.mouseEnter(card);

      expect(onRouteHover).toHaveBeenCalledWith(0);
    });

    it('should call onRouteHover with null when mouse leaves', () => {
      const onRouteHover = vi.fn();
      render(<RouteInfoCard {...defaultProps} onRouteHover={onRouteHover} />);

      const card = screen.getByTestId('route-info-card');
      fireEvent.mouseLeave(card);

      expect(onRouteHover).toHaveBeenCalledWith(null);
    });

    it('should have hover styling classes', () => {
      render(<RouteInfoCard {...defaultProps} />);

      const card = screen.getByTestId('route-info-card');
      expect(card).toHaveClass('hover:bg-muted/50', 'cursor-pointer', 'transition-colors');
    });
  });

  describe('Loading state', () => {
    it('should not display traffic comparison when traffic is loading', () => {
      render(
        <RouteInfoCard
          {...defaultProps}
          trafficRoute={mockTrafficRoute}
          trafficLoading={true}
          trafficDifferenceText="+3 min"
          trafficDifferenceStyle="text-yellow-600"
        />
      );

      expect(screen.getByText('23 min')).toBeInTheDocument(); // Regular route shown
      expect(screen.queryByText('With traffic:')).not.toBeInTheDocument(); // Traffic hidden while loading
    });
  });
});