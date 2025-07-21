'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapProvider } from '@/contexts/map-context';

interface MapProps {
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  onLoad?: (map: maplibregl.Map) => void;
  onError?: (error: Error) => void;
  onClick?: (coordinates: [number, number]) => void;
  children?: React.ReactNode;
}

export function Map({ 
  center = [3.7174, 51.0543], // Ghent fallback
  zoom = 12, 
  onLoad,
  onError,
  onClick,
  children
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://cdn.solvice.io/styles/grayscale.json',
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

      // Disable map's default context menu to allow our custom one
      map.current.getCanvasContainer().oncontextmenu = null;

      // Handle resize
      const handleResize = () => {
        if (map.current) {
          map.current.resize();
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
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

  // Update center when it changes
  useEffect(() => {
    if (map.current && isLoaded) {
      map.current.setCenter(center);
    }
  }, [center, isLoaded]);

  return (
    <MapProvider value={map.current}>
      <div 
        ref={mapContainer} 
        className="h-full w-full"
        data-testid="map-container"
      />
      {isLoaded && children}
    </MapProvider>
  );
}