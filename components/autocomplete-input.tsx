'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
// import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { searchAddresses } from '@/lib/geocoding';
import { Coordinates } from '@/lib/coordinates';
import { cn } from '@/lib/utils';

interface GeocodingResult {
  coordinates: Coordinates;
  address: string;
  confidence: number;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: GeocodingResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder = "Enter location",
  className,
  disabled = false,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestRef = useRef<number>(0);

  // Debounced search function
  const searchDebounced = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      const requestId = Date.now();
      currentRequestRef.current = requestId;

      setLoading(true);
      setError(null);

      try {
        const results = await searchAddresses(query.trim());
        
        // Only update if this is still the current request
        if (currentRequestRef.current === requestId) {
          setSuggestions(results);
          setIsOpen(true);
          setLoading(false);
          setHighlightedIndex(-1);
        }
      } catch (err) {
        // Only update if this is still the current request
        if (currentRequestRef.current === requestId) {
          setError(err instanceof Error ? err.message : 'Search failed');
          setSuggestions([]);
          setIsOpen(true);
          setLoading(false);
        }
      }
    }, 300);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    if (newValue.trim().length === 0) {
      setIsOpen(false);
      setSuggestions([]);
      setError(null);
    } else {
      searchDebounced(newValue);
    }
  };

  // Handle suggestion selection
  const handleSelect = (result: GeocodingResult) => {
    onChange(result.address);
    onSelect(result);
    setIsOpen(false);
    setSuggestions([]);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        autoComplete="off"
      />
      
      {isOpen && (
        <div 
          data-testid="autocomplete-dropdown"
          className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {loading && (
            <div data-testid="autocomplete-loading" className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <span className="ml-2 text-sm text-gray-600">Searching...</span>
            </div>
          )}
          
          {error && (
            <div className="p-4 text-sm text-red-600">
              Search failed: {error}
            </div>
          )}
          
          {!loading && !error && suggestions.length === 0 && (
            <div className="p-4 text-sm text-gray-500">No results found.</div>
          )}
          
          {!loading && !error && suggestions.length > 0 && (
            <div className="py-1">
              {suggestions.map((result, index) => (
                <div
                  key={`${result.address}-${index}`}
                  data-testid={`autocomplete-item-${index}`}
                  className={cn(
                    "cursor-pointer px-3 py-2 text-sm hover:bg-gray-100",
                    highlightedIndex === index && "highlighted bg-gray-100"
                  )}
                  onClick={() => handleSelect(result)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{result.address}</span>
                    <span className="text-xs text-gray-500">
                      Confidence: {Math.round(result.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}