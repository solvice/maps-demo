import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';
import { LocationInput } from '@/components/location-input';

// Mock the geocoding service
vi.mock('@/lib/geocoding', () => ({
  searchAddresses: vi.fn(),
}));

describe('LocationInput Component', () => {
  let mockSearchAddresses: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    const geocodingModule = await import('@/lib/geocoding');
    mockSearchAddresses = vi.mocked(geocodingModule.searchAddresses);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic rendering and props', () => {
    it('should render with correct label and indicator color', () => {
      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <LocationInput
          label="Origin"
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          indicatorColor="bg-green-500"
          placeholder="Enter origin"
        />
      );

      expect(screen.getByText('Origin')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter origin')).toBeInTheDocument();
      
      // Check for indicator color
      const indicator = document.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should render with clear button when value is present', () => {
      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();
      const mockOnClear = vi.fn();

      render(
        <LocationInput
          label="Destination"
          value="Brussels, Belgium"
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          onClear={mockOnClear}
          indicatorColor="bg-red-500"
          placeholder="Enter destination"
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should not render clear button when no onClear callback provided', () => {
      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <LocationInput
          label="Destination"
          value="Brussels, Belgium"
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          indicatorColor="bg-red-500"
          placeholder="Enter destination"
        />
      );

      const clearButton = screen.queryByRole('button', { name: /clear/i });
      expect(clearButton).not.toBeInTheDocument();
    });
  });

  describe('Clear functionality', () => {
    it('should call onClear when clear button is clicked', () => {
      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();
      const mockOnClear = vi.fn();

      render(
        <LocationInput
          label="Origin"
          value="Brussels, Belgium"
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          onClear={mockOnClear}
          indicatorColor="bg-green-500"
          placeholder="Enter origin"
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      
      act(() => {
        fireEvent.click(clearButton);
      });

      expect(mockOnClear).toHaveBeenCalledTimes(1);
    });

    it('should clear value and call onChange when clear button is clicked', () => {
      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();
      const mockOnClear = vi.fn();

      render(
        <LocationInput
          label="Origin"
          value="Brussels, Belgium"
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          onClear={mockOnClear}
          indicatorColor="bg-green-500"
          placeholder="Enter origin"
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      
      act(() => {
        fireEvent.click(clearButton);
      });

      expect(mockOnChange).toHaveBeenCalledWith('');
      expect(mockOnClear).toHaveBeenCalledTimes(1);
    });
  });

  describe('Autocomplete integration', () => {
    it('should show autocomplete suggestions when typing', async () => {
      mockSearchAddresses.mockResolvedValue([
        { coordinates: [4.3517, 50.8503], address: 'Brussels, Belgium', confidence: 0.9 },
        { coordinates: [4.4025, 51.2194], address: 'Brussels Airport, Belgium', confidence: 0.8 }
      ]);

      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <LocationInput
          label="Origin"
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          indicatorColor="bg-green-500"
          placeholder="Enter origin"
        />
      );

      const input = screen.getByPlaceholderText('Enter origin');
      
      act(() => {
        fireEvent.change(input, { target: { value: 'Bru' } });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockSearchAddresses).toHaveBeenCalledWith('Bru');
      });

      await waitFor(() => {
        expect(screen.getByText('Brussels, Belgium')).toBeInTheDocument();
        expect(screen.getByText('Brussels Airport, Belgium')).toBeInTheDocument();
      });
    });

    it('should call onSelect when autocomplete suggestion is selected', async () => {
      mockSearchAddresses.mockResolvedValue([
        { coordinates: [4.3517, 50.8503], address: 'Brussels, Belgium', confidence: 0.9 }
      ]);

      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <LocationInput
          label="Origin"
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          indicatorColor="bg-green-500"
          placeholder="Enter origin"
        />
      );

      const input = screen.getByPlaceholderText('Enter origin');
      
      act(() => {
        fireEvent.change(input, { target: { value: 'Bru' } });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Brussels, Belgium')).toBeInTheDocument();
      });

      act(() => {
        fireEvent.click(screen.getByText('Brussels, Belgium'));
      });

      expect(mockOnSelect).toHaveBeenCalledWith({
        coordinates: [4.3517, 50.8503],
        address: 'Brussels, Belgium',
        confidence: 0.9
      });
    });
  });

  describe('Validation', () => {
    it('should display error state when error prop is provided', () => {
      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <LocationInput
          label="Origin"
          value="Invalid Location"
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          indicatorColor="bg-green-500"
          placeholder="Enter origin"
          error="Location not found"
        />
      );

      expect(screen.getByText('Location not found')).toBeInTheDocument();
    });

    it('should apply error styling when error is present', () => {
      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <LocationInput
          label="Origin"
          value="Invalid Location"
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          indicatorColor="bg-green-500"
          placeholder="Enter origin"
          error="Location not found"
        />
      );

      const input = screen.getByPlaceholderText('Enter origin');
      expect(input).toHaveClass('border-red-500');
    });
  });

  describe('Disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <LocationInput
          label="Origin"
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          indicatorColor="bg-green-500"
          placeholder="Enter origin"
          disabled={true}
        />
      );

      const input = screen.getByPlaceholderText('Enter origin');
      expect(input).toBeDisabled();
    });

    it('should disable clear button when disabled', () => {
      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();
      const mockOnClear = vi.fn();

      render(
        <LocationInput
          label="Origin"
          value="Brussels, Belgium"
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          onClear={mockOnClear}
          indicatorColor="bg-green-500"
          placeholder="Enter origin"
          disabled={true}
        />
      );

      const clearButton = screen.getByRole('button', { name: /clear/i });
      expect(clearButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <LocationInput
          label="Origin"
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          indicatorColor="bg-green-500"
          placeholder="Enter origin"
        />
      );

      const input = screen.getByLabelText('Origin');
      expect(input).toBeInTheDocument();
    });

    it('should have proper ARIA attributes for error state', () => {
      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <LocationInput
          label="Origin"
          value="Invalid Location"
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          indicatorColor="bg-green-500"
          placeholder="Enter origin"
          error="Location not found"
        />
      );

      const input = screen.getByLabelText('Origin');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });
});