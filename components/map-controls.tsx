'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Map, Globe, Search, Layers, ToggleLeft, ToggleRight, Palette } from 'lucide-react';
import { RouteConfig } from './route-control-panel';

interface MapControlsProps {
  routeConfig: RouteConfig;
  onRouteConfigChange: (config: RouteConfig) => void;
  mapStyle: string;
  onMapStyleChange: (style: string) => void;
}

export function MapControls({ routeConfig, onRouteConfigChange, mapStyle, onMapStyleChange }: MapControlsProps) {
  const updateConfig = (updates: Partial<RouteConfig>) => {
    onRouteConfigChange({ ...routeConfig, ...updates });
  };

  const mapStyles = [
    { id: 'light', name: 'Light', url: 'https://maps.solvice.io/tiles/styles/light.json' },
    { id: 'dark', name: 'Dark', url: 'https://maps.solvice.io/tiles/styles/dark.json' },
    { id: 'satellite', name: 'Satellite', url: 'https://maps.solvice.io/tiles/styles/satellite.json' },
    { id: 'terrain', name: 'Terrain', url: 'https://maps.solvice.io/tiles/styles/terrain.json' }
  ];

  const getCurrentStyleIndex = () => {
    const currentIndex = mapStyles.findIndex(style => style.url === mapStyle);
    return currentIndex >= 0 ? currentIndex : 0;
  };

  const cycleMapStyle = () => {
    const currentIndex = getCurrentStyleIndex();
    const nextIndex = (currentIndex + 1) % mapStyles.length;
    onMapStyleChange(mapStyles[nextIndex].url);
  };

  const getCurrentStyleName = () => {
    const currentStyle = mapStyles.find(style => style.url === mapStyle);
    return currentStyle?.name || 'Light';
  };

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      {/* Map Style Control */}
      <Card className="p-1 shadow-lg">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={cycleMapStyle}
          title={`Map Style: ${getCurrentStyleName()} (click to cycle)`}
        >
          <Palette className="h-4 w-4" />
        </Button>
      </Card>
      {/* Routing Engine Control */}
      <Card className="p-1 shadow-lg">
        <div className="flex flex-col gap-1">
          <Button
            variant={routeConfig.routingEngine === 'OSM' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => updateConfig({ routingEngine: 'OSM' })}
            title="OpenStreetMap - Free open source routing"
          >
            <Map className="h-4 w-4" />
          </Button>
          <Button
            variant={routeConfig.routingEngine === 'TOMTOM' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => updateConfig({ routingEngine: 'TOMTOM' })}
            title="TomTom - Commercial routing engine"
          >
            <Globe className="h-4 w-4" />
          </Button>
          <Button
            variant={routeConfig.routingEngine === 'GOOGLE' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => updateConfig({ routingEngine: 'GOOGLE' })}
            title="Google Maps - Google routing engine"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant={routeConfig.routingEngine === 'ANYMAP' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => updateConfig({ routingEngine: 'ANYMAP' })}
            title="AnyMap - Hybrid routing engine"
          >
            <Layers className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Alternative Routes Control */}
      <Card className="p-1 shadow-lg">
        <div className="flex flex-col gap-1">
          <Button
            variant={(routeConfig.alternatives || 1) === 1 ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0 text-xs font-medium"
            onClick={() => updateConfig({ alternatives: 1 })}
            title="Show only main route"
          >
            1
          </Button>
          <Button
            variant={(routeConfig.alternatives || 1) === 2 ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0 text-xs font-medium"
            onClick={() => updateConfig({ alternatives: 2 })}
            title="Show main route + 1 alternative"
          >
            2
          </Button>
        </div>
      </Card>

      {/* Geometry Format Control */}
      <Card className="p-1 shadow-lg">
        <div className="flex flex-col gap-1">
          <Button
            variant={(routeConfig.geometries || 'polyline') === 'polyline' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0 text-xs font-medium"
            onClick={() => updateConfig({ geometries: 'polyline' })}
            title="Polyline format (5 decimal precision)"
          >
            P5
          </Button>
          <Button
            variant={(routeConfig.geometries || 'polyline') === 'polyline6' ? 'default' : 'outline'}
            size="sm"
            className="h-8 w-8 p-0 text-xs font-medium"
            onClick={() => updateConfig({ geometries: 'polyline6' })}
            title="Polyline6 format (6 decimal precision)"
          >
            P6
          </Button>
        </div>
      </Card>

      {/* Steps Toggle Control */}
      <Card className="p-1 shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => updateConfig({ steps: !routeConfig.steps })}
          title={routeConfig.steps ? 'Disable turn-by-turn steps' : 'Enable turn-by-turn steps'}
        >
          {routeConfig.steps ? (
            <ToggleRight className="h-4 w-4 text-blue-600" />
          ) : (
            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </Card>
    </div>
  );
}