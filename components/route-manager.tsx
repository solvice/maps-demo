'use client';

import { useEffect } from 'react';
import { useMapContext } from '@/contexts/map-context';
import { RouteResponse } from '@/lib/solvice-api';
import { fitMapToRoute } from '@/lib/route-utils';

interface RouteManagerProps {
  route: RouteResponse | null;
  geometryFormat?: 'polyline' | 'geojson' | 'polyline6';
  autoZoom?: boolean;
}

export function RouteManager({ 
  route, 
  geometryFormat = 'polyline', 
  autoZoom = true 
}: RouteManagerProps) {
  const map = useMapContext();

  // Auto-zoom to route when route changes
  useEffect(() => {
    if (autoZoom && map && route) {
      const success = fitMapToRoute(map, route, { 
        geometryFormat, 
        padding: 50,
        animate: true 
      });
      
      if (success) {
        console.log('Auto-zoomed to route bounds');
      } else {
        console.warn('Failed to auto-zoom to route bounds');
      }
    }
  }, [map, route, geometryFormat, autoZoom]);

  // This component doesn't render anything visible
  return null;
}