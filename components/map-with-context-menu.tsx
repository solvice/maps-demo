'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapProvider } from '@/contexts/map-context';
import { cn } from '@/lib/utils';

interface MapProps {
  center?: [number, number] | undefined; // [longitude, latitude] or undefined to allow auto-zoom
  zoom?: number;
  style?: string;
  onLoad?: (map: maplibregl.Map) => void;
  onError?: (error: Error) => void;
  onClick?: (coordinates: [number, number]) => void;
  onSetOrigin?: (coordinates: [number, number]) => void;
  onSetDestination?: (coordinates: [number, number]) => void;
  children?: React.ReactNode;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  coordinates: [number, number] | null;
}

export function MapWithContextMenu({ 
  center = [3.7174, 51.0543], // Ghent fallback
  zoom = 12, 
  style: mapStyleUrl = 'https://cdn.solvice.io/styles/grayscale.json',
  onLoad,
  onError,
  onClick,
  onSetOrigin,
  onSetDestination,
  children
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    coordinates: null,
  });

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: mapStyleUrl,
        center: center,
        zoom: zoom,
        attributionControl: false,
      });

      map.current.on('load', () => {
        setIsLoaded(true);
        if (onLoad && map.current) {
          onLoad(map.current);
        }
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        if (onError) {
          onError(new Error(`Map error: ${e.error?.message || 'Unknown error'}`));
        }
      });

      // Add click handler
      if (onClick) {
        map.current.on('click', (e) => {
          const { lng, lat } = e.lngLat;
          onClick([lng, lat]);
        });
      }

      // Add context menu handler
      map.current.on('contextmenu', (e) => {
        e.preventDefault();
        const { lng, lat } = e.lngLat;
        const { x, y } = e.point;
        
        setContextMenu({
          visible: true,
          x: x,
          y: y,
          coordinates: [lng, lat],
        });
        
        console.log('Map context menu at:', { lng, lat, x, y });
      });

      // Handle resize and orientation changes
      const handleResize = () => {
        if (map.current) {
          // Add a small delay to ensure the viewport has adjusted
          setTimeout(() => {
            if (map.current) {
              map.current.resize();
            }
          }, 100);
        }
      };

      const handleOrientationChange = () => {
        // Handle orientation changes with longer delay
        setTimeout(() => {
          if (map.current) {
            map.current.resize();
          }
        }, 500);
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleOrientationChange);

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientationChange);
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    } catch (error) {
      console.error('Failed to initialize map:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once - intentionally omitting dependencies to avoid re-initialization

  // Update center when it changes (but not when center is undefined to allow auto-zoom)
  useEffect(() => {
    if (map.current && isLoaded && center) {
      map.current.setCenter(center);
    }
  }, [center, isLoaded]);

  // Update style when it changes
  useEffect(() => {
    if (map.current && isLoaded) {
      map.current.setStyle(mapStyleUrl);
    }
  }, [mapStyleUrl, isLoaded]);

  // Hide context menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(prev => ({ ...prev, visible: false }));
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('contextmenu', handleClickOutside);
      };
    }
  }, [contextMenu.visible]);

  const handleFromHere = () => {
    if (contextMenu.coordinates && onSetOrigin) {
      onSetOrigin(contextMenu.coordinates);
      console.log('Setting origin from context menu:', contextMenu.coordinates);
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  const handleToHere = () => {
    if (contextMenu.coordinates && onSetDestination) {
      onSetDestination(contextMenu.coordinates);
      console.log('Setting destination from context menu:', contextMenu.coordinates);
    }
    setContextMenu(prev => ({ ...prev, visible: false }));
  };

  return (
    <MapProvider value={map.current}>
      <div className="relative h-full w-full">
        <div 
          ref={mapContainer} 
          className="h-full w-full"
          data-testid="map-container"
        />
        {isLoaded && children}
        
        {/* Custom Context Menu styled like shadcn/ui */}
        {contextMenu.visible && (
          <div
            className={cn(
              "fixed z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            )}
            style={{
              left: contextMenu.x,
              top: contextMenu.y,
            }}
            data-testid="map-context-menu"
          >
            <div
              className={cn(
                "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
                "transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={handleFromHere}
              data-testid="context-from-here"
            >
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              Origin
            </div>
            <div
              className={cn(
                "relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
                "transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={handleToHere}
              data-testid="context-to-here"
            >
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              Destination
            </div>
            <div className="h-px my-1 -mx-1 bg-border"></div>
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              Right-click anywhere on map
            </div>
          </div>
        )}
      </div>
    </MapProvider>
  );
}