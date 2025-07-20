import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the geocoding service
vi.mock('@/lib/geocoding', () => ({
  searchAddresses: vi.fn(),
}));

import { AutocompleteInput } from '@/components/autocomplete-input';

describe('Simple Autocomplete Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render autocomplete input', () => {
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

    expect(screen.getByPlaceholderText('Enter location')).toBeInTheDocument();
  });

  it('should not show dropdown initially', () => {
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

    expect(screen.queryByTestId('autocomplete-dropdown')).not.toBeInTheDocument();
  });
});