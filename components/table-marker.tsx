"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Coordinates } from "@/lib/coordinates";
import { useMapContext } from "@/contexts/map-context";

interface TableMarkerProps {
  coordinates: Coordinates;
  index: number;
  onHover?: (index: number | null) => void;
}

export function TableMarker({
  coordinates,
  index,
  onHover,
}: TableMarkerProps) {
  const map = useMapContext();
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!map || !coordinates) {
      return;
    }

    // Wait for map to be fully loaded before adding marker
    if (!map.isStyleLoaded()) {
      const onStyleLoad = () => {
        createMarker();
      };
      map.once('style.load', onStyleLoad);
      return () => {
        map.off('style.load', onStyleLoad);
      };
    }

    createMarker();

    function createMarker() {
      // Create single element - no container to avoid positioning issues
      const el = document.createElement("div");
      el.className = `table-marker`;
      
      // Simple blue circle marker - exact size for perfect centering
      el.style.cssText = `
        width: 14px !important;
        height: 14px !important;
        background-color: #3b82f6 !important;
        border: 2px solid white !important;
        border-radius: 50% !important;
        cursor: pointer !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.25) !important;
        transition: all 0.2s ease !important;
        box-sizing: border-box !important;
      `;

      // Add hover effect directly on the element
      const handleMouseEnter = () => {
        el.style.width = '18px';
        el.style.height = '18px';
        el.style.transform = 'scale(1.1)';
        if (onHover) onHover(index);
      };

      const handleMouseLeave = () => {
        el.style.width = '14px';
        el.style.height = '14px';
        el.style.transform = 'scale(1)';
        if (onHover) onHover(null);
      };

      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);

      // Add tooltip with coordinates
      el.title = `Lat: ${coordinates[1].toFixed(4)}, Lng: ${coordinates[0].toFixed(4)}`;

      // Add data attributes for testing
      el.setAttribute('data-testid', `table-marker-${index}`);

      // Create and add marker using the element directly with offset
      const marker = new maplibregl.Marker({
        element: el,
        offset: [0, 0],
      })
        .setLngLat(coordinates)
        .addTo(map);

      markerRef.current = marker;
    }

    // Return cleanup function
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [coordinates, index, map, onHover]);

  // Update marker position when coordinates change
  useEffect(() => {
    if (markerRef.current && coordinates) {
      markerRef.current.setLngLat(coordinates);
    }
  }, [coordinates]);

  return null;
}