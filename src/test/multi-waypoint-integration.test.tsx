/**
 * Multi-Waypoint Integration Test
 * 
 * Simple TDD test for basic multi-waypoint functionality
 * This test should FAIL initially, then we write minimal code to make it pass
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RoutePoint, RoutePointManager } from '@/lib/route-points';

// Simple test component to verify multi-waypoint functionality
function TestMultiWaypointComponent() {
  const [routePoints, setRoutePoints] = React.useState<RoutePoint[]>([]);
  
  const handleAddWaypoint = (coordinates: [number, number]) => {
    const newWaypoint = RoutePointManager.createWaypoint(coordinates);
    setRoutePoints(current => RoutePointManager.addWaypoint(current, coordinates));
  };

  const handleSetOrigin = (coordinates: [number, number]) => {
    setRoutePoints(current => RoutePointManager.setOrigin(current, coordinates));
  };

  const handleSetDestination = (coordinates: [number, number]) => {
    setRoutePoints(current => RoutePointManager.setDestination(current, coordinates));
  };

  const stats = RoutePointManager.getStats(routePoints);

  return (
    <div>
      <div data-testid="route-stats">
        Total points: {stats.total}, Waypoints: {stats.waypoints}
      </div>
      
      <button 
        onClick={() => handleSetOrigin([3.7174, 51.0543])}
        data-testid="add-origin"
      >
        Add Origin
      </button>
      
      <button 
        onClick={() => handleAddWaypoint([3.7200, 51.0600])}
        data-testid="add-waypoint"
      >
        Add Waypoint
      </button>
      
      <button 
        onClick={() => handleSetDestination([3.7274, 51.0643])}
        data-testid="add-destination"
      >
        Add Destination
      </button>

      <div data-testid="route-points">
        {routePoints.map(point => (
          <div key={point.id} data-testid={`point-${point.type}`}>
            {point.type}: [{point.coordinates[0].toFixed(4)}, {point.coordinates[1].toFixed(4)}]
          </div>
        ))}
      </div>
    </div>
  );
}

import React from 'react';

describe('Multi-Waypoint Integration Test', () => {
  it('should allow adding origin, waypoints, and destination', async () => {
    render(<TestMultiWaypointComponent />);

    // Initially no points
    expect(screen.getByTestId('route-stats')).toHaveTextContent('Total points: 0, Waypoints: 0');

    // Add origin
    fireEvent.click(screen.getByTestId('add-origin'));
    expect(screen.getByTestId('route-stats')).toHaveTextContent('Total points: 1, Waypoints: 0');
    expect(screen.getByTestId('point-origin')).toHaveTextContent('origin: [3.7174, 51.0543]');

    // Add waypoint
    fireEvent.click(screen.getByTestId('add-waypoint'));
    expect(screen.getByTestId('route-stats')).toHaveTextContent('Total points: 2, Waypoints: 1');
    expect(screen.getByTestId('point-waypoint')).toHaveTextContent('waypoint: [3.7200, 51.0600]');

    // Add destination
    fireEvent.click(screen.getByTestId('add-destination'));
    expect(screen.getByTestId('route-stats')).toHaveTextContent('Total points: 3, Waypoints: 1');
    expect(screen.getByTestId('point-destination')).toHaveTextContent('destination: [3.7274, 51.0643]');

    // Verify correct order: origin → waypoint → destination
    const pointElements = screen.getAllByTestId(/^point-/);
    expect(pointElements[0]).toHaveTextContent('origin');
    expect(pointElements[1]).toHaveTextContent('waypoint');
    expect(pointElements[2]).toHaveTextContent('destination');
  });

  it('should insert waypoints before destination', async () => {
    render(<TestMultiWaypointComponent />);

    // Add origin and destination first
    fireEvent.click(screen.getByTestId('add-origin'));
    fireEvent.click(screen.getByTestId('add-destination'));
    
    expect(screen.getByTestId('route-stats')).toHaveTextContent('Total points: 2, Waypoints: 0');

    // Add waypoint - should be inserted before destination
    fireEvent.click(screen.getByTestId('add-waypoint'));
    
    expect(screen.getByTestId('route-stats')).toHaveTextContent('Total points: 3, Waypoints: 1');
    
    // Check order: origin → waypoint → destination
    const pointElements = screen.getAllByTestId(/^point-/);
    expect(pointElements[0]).toHaveTextContent('origin');
    expect(pointElements[1]).toHaveTextContent('waypoint');
    expect(pointElements[2]).toHaveTextContent('destination');
  });
});