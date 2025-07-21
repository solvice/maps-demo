'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Car, Bike, Truck } from 'lucide-react';

export interface VehicleSelectorProps {
  vehicleType: string | undefined;
  onVehicleTypeChange: (value: string) => void;
}

export function VehicleSelector({ vehicleType, onVehicleTypeChange }: VehicleSelectorProps) {
  return (
    <div className="flex justify-center">
      <ToggleGroup
        type="single"
        value={vehicleType || 'CAR'}
        onValueChange={(value) => value && onVehicleTypeChange(value)}
        className="justify-center"
        data-testid="vehicle-type-toggle"
      >
        <ToggleGroupItem value="CAR" aria-label="Car" className="flex items-center justify-center">
          <Car className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="TRUCK" aria-label="Truck" className="flex items-center justify-center">
          <Truck className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="BIKE" aria-label="Bike" className="flex items-center justify-center">
          <Bike className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}