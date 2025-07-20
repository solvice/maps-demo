import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import '@testing-library/jest-dom';

// Mock the geocoding service
vi.mock('@/lib/geocoding', () => ({
  reverseGeocode: vi.fn(),
  forwardGeocode: vi.fn(),
  searchAddresses: vi.fn(),
}));

// Mock other dependencies
vi.mock('@/lib/solvice-api');
vi.mock('maplibre-gl');

// Create the AutocompleteInput component we'll implement
import { AutocompleteInput } from '@/components/autocomplete-input';

describe('Autocomplete & Geocoding', () => {
  let mockSearchAddresses: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    // Get the mocked function
    const geocodingModule = await import('@/lib/geocoding');
    mockSearchAddresses = vi.mocked(geocodingModule.searchAddresses);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Search suggestions appearance', () => {
    it('should show search suggestions as user types', async () => {
      mockSearchAddresses.mockResolvedValue([
        { coordinates: [4.3517, 50.8503], address: 'Brussels, Belgium', confidence: 0.9 },
        { coordinates: [4.4025, 51.2194], address: 'Brussels Airport, Belgium', confidence: 0.8 }
      ]);

      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          placeholder="Enter location"
        />
      );

      const input = screen.getByPlaceholderText('Enter location');
      
      // Type "Bru" to trigger search
      act(() => {
        fireEvent.change(input, { target: { value: 'Bru' } });
      });

      // Advance timers to trigger debounced search
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockSearchAddresses).toHaveBeenCalledWith('Bru');
      });

      // Should show dropdown with suggestions
      await waitFor(() => {
        expect(screen.getByText('Brussels, Belgium')).toBeInTheDocument();
        expect(screen.getByText('Brussels Airport, Belgium')).toBeInTheDocument();
      });

      // Should show dropdown container
      expect(screen.getByTestId('autocomplete-dropdown')).toBeInTheDocument();
    });

    it('should not show suggestions for queries less than 2 characters', async () => {
      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          placeholder="Enter location"
        />
      );

      const input = screen.getByPlaceholderText('Enter location');
      
      // Type single character
      act(() => {
        fireEvent.change(input, { target: { value: 'B' } });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should not call search API
      expect(mockSearchAddresses).not.toHaveBeenCalled();
      
      // Should not show dropdown
      expect(screen.queryByTestId('autocomplete-dropdown')).not.toBeInTheDocument();
    });

    it('should hide suggestions when input is empty', async () => {
      mockSearchAddresses.mockResolvedValue([
        { coordinates: [4.3517, 50.8503], address: 'Brussels, Belgium', confidence: 0.9 }
      ]);

      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <AutocompleteInput
          value="Bru"
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          placeholder="Enter location"
        />
      );

      const input = screen.getByPlaceholderText('Enter location');
      
      // First show suggestions
      act(() => {
        fireEvent.change(input, { target: { value: 'Brussels' } });
      });
      
      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-dropdown')).toBeInTheDocument();
      });

      // Clear input
      act(() => {
        fireEvent.change(input, { target: { value: '' } });
      });

      // Should hide dropdown
      expect(screen.queryByTestId('autocomplete-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('Debounced search', () => {
    it('should debounce search API calls when typing rapidly', async () => {
      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          placeholder="Enter location"
        />
      );

      const input = screen.getByPlaceholderText('Enter location');
      
      // Type rapidly
      act(() => {
        fireEvent.change(input, { target: { value: 'B' } });
      });
      act(() => {
        fireEvent.change(input, { target: { value: 'Br' } });
      });
      act(() => {
        fireEvent.change(input, { target: { value: 'Bru' } });
      });
      act(() => {
        fireEvent.change(input, { target: { value: 'Brus' } });
      });
      act(() => {
        fireEvent.change(input, { target: { value: 'Brussels' } });
      });

      // Advance timers to complete debounce
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should only call search once with final value
      await waitFor(() => {
        expect(mockSearchAddresses).toHaveBeenCalledTimes(1);
        expect(mockSearchAddresses).toHaveBeenCalledWith('Brussels');
      });
    });

    it('should cancel previous search requests when new ones are made', async () => {
      let firstResolve: (value: any) => void;
      let secondResolve: (value: any) => void;
      
      const firstRequest = new Promise(resolve => { firstResolve = resolve; });
      const secondRequest = new Promise(resolve => { secondResolve = resolve; });
      
      mockSearchAddresses
        .mockReturnValueOnce(firstRequest)
        .mockReturnValueOnce(secondRequest);

      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          placeholder="Enter location"
        />
      );

      const input = screen.getByPlaceholderText('Enter location');
      
      // Start first search
      act(() => {
        fireEvent.change(input, { target: { value: 'Brussels' } });
      });
      
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Start second search before first completes
      act(() => {
        fireEvent.change(input, { target: { value: 'Antwerp' } });
      });
      
      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Resolve first request (should be ignored)
      act(() => {
        firstResolve!([{ coordinates: [4.3517, 50.8503], address: 'Brussels, Belgium', confidence: 0.9 }]);
      });

      // Resolve second request (should be used)
      act(() => {
        secondResolve!([{ coordinates: [4.4025, 51.2194], address: 'Antwerp, Belgium', confidence: 0.9 }]);
      });

      // Should only show results from second request
      await waitFor(() => {
        expect(screen.getByText('Antwerp, Belgium')).toBeInTheDocument();
        expect(screen.queryByText('Brussels, Belgium')).not.toBeInTheDocument();
      });
    });
  });

  describe('Result selection', () => {
    it('should update input and call onSelect when clicking on suggestion', async () => {
      mockSearchAddresses.mockResolvedValue([
        { coordinates: [4.3517, 50.8503], address: 'Brussels, Belgium', confidence: 0.9 },
        { coordinates: [4.4025, 51.2194], address: 'Antwerp, Belgium', confidence: 0.8 }
      ]);

      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          placeholder="Enter location"
        />
      );

      const input = screen.getByPlaceholderText('Enter location');
      
      // Type to show suggestions
      act(() => {
        fireEvent.change(input, { target: { value: 'Bru' } });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Brussels, Belgium')).toBeInTheDocument();
      });

      // Click on first suggestion
      act(() => {
        fireEvent.click(screen.getByText('Brussels, Belgium'));
      });

      // Should call onSelect with correct data
      expect(mockOnSelect).toHaveBeenCalledWith({
        coordinates: [4.3517, 50.8503],
        address: 'Brussels, Belgium',
        confidence: 0.9
      });

      // Should update input value
      expect(mockOnChange).toHaveBeenCalledWith('Brussels, Belgium');

      // Should hide dropdown
      expect(screen.queryByTestId('autocomplete-dropdown')).not.toBeInTheDocument();
    });

    it('should handle selection via keyboard navigation', async () => {
      mockSearchAddresses.mockResolvedValue([
        { coordinates: [4.3517, 50.8503], address: 'Brussels, Belgium', confidence: 0.9 },
        { coordinates: [4.4025, 51.2194], address: 'Antwerp, Belgium', confidence: 0.8 }
      ]);

      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          placeholder="Enter location"
        />
      );

      const input = screen.getByPlaceholderText('Enter location');
      
      // Type to show suggestions
      act(() => {
        fireEvent.change(input, { target: { value: 'Bru' } });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Brussels, Belgium')).toBeInTheDocument();
      });

      // Navigate down to first item
      act(() => {
        fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
      });

      // Should highlight first item
      expect(screen.getByTestId('autocomplete-item-0')).toHaveClass('highlighted');

      // Navigate down to second item
      act(() => {
        fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
      });

      // Should highlight second item
      expect(screen.getByTestId('autocomplete-item-1')).toHaveClass('highlighted');

      // Press Enter to select
      act(() => {
        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      });

      // Should call onSelect with second item
      expect(mockOnSelect).toHaveBeenCalledWith({
        coordinates: [4.4025, 51.2194],
        address: 'Antwerp, Belgium',
        confidence: 0.8
      });
    });

    it('should handle escape key to close dropdown', async () => {
      mockSearchAddresses.mockResolvedValue([
        { coordinates: [4.3517, 50.8503], address: 'Brussels, Belgium', confidence: 0.9 }
      ]);

      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          placeholder="Enter location"
        />
      );

      const input = screen.getByPlaceholderText('Enter location');
      
      // Type to show suggestions
      act(() => {
        fireEvent.change(input, { target: { value: 'Brussels' } });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-dropdown')).toBeInTheDocument();
      });

      // Press Escape
      act(() => {
        fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
      });

      // Should hide dropdown
      expect(screen.queryByTestId('autocomplete-dropdown')).not.toBeInTheDocument();
    });
  });

  describe('Loading states', () => {
    it('should show loading indicator during search', async () => {
      let resolveSearch: (value: any) => void;
      const searchPromise = new Promise(resolve => { resolveSearch = resolve; });
      mockSearchAddresses.mockReturnValue(searchPromise);

      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          placeholder="Enter location"
        />
      );

      const input = screen.getByPlaceholderText('Enter location');
      
      // Type to trigger search
      act(() => {
        fireEvent.change(input, { target: { value: 'Brussels' } });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      // Should show loading indicator
      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-loading')).toBeInTheDocument();
      });

      // Resolve search
      act(() => {
        resolveSearch!([{ coordinates: [4.3517, 50.8503], address: 'Brussels, Belgium', confidence: 0.9 }]);
      });

      // Should hide loading indicator and show results
      await waitFor(() => {
        expect(screen.queryByTestId('autocomplete-loading')).not.toBeInTheDocument();
        expect(screen.getByText('Brussels, Belgium')).toBeInTheDocument();
      });
    });

    it('should show "no results" message when search returns empty', async () => {
      mockSearchAddresses.mockResolvedValue([]);

      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          placeholder="Enter location"
        />
      );

      const input = screen.getByPlaceholderText('Enter location');
      
      // Type to trigger search
      act(() => {
        fireEvent.change(input, { target: { value: 'Nonexistent Place' } });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should handle search errors gracefully', async () => {
      mockSearchAddresses.mockRejectedValue(new Error('Search service unavailable'));

      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          placeholder="Enter location"
        />
      );

      const input = screen.getByPlaceholderText('Enter location');
      
      // Type to trigger search
      act(() => {
        fireEvent.change(input, { target: { value: 'Brussels' } });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText(/search failed/i)).toBeInTheDocument();
      });

      // Should not crash the component
      expect(input).toBeInTheDocument();
    });

    it('should allow retry after error', async () => {
      // First call fails, second succeeds
      mockSearchAddresses
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([{ coordinates: [4.3517, 50.8503], address: 'Brussels, Belgium', confidence: 0.9 }]);

      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          onSelect={mockOnSelect}
          placeholder="Enter location"
        />
      );

      const input = screen.getByPlaceholderText('Enter location');
      
      // First attempt - should fail
      act(() => {
        fireEvent.change(input, { target: { value: 'Brussels' } });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText(/search failed/i)).toBeInTheDocument();
      });

      // Second attempt - should succeed
      act(() => {
        fireEvent.change(input, { target: { value: 'Brussels Belgium' } });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Brussels, Belgium')).toBeInTheDocument();
        expect(screen.queryByText(/search failed/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Click outside behavior', () => {
    it('should close dropdown when clicking outside', async () => {
      mockSearchAddresses.mockResolvedValue([
        { coordinates: [4.3517, 50.8503], address: 'Brussels, Belgium', confidence: 0.9 }
      ]);

      const mockOnChange = vi.fn();
      const mockOnSelect = vi.fn();

      render(
        <div>
          <AutocompleteInput
            value=""
            onChange={mockOnChange}
            onSelect={mockOnSelect}
            placeholder="Enter location"
          />
          <div data-testid="outside-element">Outside</div>
        </div>
      );

      const input = screen.getByPlaceholderText('Enter location');
      
      // Type to show suggestions
      act(() => {
        fireEvent.change(input, { target: { value: 'Brussels' } });
      });

      act(() => {
        vi.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-dropdown')).toBeInTheDocument();
      });

      // Click outside
      act(() => {
        fireEvent.click(screen.getByTestId('outside-element'));
      });

      // Should close dropdown
      expect(screen.queryByTestId('autocomplete-dropdown')).not.toBeInTheDocument();
    });
  });
});