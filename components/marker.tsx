"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Coordinates } from "@/lib/coordinates";
import { useMapContext } from "@/contexts/map-context";

interface MarkerProps {
  coordinates: Coordinates;
  type: "origin" | "destination";
  onClick?: () => void;
  onDragStart?: (type: "origin" | "destination") => void;
  onDrag?: (coordinates: Coordinates, type: "origin" | "destination") => void;
  onDragEnd?: (
    coordinates: Coordinates,
    type: "origin" | "destination",
  ) => void;
}

export function Marker({
  coordinates,
  type,
  onClick,
  onDragStart,
  onDrag,
  onDragEnd,
}: MarkerProps) {
  const map = useMapContext();
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!map || !coordinates) return;

    // Create marker element
    const el = document.createElement("div");
    el.className = `custom-marker marker-${type}`;

    // Create beautiful pin-style markers
    if (type === "origin") {
      el.style.cssText = `
        width: 30px !important;
        height: 30px !important;
        background-color: #10b981 !important;
        border: 3px solid white !important;
        border-radius: 50% 50% 50% 0 !important;
        cursor: pointer !important;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3) !important;
        position: relative !important;
        z-index: 1000 !important;
      `;

      // Add a white dot in the center
      const dot = document.createElement("div");
      dot.style.cssText = `
        width: 8px !important;
        height: 8px !important;
        background-color: white !important;
        border-radius: 50% !important;
        position: absolute !important;
        top: 40% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
      `;
      el.appendChild(dot);
    } else {
      el.style.cssText = `
        width: 30px !important;
        height: 30px !important;
        background-color: #dc2626 !important;
        border: 3px solid white !important;
        border-radius: 50% 50% 50% 0 !important;
        cursor: pointer !important;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3) !important;
        position: relative !important;
        z-index: 1000 !important;
      `;

      // Add a white dot in the center
      const dot = document.createElement("div");
      dot.style.cssText = `
        width: 8px !important;
        height: 8px !important;
        background-color: white !important;
        border-radius: 50% !important;
        position: absolute !important;
        top: 40% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
      `;
      el.appendChild(dot);
    }

    // Add click handler
    if (onClick) {
      el.addEventListener("click", onClick);
    }

    // Create and add marker (v3+ syntax)
    const marker = new maplibregl.Marker({
      element: el,
      anchor: "bottom",
    })
      .setLngLat(coordinates)
      .setDraggable(true)
      .addTo(map);

    // Add drag event handlers
    const handleDragStart = () => {
      // Disable map dragging during marker drag
      if (map && "dragging" in map && map.dragging) {
        (map.dragging as { disable: () => void }).disable();
      }
      if (onDragStart) {
        onDragStart(type);
      }
    };

    const handleDrag = () => {
      if (markerRef.current) {
        const lngLat = markerRef.current.getLngLat();
        const coords: Coordinates = [lngLat.lng, lngLat.lat];
        if (onDrag) {
          onDrag(coords, type);
        }
      }
    };

    const handleDragEnd = () => {
      // Re-enable map dragging
      if (map && "dragging" in map && map.dragging) {
        (map.dragging as { enable: () => void }).enable();
      }
      if (markerRef.current) {
        const lngLat = markerRef.current.getLngLat();
        const coords: Coordinates = [lngLat.lng, lngLat.lat];
        if (onDragEnd) {
          onDragEnd(coords, type);
        }
      }
    };

    // Register drag events
    marker.on("dragstart", handleDragStart);
    marker.on("drag", handleDrag);
    marker.on("dragend", handleDragEnd);

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        markerRef.current.off("dragstart", handleDragStart);
        markerRef.current.off("drag", handleDrag);
        markerRef.current.off("dragend", handleDragEnd);
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [coordinates, type, map, onClick, onDragStart, onDrag, onDragEnd]);

  // Update marker position when coordinates change
  useEffect(() => {
    if (markerRef.current && coordinates) {
      markerRef.current.setLngLat(coordinates);
    }
  }, [coordinates]);

  return null; // This component doesn't render anything directly
}
