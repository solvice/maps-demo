'use client';

import { useState, useCallback } from 'react';
import { Coordinates, isValidCoordinates, findClosestCoordinate } from '@/lib/coordinates';

export interface CoordinateState {
  origin: Coordinates | null;
  destination: Coordinates | null;
}

export interface UseCoordinatesReturn {
  coordinates: CoordinateState;
  setOrigin: (coords: Coordinates | null) => void;
  setDestination: (coords: Coordinates | null) => void;
  setCoordinate: (type: 'origin' | 'destination', coords: Coordinates | null) => void;
  replaceClosest: (coords: Coordinates) => 'origin' | 'destination' | null;
  clear: () => void;
  hasOrigin: boolean;
  hasDestination: boolean;
  hasBoth: boolean;
  getCoordinatesArray: () => Coordinates[];
}

export function useCoordinates(): UseCoordinatesReturn {
  const [coordinates, setCoordinates] = useState<CoordinateState>({
    origin: null,
    destination: null,
  });

  const setOrigin = useCallback((coords: Coordinates | null) => {
    if (coords && !isValidCoordinates(coords)) {
      console.warn('Invalid origin coordinates:', coords);
      return;
    }
    setCoordinates(prev => ({ ...prev, origin: coords }));
  }, []);

  const setDestination = useCallback((coords: Coordinates | null) => {
    if (coords && !isValidCoordinates(coords)) {
      console.warn('Invalid destination coordinates:', coords);
      return;
    }
    setCoordinates(prev => ({ ...prev, destination: coords }));
  }, []);

  const setCoordinate = useCallback((type: 'origin' | 'destination', coords: Coordinates | null) => {
    if (type === 'origin') {
      setOrigin(coords);
    } else {
      setDestination(coords);
    }
  }, [setOrigin, setDestination]);

  const replaceClosest = useCallback((coords: Coordinates): 'origin' | 'destination' | null => {
    if (!isValidCoordinates(coords)) {
      console.warn('Invalid coordinates for replacement:', coords);
      return null;
    }

    const availableCoords: Array<{ coords: Coordinates; type: 'origin' | 'destination' }> = [];
    
    if (coordinates.origin) {
      availableCoords.push({ coords: coordinates.origin, type: 'origin' });
    }
    if (coordinates.destination) {
      availableCoords.push({ coords: coordinates.destination, type: 'destination' });
    }

    if (availableCoords.length === 0) {
      // No existing coordinates, set as origin
      setOrigin(coords);
      return 'origin';
    }

    const closest = findClosestCoordinate(
      coords, 
      availableCoords.map(item => item.coords)
    );

    if (closest) {
      const typeToReplace = availableCoords[closest.index].type;
      setCoordinate(typeToReplace, coords);
      return typeToReplace;
    }

    return null;
  }, [coordinates, setOrigin, setCoordinate]);

  const clear = useCallback(() => {
    setCoordinates({ origin: null, destination: null });
  }, []);

  const getCoordinatesArray = useCallback((): Coordinates[] => {
    const result: Coordinates[] = [];
    if (coordinates.origin) result.push(coordinates.origin);
    if (coordinates.destination) result.push(coordinates.destination);
    return result;
  }, [coordinates]);

  return {
    coordinates,
    setOrigin,
    setDestination,
    setCoordinate,
    replaceClosest,
    clear,
    hasOrigin: coordinates.origin !== null,
    hasDestination: coordinates.destination !== null,
    hasBoth: coordinates.origin !== null && coordinates.destination !== null,
    getCoordinatesArray,
  };
}