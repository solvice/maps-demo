"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { Coordinates } from "@/lib/coordinates";
import { useMapContext } from "@/contexts/map-context";

interface MarkerProps {
  coordinates: Coordinates;
  type: "origin" | "destination" | "waypoint";
  content?: string;
  onClick?: () => void;
  onDelete?: () => void;
  onDragStart?: (type: "origin" | "destination" | "waypoint") => void;
  onDrag?: (coordinates: Coordinates, type: "origin" | "destination" | "waypoint") => void;
  onDragEnd?: (
    coordinates: Coordinates,
    type: "origin" | "destination" | "waypoint",
  ) => void;
}

export function Marker({
  coordinates,
  type,
  content,
  onClick,
  onDelete,
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

      // Add content or default dot
      if (content) {
        const label = document.createElement("div");
        label.textContent = content;
        label.style.cssText = `
          color: white !important;
          font-size: 12px !important;
          font-weight: bold !important;
          position: absolute !important;
          top: 40% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          text-align: center !important;
        `;
        el.appendChild(label);
      } else {
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
    } else if (type === "destination") {
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

      // Add content or default dot
      if (content) {
        const label = document.createElement("div");
        label.textContent = content;
        label.style.cssText = `
          color: white !important;
          font-size: 12px !important;
          font-weight: bold !important;
          position: absolute !important;
          top: 40% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          text-align: center !important;
        `;
        el.appendChild(label);
      } else {
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
    } else if (type === "waypoint") {
      el.style.cssText = `
        width: 25px !important;
        height: 25px !important;
        background-color: #3b82f6 !important;
        border: 2px solid white !important;
        border-radius: 50% !important;
        cursor: pointer !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
        position: relative !important;
        z-index: 1000 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
      `;

      // Add waypoint number or default content
      const label = document.createElement("div");
      label.textContent = content || "•";
      label.style.cssText = `
        color: white !important;
        font-size: 10px !important;
        font-weight: bold !important;
        text-align: center !important;
        line-height: 1 !important;
      `;
      el.appendChild(label);

      // Add delete button for waypoints
      if (onDelete) {
        const deleteBtn = document.createElement("div");
        deleteBtn.textContent = "×";
        deleteBtn.style.cssText = `
          position: absolute !important;
          top: -8px !important;
          right: -8px !important;
          width: 16px !important;
          height: 16px !important;
          background-color: #ef4444 !important;
          color: white !important;
          border-radius: 50% !important;
          font-size: 12px !important;
          font-weight: bold !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 1 !important;
          z-index: 1001 !important;
        `;
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          onDelete();
        });
        el.appendChild(deleteBtn);
      }
    }

    // Add data attributes for testing
    el.setAttribute('data-testid', `marker-${type}`);

    // Add click handler
    if (onClick) {
      el.addEventListener("click", onClick);
    }

    // Add touch event handlers for mobile
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };
    let longPressTimeout: NodeJS.Timeout;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartTime = Date.now();
      touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      
      // Set up long press for context menu on mobile
      longPressTimeout = setTimeout(() => {
        // Trigger context menu on long press
        const contextMenuEvent = new CustomEvent('contextmenu', {
          bubbles: true,
          cancelable: true,
        });
        el.dispatchEvent(contextMenuEvent);
      }, 500);
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Cancel long press if user moves finger too much
      const currentPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const distance = Math.sqrt(
        Math.pow(currentPos.x - touchStartPos.x, 2) + 
        Math.pow(currentPos.y - touchStartPos.y, 2)
      );
      
      if (distance > 10) { // 10px threshold
        clearTimeout(longPressTimeout);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      clearTimeout(longPressTimeout);
      
      // Convert touch to click if it was a quick tap
      const touchDuration = Date.now() - touchStartTime;
      if (touchDuration < 300) { // Quick tap
        const touch = e.changedTouches[0];
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: touch.clientX,
          clientY: touch.clientY,
        });
        el.dispatchEvent(clickEvent);
      }
    };

    // Add touch event listeners
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: false });

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
      // Clear any pending long press timeout
      clearTimeout(longPressTimeout);
      
      // Remove touch event listeners
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      
      if (markerRef.current) {
        markerRef.current.off("dragstart", handleDragStart);
        markerRef.current.off("drag", handleDrag);
        markerRef.current.off("dragend", handleDragEnd);
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [coordinates, type, content, map, onClick, onDelete, onDragStart, onDrag, onDragEnd]);

  // Update marker position when coordinates change
  useEffect(() => {
    if (markerRef.current && coordinates) {
      markerRef.current.setLngLat(coordinates);
    }
  }, [coordinates]);

  return null; // This component doesn't render anything directly
}
