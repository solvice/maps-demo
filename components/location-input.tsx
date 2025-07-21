'use client';

import React from 'react';
import { X } from 'lucide-react';
import { AutocompleteInput } from '@/components/autocomplete-input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Coordinates = [number, number];

interface GeocodingResult {
  coordinates: Coordinates;
  address: string;
  confidence: number;
}

interface LocationInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (result: GeocodingResult) => void;
  onClear?: () => void;
  indicatorColor: string;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function LocationInput({
  label,
  value,
  onChange,
  onSelect,
  onClear,
  indicatorColor,
  placeholder,
  error,
  disabled = false,
  className,
}: LocationInputProps) {
  const inputId = `${label.toLowerCase()}-input`;
  
  const handleClear = () => {
    onChange('');
    onClear?.();
  };

  return (
    <div className={cn('space-y-1', className)}>
      <Label htmlFor={inputId} className="text-xs font-medium flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full', indicatorColor)} />
        {label}
      </Label>
      <div className="relative">
        <AutocompleteInput
          id={inputId}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onSelect={onSelect}
          disabled={disabled}
          className={cn(
            error && 'border-red-500 focus:border-red-500',
          )}
          aria-invalid={error ? 'true' : 'false'}
        />
        {onClear && value && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
            onClick={handleClear}
            disabled={disabled}
            aria-label="Clear location"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      {error && (
        <div className="text-xs text-red-600" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}