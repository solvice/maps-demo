'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
// Remove lucide-react import

export interface RouteConfig {
  alternatives?: number;
  steps?: boolean;
  annotations?: string[];
  geometries?: 'polyline' | 'geojson' | 'polyline6';
  overview?: 'full' | 'simplified' | 'false';
  continue_straight?: boolean;
  snapping?: 'default' | 'any';
  vehicleType?: 'CAR' | 'BIKE' | 'TRUCK' | 'ELECTRIC_CAR' | 'ELECTRIC_BIKE';
  routingEngine?: 'OSM' | 'TOMTOM' | 'GOOGLE' | 'ANYMAP';
  departureTime?: string;
  interpolate?: boolean;
  generate_hints?: boolean;
}

interface RouteConfigProps {
  config: RouteConfig;
  onConfigChange: (config: RouteConfig) => void;
}

const DEFAULT_CONFIG: RouteConfig = {
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

export function RouteConfigPane({ config, onConfigChange }: RouteConfigProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateConfig = (updates: Partial<RouteConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const resetToDefaults = () => {
    onConfigChange(DEFAULT_CONFIG);
  };

  const annotationOptions = [
    { value: 'duration', label: 'Duration' },
    { value: 'distance', label: 'Distance' },
    { value: 'speed', label: 'Speed' },
    { value: 'nodes', label: 'Nodes' },
    { value: 'weight', label: 'Weight' },
  ];

  const toggleAnnotation = (annotation: string) => {
    const current = config.annotations || [];
    const updated = current.includes(annotation)
      ? current.filter(a => a !== annotation)
      : [...current, annotation];
    updateConfig({ annotations: updated });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="absolute bottom-4 left-4 z-20 bg-white shadow-lg min-h-[44px] min-w-[44px]" // Enhanced touch target
          data-testid="route-config-trigger"
        >
          ⚙️ Config
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-96 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Route Configuration</SheetTitle>
          <SheetDescription>
            Configure routing parameters for the Solvice API
          </SheetDescription>
        </SheetHeader>
        
        <div className="space-y-6 py-4">
          {/* Basic Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="alternatives">Alternative Routes</Label>
                <Input
                  id="alternatives"
                  type="number"
                  min="0"
                  max="3"
                  value={config.alternatives || 1}
                  onChange={(e) => updateConfig({ alternatives: parseInt(e.target.value) || 1 })}
                  placeholder="Number of alternative routes"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle-type">Vehicle Type</Label>
                <Select
                  value={config.vehicleType || 'CAR'}
                  onValueChange={(value) => updateConfig({ vehicleType: value as RouteConfig['vehicleType'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAR">Car</SelectItem>
                    <SelectItem value="BIKE">Bike</SelectItem>
                    <SelectItem value="TRUCK">Truck</SelectItem>
                    <SelectItem value="ELECTRIC_CAR">Electric Car</SelectItem>
                    <SelectItem value="ELECTRIC_BIKE">Electric Bike</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="routing-engine">Routing Engine</Label>
                <Select
                  value={config.routingEngine || 'OSM'}
                  onValueChange={(value) => updateConfig({ routingEngine: value as RouteConfig['routingEngine'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select routing engine" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OSM">OpenStreetMap</SelectItem>
                    <SelectItem value="TOMTOM">TomTom</SelectItem>
                    <SelectItem value="GOOGLE">Google</SelectItem>
                    <SelectItem value="ANYMAP">AnyMap</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Route Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Route Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="overview">Route Overview</Label>
                <Select
                  value={config.overview || 'full'}
                  onValueChange={(value) => updateConfig({ overview: value as RouteConfig['overview'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select overview level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="simplified">Simplified</SelectItem>
                    <SelectItem value="false">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="geometries">Geometry Format</Label>
                <Select
                  value={config.geometries || 'polyline'}
                  onValueChange={(value) => updateConfig({ geometries: value as RouteConfig['geometries'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select geometry format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="polyline">Polyline</SelectItem>
                    <SelectItem value="geojson">GeoJSON</SelectItem>
                    <SelectItem value="polyline6">Polyline6</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="snapping">Snapping</Label>
                <Select
                  value={config.snapping || 'default'}
                  onValueChange={(value) => updateConfig({ snapping: value as RouteConfig['snapping'] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select snapping mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Advanced Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Advanced Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="steps" className="flex flex-col space-y-1">
                  <span>Include Steps</span>
                  <span className="text-sm text-muted-foreground">Turn-by-turn instructions</span>
                </Label>
                <Switch
                  id="steps"
                  checked={config.steps || false}
                  onCheckedChange={(checked) => updateConfig({ steps: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="continue-straight" className="flex flex-col space-y-1">
                  <span>Continue Straight</span>
                  <span className="text-sm text-muted-foreground">Force straight at waypoints</span>
                </Label>
                <Switch
                  id="continue-straight"
                  checked={config.continue_straight !== false}
                  onCheckedChange={(checked) => updateConfig({ continue_straight: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="interpolate" className="flex flex-col space-y-1">
                  <span>Interpolate</span>
                  <span className="text-sm text-muted-foreground">Interpolate coordinates</span>
                </Label>
                <Switch
                  id="interpolate"
                  checked={config.interpolate || false}
                  onCheckedChange={(checked) => updateConfig({ interpolate: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="generate-hints" className="flex flex-col space-y-1">
                  <span>Generate Hints</span>
                  <span className="text-sm text-muted-foreground">Generate routing hints</span>
                </Label>
                <Switch
                  id="generate-hints"
                  checked={config.generate_hints || false}
                  onCheckedChange={(checked) => updateConfig({ generate_hints: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Annotations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Annotations</CardTitle>
              <CardDescription>
                Additional data to include in the response
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {annotationOptions.map((option) => (
                <div key={option.value} className="flex items-center justify-between">
                  <Label htmlFor={`annotation-${option.value}`}>
                    {option.label}
                  </Label>
                  <Switch
                    id={`annotation-${option.value}`}
                    checked={(config.annotations || []).includes(option.value)}
                    onCheckedChange={() => toggleAnnotation(option.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Time Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Time Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="departure-time">Departure Time</Label>
                <Input
                  id="departure-time"
                  type="datetime-local"
                  value={config.departureTime || ''}
                  onChange={(e) => updateConfig({ departureTime: e.target.value || undefined })}
                />
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="flex space-x-2">
            <Button onClick={resetToDefaults} variant="outline" className="flex-1">
              Reset to Defaults
            </Button>
            <Button onClick={() => setIsOpen(false)} className="flex-1">
              Apply Settings
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}