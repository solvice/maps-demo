import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VehicleSelector } from '@/components/vehicle-selector';

describe('VehicleSelector', () => {
  const defaultProps = {
    vehicleType: 'CAR' as const,
    onVehicleTypeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('should render vehicle selector with correct test id', () => {
      render(<VehicleSelector {...defaultProps} />);
      expect(screen.getByTestId('vehicle-type-toggle')).toBeInTheDocument();
    });

    it('should render all vehicle type options', () => {
      render(<VehicleSelector {...defaultProps} />);
      
      expect(screen.getByLabelText('Car')).toBeInTheDocument();
      expect(screen.getByLabelText('Truck')).toBeInTheDocument();
      expect(screen.getByLabelText('Bike')).toBeInTheDocument();
    });

    it('should show the selected vehicle type as active', () => {
      render(<VehicleSelector {...defaultProps} vehicleType="TRUCK" />);
      
      const truckButton = screen.getByLabelText('Truck');
      expect(truckButton).toHaveAttribute('data-state', 'on');
    });

    it('should default to CAR when vehicleType is undefined', () => {
      render(<VehicleSelector {...defaultProps} vehicleType={undefined} />);
      
      const carButton = screen.getByLabelText('Car');
      expect(carButton).toHaveAttribute('data-state', 'on');
    });
  });

  describe('Vehicle type selection', () => {
    it('should call onVehicleTypeChange when car is selected', () => {
      const mockOnChange = vi.fn();
      render(<VehicleSelector {...defaultProps} vehicleType="TRUCK" onVehicleTypeChange={mockOnChange} />);
      
      const carButton = screen.getByLabelText('Car');
      fireEvent.click(carButton);
      
      expect(mockOnChange).toHaveBeenCalledWith('CAR');
    });

    it('should call onVehicleTypeChange when truck is selected', () => {
      const mockOnChange = vi.fn();
      render(<VehicleSelector {...defaultProps} onVehicleTypeChange={mockOnChange} />);
      
      const truckButton = screen.getByLabelText('Truck');
      fireEvent.click(truckButton);
      
      expect(mockOnChange).toHaveBeenCalledWith('TRUCK');
    });

    it('should call onVehicleTypeChange when bike is selected', () => {
      const mockOnChange = vi.fn();
      render(<VehicleSelector {...defaultProps} onVehicleTypeChange={mockOnChange} />);
      
      const bikeButton = screen.getByLabelText('Bike');
      fireEvent.click(bikeButton);
      
      expect(mockOnChange).toHaveBeenCalledWith('BIKE');
    });

    it('should not call onVehicleTypeChange when the same vehicle type is clicked', () => {
      const mockOnChange = vi.fn();
      render(<VehicleSelector {...defaultProps} vehicleType="CAR" onVehicleTypeChange={mockOnChange} />);
      
      const carButton = screen.getByLabelText('Car');
      fireEvent.click(carButton);
      
      // Toggle groups prevent deselection, so clicking same option should not trigger change
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Icons', () => {
    it('should display car icon for car option', () => {
      render(<VehicleSelector {...defaultProps} />);
      
      const carButton = screen.getByLabelText('Car');
      expect(carButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should display truck icon for truck option', () => {
      render(<VehicleSelector {...defaultProps} />);
      
      const truckButton = screen.getByLabelText('Truck');
      expect(truckButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should display bike icon for bike option', () => {
      render(<VehicleSelector {...defaultProps} />);
      
      const bikeButton = screen.getByLabelText('Bike');
      expect(bikeButton.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for each vehicle type', () => {
      render(<VehicleSelector {...defaultProps} />);
      
      expect(screen.getByRole('radio', { name: 'Car' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Truck' })).toBeInTheDocument();
      expect(screen.getByRole('radio', { name: 'Bike' })).toBeInTheDocument();
    });

    it('should maintain keyboard navigation', () => {
      render(<VehicleSelector {...defaultProps} />);
      
      const toggleGroup = screen.getByTestId('vehicle-type-toggle');
      expect(toggleGroup).toHaveAttribute('role', 'group');
    });
  });

  describe('Styling and layout', () => {
    it('should center the vehicle selector', () => {
      render(<VehicleSelector {...defaultProps} />);
      
      const container = screen.getByTestId('vehicle-type-toggle').parentElement;
      expect(container).toHaveClass('flex', 'justify-center');
    });

    it('should center content within toggle group', () => {
      render(<VehicleSelector {...defaultProps} />);
      
      const toggleGroup = screen.getByTestId('vehicle-type-toggle');
      expect(toggleGroup).toHaveClass('justify-center');
    });
  });

  describe('TypeScript types', () => {
    it('should accept valid vehicle types', () => {
      // These should compile without errors
      render(<VehicleSelector vehicleType="CAR" onVehicleTypeChange={vi.fn()} />);
      render(<VehicleSelector vehicleType="TRUCK" onVehicleTypeChange={vi.fn()} />);
      render(<VehicleSelector vehicleType="BIKE" onVehicleTypeChange={vi.fn()} />);
      render(<VehicleSelector vehicleType={undefined} onVehicleTypeChange={vi.fn()} />);
    });
  });
});