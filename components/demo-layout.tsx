'use client';

import { ReactNode } from 'react';
import { MapWithContextMenu } from './map-with-context-menu';
import { MapControls } from './map-controls';
import { DemoTitlePane } from './demo-title-pane';
import { useState } from 'react';

interface DemoLayoutProps {
  children: ReactNode;
  sidePanel?: ReactNode;
  customTitlePane?: ReactNode;
  onClick?: (coordinates: [number, number]) => void;
  disableContextMenu?: boolean;
  // Multi-waypoint context menu props
  onSetOrigin?: (coordinates: [number, number]) => void;
  onSetDestination?: (coordinates: [number, number]) => void;
  onAddWaypoint?: (coordinates: [number, number]) => void;
  hasOrigin?: boolean;
  hasDestination?: boolean;
  waypointCount?: number;
}

export function DemoLayout({ 
  children, 
  sidePanel, 
  customTitlePane, 
  onClick, 
  disableContextMenu,
  onSetOrigin,
  onSetDestination,
  onAddWaypoint,
  hasOrigin,
  hasDestination,
  waypointCount
}: DemoLayoutProps) {
  const [mapStyle, setMapStyle] = useState('https://cdn.solvice.io/styles/grayscale.json');

  return (
    <div className="h-screen flex flex-col bg-transparent">
      {/* Side Panel (optional) */}
      {sidePanel && (
        <div className="bg-background border-b border-border">
          {sidePanel}
        </div>
      )}
      
      {/* Map Container */}
      <div className="flex-1 relative bg-transparent">
        <MapWithContextMenu 
          initialStyle={mapStyle}
          onStyleChange={setMapStyle}
          onClick={onClick}
          disableContextMenu={disableContextMenu}
          onSetOrigin={onSetOrigin}
          onSetDestination={onSetDestination}
          onAddWaypoint={onAddWaypoint}
          hasOrigin={hasOrigin}
          hasDestination={hasDestination}
          waypointCount={waypointCount}
        >
          {/* Title Pane - centered at top */}
          {customTitlePane || <DemoTitlePane />}
          
          {/* Map Controls - bottom right */}
          <MapControls 
            mapStyle={mapStyle} 
            onMapStyleChange={setMapStyle} 
          />

          {/* Map Content - passed as children */}
          {children}
        </MapWithContextMenu>
      </div>
    </div>
  );
}