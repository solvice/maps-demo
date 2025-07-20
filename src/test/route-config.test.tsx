import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { RouteConfigPane, RouteConfig } from '@/components/route-config';

describe('Route Config Pane', () => {
  const defaultConfig: RouteConfig = {
    alternatives: 1,
    steps: false,
    annotations: [],
    geometries: 'polyline',
    overview: 'full',
    continue_straight: true,
    snapping: 'default',
    vehicleType: 'CAR',
    routingEngine: 'OSM',
    interpolate: false,
    generate_hints: false,
  };

  const mockOnConfigChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render config trigger button', () => {
      render(
        <RouteConfigPane 
          config={defaultConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      expect(screen.getByTestId('route-config-trigger')).toBeInTheDocument();
      expect(screen.getByText('⚙️ Config')).toBeInTheDocument();
    });

    it('should not show config panel initially', () => {
      render(
        <RouteConfigPane 
          config={defaultConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      expect(screen.queryByText('Route Configuration')).not.toBeInTheDocument();
    });
  });

  describe('Config panel interaction', () => {
    it('should open config panel when trigger is clicked', async () => {
      render(
        <RouteConfigPane 
          config={defaultConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      const trigger = screen.getByTestId('route-config-trigger');
      fireEvent.click(trigger);

      // Wait for panel to open
      expect(await screen.findByText('Route Configuration')).toBeInTheDocument();
      expect(screen.getByText('Configure routing parameters for the Solvice API')).toBeInTheDocument();
    });

    it('should display current config values', async () => {
      const testConfig: RouteConfig = {
        ...defaultConfig,
        alternatives: 3,
        vehicleType: 'BIKE',
        steps: true,
      };

      render(
        <RouteConfigPane 
          config={testConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      fireEvent.click(screen.getByTestId('route-config-trigger'));

      expect(await screen.findByDisplayValue('3')).toBeInTheDocument(); // alternatives
      expect(screen.getByText('Bike')).toBeInTheDocument(); // vehicleType
    });
  });

  describe('Config modification', () => {
    it('should call onConfigChange when alternatives input changes', async () => {
      render(
        <RouteConfigPane 
          config={defaultConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      fireEvent.click(screen.getByTestId('route-config-trigger'));
      
      const alternativesInput = await screen.findByDisplayValue('1');
      fireEvent.change(alternativesInput, { target: { value: '2' } });

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...defaultConfig,
        alternatives: 2,
      });
    });

    it('should handle switch toggles correctly', async () => {
      render(
        <RouteConfigPane 
          config={defaultConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      fireEvent.click(screen.getByTestId('route-config-trigger'));
      
      const stepsSwitch = await screen.findByRole('switch', { name: /include steps/i });
      fireEvent.click(stepsSwitch);

      expect(mockOnConfigChange).toHaveBeenCalledWith({
        ...defaultConfig,
        steps: true,
      });
    });
  });

  describe('Reset functionality', () => {
    it('should reset config to defaults when reset button is clicked', async () => {
      const customConfig: RouteConfig = {
        alternatives: 3,
        steps: true,
        vehicleType: 'TRUCK',
        routingEngine: 'GOOGLE',
        overview: 'simplified',
      };

      render(
        <RouteConfigPane 
          config={customConfig}
          onConfigChange={mockOnConfigChange}
        />
      );

      fireEvent.click(screen.getByTestId('route-config-trigger'));
      
      const resetButton = await screen.findByText('Reset to Defaults');
      fireEvent.click(resetButton);

      expect(mockOnConfigChange).toHaveBeenCalledWith(defaultConfig);
    });
  });
});