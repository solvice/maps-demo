'use client';

import { createContext, useContext } from 'react';
import maplibregl from 'maplibre-gl';

const MapContext = createContext<maplibregl.Map | null>(null);

export const MapProvider = MapContext.Provider;

export function useMapContext() {
  return useContext(MapContext);
}