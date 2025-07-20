'use client';

import React, { useRef, useEffect } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useMapContext } from '@/contexts/map-context';

type Coordinates = [number, number];

interface MapContextMenuProps {
  children: React.ReactNode;
  onSetOrigin: (coordinates: Coordinates) => void;
  onSetDestination: (coordinates: Coordinates) => void;
  className?: string;
}

export function MapContextMenu({
  children,
  onSetOrigin,
  onSetDestination,
  className,
}: MapContextMenuProps) {
  const contextCoordinatesRef = useRef<Coordinates | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const map = useMapContext();

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      console.warn('MapContextMenu: trigger ref not available');
      return;
    }

    if (!map) {
      console.warn('MapContextMenu: map context not available');
      return;
    }

    console.log('MapContextMenu: Setting up context menu handler');

    const handleContextMenu = (event: MouseEvent) => {
      console.log('MapContextMenu: Context menu triggered');
      
      // Try to find the map container or the map canvas
      const mapContainer = trigger.querySelector('[data-testid="map-container"]') as HTMLElement;
      const mapCanvas = trigger.querySelector('canvas') as HTMLCanvasElement;
      
      if (!mapContainer && !mapCanvas) {
        console.warn('MapContextMenu: neither map container nor canvas found');
        return;
      }
      
      // Use the map container if available, otherwise fall back to the canvas
      const targetElement = mapContainer || mapCanvas;
      const rect = targetElement.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      console.log('MapContextMenu: Pixel coordinates:', { x, y });
      console.log('MapContextMenu: Target element:', targetElement.tagName);
      
      // Convert pixel coordinates to geographic coordinates using MapLibre
      try {
        const lngLat = map.unproject([x, y]);
        const coordinates: Coordinates = [lngLat.lng, lngLat.lat];
        contextCoordinatesRef.current = coordinates;
        console.log('MapContextMenu: Geographic coordinates:', coordinates);
      } catch (error) {
        console.error('MapContextMenu: Failed to unproject coordinates:', error);
      }
    };

    // Add event listener to the trigger element
    trigger.addEventListener('contextmenu', handleContextMenu);
    console.log('MapContextMenu: Event listener added to trigger');
    
    // Also add event listener to the map canvas for better coverage
    const addCanvasListener = () => {
      const mapCanvas = trigger.querySelector('canvas') as HTMLCanvasElement;
      if (mapCanvas) {
        mapCanvas.addEventListener('contextmenu', handleContextMenu);
        console.log('MapContextMenu: Event listener added to canvas');
        return mapCanvas;
      }
      return null;
    };

    // Try to add canvas listener immediately
    let canvas = addCanvasListener();
    
    // If canvas not found yet, wait for it to be created
    let timeoutId: NodeJS.Timeout | null = null;
    if (!canvas) {
      timeoutId = setTimeout(() => {
        canvas = addCanvasListener();
      }, 100);
    }
    
    return () => {
      trigger.removeEventListener('contextmenu', handleContextMenu);
      if (canvas) {
        canvas.removeEventListener('contextmenu', handleContextMenu);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      console.log('MapContextMenu: Event listeners removed');
    };
  }, [map]);

  const handleFromHere = () => {
    if (contextCoordinatesRef.current) {
      console.log('Setting origin from context menu:', contextCoordinatesRef.current);
      onSetOrigin(contextCoordinatesRef.current);
      contextCoordinatesRef.current = null;
    }
  };

  const handleToHere = () => {
    if (contextCoordinatesRef.current) {
      console.log('Setting destination from context menu:', contextCoordinatesRef.current);
      onSetDestination(contextCoordinatesRef.current);
      contextCoordinatesRef.current = null;
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div 
          ref={triggerRef}
          className={className}
          data-testid="map-context-trigger"
        >
          {children}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent data-testid="map-context-menu">
        <ContextMenuItem 
          onClick={handleFromHere}
          data-testid="context-from-here"
          className="cursor-pointer flex items-center gap-2"
        >
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          Origin
        </ContextMenuItem>
        <ContextMenuItem 
          onClick={handleToHere}
          data-testid="context-to-here"
          className="cursor-pointer flex items-center gap-2"
        >
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          Destination
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem disabled className="text-muted-foreground text-xs">
          Right-click anywhere on map
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}