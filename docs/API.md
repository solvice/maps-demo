# API Documentation

## Overview

This document provides comprehensive documentation for the Maps Demo application's internal APIs, including client-side functions, server-side endpoints, and integration patterns.

## Table of Contents

- [Client-Side APIs](#client-side-apis)
- [Server-Side Endpoints](#server-side-endpoints)
- [Custom Hooks](#custom-hooks)
- [Utility Functions](#utility-functions)
- [Type Definitions](#type-definitions)
- [Error Handling](#error-handling)
- [Usage Examples](#usage-examples)

## Client-Side APIs

### Route Calculation API

#### `calculateRoute(origin, destination, options)`

Calculates a route between two points using the Solvice API via the internal server proxy.

**Parameters:**
- `origin: Coordinates` - Starting point [longitude, latitude]
- `destination: Coordinates` - End point [longitude, latitude]
- `options: RouteConfig` - Optional routing configuration

**Returns:** `Promise<RouteResponse>`

**Example:**
```typescript
import { calculateRoute } from '@/lib/solvice-api';

const route = await calculateRoute(
  [4.3517, 50.8503], // Brussels
  [4.4024, 51.2194], // Antwerp
  {
    vehicleType: 'CAR',
    alternatives: 2,
    steps: true,
    geometries: 'polyline'
  }
);
```

**Error Handling:**
```typescript
try {
  const route = await calculateRoute(origin, destination, options);
} catch (error) {
  if (error.message.includes('Rate limit')) {
    // Handle rate limiting
  } else if (error.message.includes('Network')) {
    // Handle network errors
  } else {
    // Handle other errors
  }
}
```

### Geocoding API

#### `forwardGeocode(address)`

Converts an address string to coordinates.

**Parameters:**
- `address: string` - Address to geocode

**Returns:** `Promise<Coordinates>`

**Example:**
```typescript
import { forwardGeocode } from '@/lib/geocoding';

const coords = await forwardGeocode('Brussels, Belgium');
// Returns: [4.3517, 50.8503]
```

#### `reverseGeocode(coordinates)`

Converts coordinates to a human-readable address.

**Parameters:**
- `coordinates: Coordinates` - [longitude, latitude]

**Returns:** `Promise<string>`

**Example:**
```typescript
import { reverseGeocode } from '@/lib/geocoding';

const address = await reverseGeocode([4.3517, 50.8503]);
// Returns: "Brussels, Belgium"
```

### Coordinate Utilities

#### `isValidCoordinates(coords)`

Validates coordinate format and bounds.

**Parameters:**
- `coords: unknown` - Value to validate

**Returns:** `boolean`

**Example:**
```typescript
import { isValidCoordinates } from '@/lib/coordinates';

isValidCoordinates([4.3517, 50.8503]); // true
isValidCoordinates([181, 50.8503]); // false (longitude out of bounds)
isValidCoordinates('invalid'); // false
```

#### `formatCoordinates(coords, format)`

Formats coordinates for display.

**Parameters:**
- `coords: Coordinates` - [longitude, latitude]
- `format: 'decimal' | 'dms'` - Output format

**Returns:** `string`

**Example:**
```typescript
import { formatCoordinates } from '@/lib/coordinates';

formatCoordinates([4.3517, 50.8503], 'decimal');
// Returns: "4.3517°, 50.8503°"

formatCoordinates([4.3517, 50.8503], 'dms');
// Returns: "4°21'6\"E, 50°51'1\"N"
```

### Polyline Utilities

#### `decodePolyline(polyline, precision)`

Decodes Google polyline format to coordinate array.

**Parameters:**
- `polyline: string` - Encoded polyline
- `precision: number` - Decimal precision (default: 5)

**Returns:** `[number, number][]`

**Example:**
```typescript
import { decodePolyline } from '@/lib/polyline';

const coords = decodePolyline('u{~vFvyys@fS]');
// Returns: [[4.3517, 50.8503], [4.3518, 50.8504]]
```

#### `encodePolyline(coordinates, precision)`

Encodes coordinate array to Google polyline format.

**Parameters:**
- `coordinates: [number, number][]` - Array of [lng, lat] pairs
- `precision: number` - Decimal precision (default: 5)

**Returns:** `string`

**Example:**
```typescript
import { encodePolyline } from '@/lib/polyline';

const polyline = encodePolyline([[4.3517, 50.8503], [4.3518, 50.8504]]);
// Returns: "u{~vFvyys@fS]"
```

## Server-Side Endpoints

### POST /api/route

Proxies route calculation requests to the Solvice API with secure API key handling.

**Request Body:**
```typescript
{
  coordinates: [Coordinates, Coordinates], // [origin, destination]
  vehicleType?: 'CAR' | 'BIKE' | 'TRUCK' | 'ELECTRIC_CAR' | 'ELECTRIC_BIKE',
  alternatives?: number,
  steps?: boolean,
  annotations?: string[],
  geometries?: 'polyline' | 'geojson' | 'polyline6',
  routingEngine?: 'OSM' | 'TOMTOM' | 'GOOGLE' | 'ANYMAP',
  departureTime?: string,
  overview?: 'full' | 'simplified' | 'false'
}
```

**Response:**
```typescript
{
  routes: Array<{
    distance: number,
    duration: number,
    geometry: string,
    legs: Array<{
      distance: number,
      duration: number,
      steps?: Array<{
        distance: number,
        duration: number,
        geometry: string,
        instruction: string,
        name: string,
        mode: string
      }>,
      annotation?: {
        distance: number[],
        duration: number[]
      }
    }>
  }>,
  waypoints: Array<{
    distance: number,
    location: [number, number],
    name: string
  }>
}
```

**Error Responses:**
- `400 Bad Request` - Invalid coordinates or parameters
- `429 Too Many Requests` - Rate limit exceeded
- `503 Service Unavailable` - API key not configured
- `500 Internal Server Error` - Solvice API error

**Example Usage:**
```typescript
const response = await fetch('/api/route', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    coordinates: [[4.3517, 50.8503], [4.4024, 51.2194]],
    vehicleType: 'CAR',
    steps: true
  })
});

const route = await response.json();
```

## Custom Hooks

### useRoute

Manages route calculation state with debouncing and error handling.

**Parameters:**
```typescript
interface UseRouteParams {
  origin: Coordinates | null;
  destination: Coordinates | null;
  config: RouteConfig;
}
```

**Returns:**
```typescript
interface UseRouteReturn {
  route: RouteResponse | null;
  isLoading: boolean;
  error: string | null;
  calculateRoute: (
    origin: Coordinates,
    destination: Coordinates,
    config: RouteConfig,
    debounceMs?: number
  ) => void;
}
```

**Example:**
```typescript
import { useRoute } from '@/hooks/use-route';

const {
  route,
  isLoading,
  error,
  calculateRoute
} = useRoute();

// Trigger route calculation
calculateRoute(
  [4.3517, 50.8503],
  [4.4024, 51.2194],
  { vehicleType: 'CAR' },
  300 // 300ms debounce
);
```

### useGeocoding

Handles address geocoding with autocomplete suggestions.

**Returns:**
```typescript
interface UseGeocodingReturn {
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  searchAddress: (query: string) => void;
  forwardGeocode: (address: string) => Promise<Coordinates>;
  reverseGeocode: (coords: Coordinates) => Promise<string>;
}
```

**Example:**
```typescript
import { useGeocoding } from '@/hooks/use-geocoding';

const {
  suggestions,
  isLoading,
  searchAddress,
  forwardGeocode
} = useGeocoding();

// Search for addresses
searchAddress('Brussels');

// Convert address to coordinates
const coords = await forwardGeocode('Brussels, Belgium');
```

### useGeolocation

Manages browser geolocation with permission handling.

**Returns:**
```typescript
interface UseGeolocationReturn {
  position: Coordinates | null;
  isLoading: boolean;
  error: string | null;
  getCurrentPosition: () => void;
}
```

**Example:**
```typescript
import { useGeolocation } from '@/hooks/use-geolocation';

const {
  position,
  isLoading,
  error,
  getCurrentPosition
} = useGeolocation();

// Get user's current location
getCurrentPosition();
```

### useCoordinates

Manages coordinate state with validation.

**Parameters:**
```typescript
interface UseCoordinatesParams {
  initialCoordinates?: Coordinates;
  onChange?: (coords: Coordinates) => void;
}
```

**Returns:**
```typescript
interface UseCoordinatesReturn {
  coordinates: Coordinates | null;
  setCoordinates: (coords: Coordinates) => void;
  isValid: boolean;
  formatted: string;
}
```

**Example:**
```typescript
import { useCoordinates } from '@/hooks/use-coordinates';

const {
  coordinates,
  setCoordinates,
  isValid,
  formatted
} = useCoordinates({
  initialCoordinates: [4.3517, 50.8503],
  onChange: (coords) => console.log('Coordinates changed:', coords)
});
```

## Utility Functions

### Formatting Utilities

#### `formatDistance(meters)`

Formats distance in user-friendly units.

**Parameters:**
- `meters: number` - Distance in meters

**Returns:** `string`

**Example:**
```typescript
import { formatDistance } from '@/lib/format';

formatDistance(1500); // "1.5 km"
formatDistance(500);  // "500 m"
```

#### `formatDuration(seconds)`

Formats duration in user-friendly format.

**Parameters:**
- `seconds: number` - Duration in seconds

**Returns:** `string`

**Example:**
```typescript
import { formatDuration } from '@/lib/format';

formatDuration(3661); // "1h 1m"
formatDuration(125);  // "2m 5s"
```

#### `formatSpeed(kmh)`

Formats speed with appropriate units.

**Parameters:**
- `kmh: number` - Speed in km/h

**Returns:** `string`

**Example:**
```typescript
import { formatSpeed } from '@/lib/format';

formatSpeed(50.5); // "51 km/h"
formatSpeed(5.2);  // "5 km/h"
```

### Map Utilities

#### `getBounds(coordinates)`

Calculates bounding box for coordinate array.

**Parameters:**
- `coordinates: [number, number][]` - Array of [lng, lat] pairs

**Returns:** `[[number, number], [number, number]]` - [[minLng, minLat], [maxLng, maxLat]]

**Example:**
```typescript
import { getBounds } from '@/lib/utils';

const bounds = getBounds([
  [4.3517, 50.8503],
  [4.4024, 51.2194]
]);
// Returns: [[4.3517, 50.8503], [4.4024, 51.2194]]
```

#### `getDistance(coord1, coord2)`

Calculates distance between two coordinates using Haversine formula.

**Parameters:**
- `coord1: Coordinates` - First coordinate
- `coord2: Coordinates` - Second coordinate

**Returns:** `number` - Distance in meters

**Example:**
```typescript
import { getDistance } from '@/lib/utils';

const distance = getDistance(
  [4.3517, 50.8503], // Brussels
  [4.4024, 51.2194]  // Antwerp
);
// Returns: ~87000 (87 km)
```

## Type Definitions

### Core Types

```typescript
// Basic coordinate type
type Coordinates = [number, number]; // [longitude, latitude]

// Route configuration
interface RouteConfig {
  vehicleType?: 'CAR' | 'BIKE' | 'TRUCK' | 'ELECTRIC_CAR' | 'ELECTRIC_BIKE';
  alternatives?: number;
  steps?: boolean;
  annotations?: string[];
  geometries?: 'polyline' | 'geojson' | 'polyline6';
  routingEngine?: 'OSM' | 'TOMTOM' | 'GOOGLE' | 'ANYMAP';
  departureTime?: string;
  overview?: 'full' | 'simplified' | 'false';
}

// Route response from Solvice API
interface RouteResponse {
  routes: Route[];
  waypoints: Waypoint[];
}

interface Route {
  distance: number;
  duration: number;
  geometry: string;
  legs: RouteLeg[];
}

interface RouteLeg {
  distance: number;
  duration: number;
  steps?: RouteStep[];
  annotation?: {
    distance: number[];
    duration: number[];
  };
}

interface RouteStep {
  distance: number;
  duration: number;
  geometry: string;
  instruction: string;
  name: string;
  mode: string;
}

interface Waypoint {
  distance: number;
  location: [number, number];
  name: string;
}
```

### Component Props

```typescript
// Map component props
interface MapProps {
  center: Coordinates;
  zoom: number;
  onLoad?: (map: maplibregl.Map) => void;
  onClick?: (coordinates: Coordinates) => void;
  children?: React.ReactNode;
}

// Marker component props
interface MarkerProps {
  coordinates: Coordinates;
  type: 'origin' | 'destination';
  draggable?: boolean;
  onDragEnd?: (coordinates: Coordinates) => void;
}

// Route layer props
interface RouteLayerProps {
  route: RouteResponse | null;
  highlightedRoute?: number | null;
  geometryFormat: 'polyline' | 'polyline6';
  style?: {
    color: string;
    width: number;
    opacity: number;
  };
}
```

## Error Handling

### Error Types

```typescript
// Custom error classes
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

class APIError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'APIError';
  }
}
```

### Error Classification

```typescript
export function classifyError(error: unknown): {
  type: 'validation' | 'network' | 'api' | 'unknown';
  message: string;
  userMessage: string;
} {
  if (error instanceof ValidationError) {
    return {
      type: 'validation',
      message: error.message,
      userMessage: 'Invalid input provided. Please check your data and try again.'
    };
  }
  
  if (error instanceof NetworkError) {
    return {
      type: 'network',
      message: error.message,
      userMessage: 'Network error. Please check your connection and try again.'
    };
  }
  
  if (error instanceof APIError) {
    return {
      type: 'api',
      message: error.message,
      userMessage: error.status === 429 
        ? 'Rate limit exceeded. Please try again later.'
        : 'Service error. Please try again later.'
    };
  }
  
  return {
    type: 'unknown',
    message: String(error),
    userMessage: 'An unexpected error occurred. Please try again.'
  };
}
```

## Usage Examples

### Complete Route Calculation Flow

```typescript
import { useRoute, useGeocoding } from '@/hooks';
import { calculateRoute } from '@/lib/solvice-api';

function RouteCalculationExample() {
  const { route, isLoading, error, calculateRoute } = useRoute();
  const { forwardGeocode } = useGeocoding();
  
  const handleCalculateRoute = async () => {
    try {
      // Geocode addresses
      const origin = await forwardGeocode('Brussels, Belgium');
      const destination = await forwardGeocode('Antwerp, Belgium');
      
      // Calculate route with options
      calculateRoute(origin, destination, {
        vehicleType: 'CAR',
        alternatives: 2,
        steps: true,
        geometries: 'polyline'
      });
    } catch (err) {
      console.error('Route calculation failed:', err);
    }
  };
  
  return (
    <div>
      <button onClick={handleCalculateRoute}>Calculate Route</button>
      {isLoading && <div>Calculating route...</div>}
      {error && <div>Error: {error}</div>}
      {route && (
        <div>
          <div>Distance: {formatDistance(route.routes[0].distance)}</div>
          <div>Duration: {formatDuration(route.routes[0].duration)}</div>
        </div>
      )}
    </div>
  );
}
```

### Interactive Map with Markers

```typescript
import { useState } from 'react';
import { Map, Marker, RouteLayer } from '@/components';
import { useRoute } from '@/hooks';

function InteractiveMapExample() {
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const { route, calculateRoute } = useRoute();
  
  const handleMapClick = (coords: Coordinates) => {
    if (!origin) {
      setOrigin(coords);
    } else if (!destination) {
      setDestination(coords);
      calculateRoute(origin, coords, { vehicleType: 'CAR' });
    } else {
      // Move closest marker
      const distToOrigin = getDistance(coords, origin);
      const distToDestination = getDistance(coords, destination);
      
      if (distToOrigin < distToDestination) {
        setOrigin(coords);
        calculateRoute(coords, destination, { vehicleType: 'CAR' });
      } else {
        setDestination(coords);
        calculateRoute(origin, coords, { vehicleType: 'CAR' });
      }
    }
  };
  
  return (
    <Map
      center={[4.3517, 50.8503]}
      zoom={10}
      onClick={handleMapClick}
    >
      {origin && (
        <Marker
          coordinates={origin}
          type="origin"
          draggable
          onDragEnd={(coords) => {
            setOrigin(coords);
            if (destination) {
              calculateRoute(coords, destination, { vehicleType: 'CAR' });
            }
          }}
        />
      )}
      {destination && (
        <Marker
          coordinates={destination}
          type="destination"
          draggable
          onDragEnd={(coords) => {
            setDestination(coords);
            if (origin) {
              calculateRoute(origin, coords, { vehicleType: 'CAR' });
            }
          }}
        />
      )}
      <RouteLayer
        route={route}
        geometryFormat="polyline"
      />
    </Map>
  );
}
```

### Form Integration with Validation

```typescript
import { useState, useEffect } from 'react';
import { useGeocoding, useCoordinates } from '@/hooks';
import { isValidCoordinates } from '@/lib/coordinates';

function RouteFormExample() {
  const [originAddress, setOriginAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  
  const { forwardGeocode, suggestions, searchAddress } = useGeocoding();
  
  const {
    coordinates: origin,
    setCoordinates: setOrigin,
    isValid: originValid
  } = useCoordinates();
  
  const {
    coordinates: destination,
    setCoordinates: setDestination,
    isValid: destinationValid
  } = useCoordinates();
  
  const handleOriginAddressChange = async (address: string) => {
    setOriginAddress(address);
    searchAddress(address); // For autocomplete
    
    if (address.length > 3) {
      try {
        const coords = await forwardGeocode(address);
        setOrigin(coords);
      } catch (error) {
        console.warn('Geocoding failed:', error);
      }
    }
  };
  
  const isFormValid = originValid && destinationValid;
  
  return (
    <form>
      <div>
        <label>Origin:</label>
        <input
          value={originAddress}
          onChange={(e) => handleOriginAddressChange(e.target.value)}
          placeholder="Enter starting location"
        />
        {origin && <div>✓ Valid coordinates: {origin.join(', ')}</div>}
      </div>
      
      <div>
        <label>Destination:</label>
        <input
          value={destinationAddress}
          onChange={(e) => handleDestinationAddressChange(e.target.value)}
          placeholder="Enter destination"
        />
        {destination && <div>✓ Valid coordinates: {destination.join(', ')}</div>}
      </div>
      
      <button type="submit" disabled={!isFormValid}>
        Calculate Route
      </button>
    </form>
  );
}
```

## Rate Limiting and Caching

### Client-Side Request Management

```typescript
// Request deduplication utility
class RequestManager {
  private activeRequests = new Map<string, Promise<any>>();
  
  async makeRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key)!;
    }
    
    const promise = requestFn().finally(() => {
      this.activeRequests.delete(key);
    });
    
    this.activeRequests.set(key, promise);
    return promise;
  }
}

const requestManager = new RequestManager();

// Usage in API calls
export async function calculateRoute(origin, destination, options) {
  const key = `route:${JSON.stringify([origin, destination, options])}`;
  
  return requestManager.makeRequest(key, async () => {
    const response = await fetch('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: [origin, destination], ...options })
    });
    
    return response.json();
  });
}
```

### Server-Side Rate Limiting

```typescript
// Rate limiting implementation
import { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per hour
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(request: NextRequest): boolean {
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  
  const current = rateLimitMap.get(ip);
  
  if (!current || current.resetTime < windowStart) {
    rateLimitMap.set(ip, { count: 1, resetTime: now });
    return true;
  }
  
  if (current.count >= RATE_LIMIT) {
    return false;
  }
  
  current.count++;
  return true;
}
```

This API documentation provides comprehensive coverage of all internal APIs, utilities, and integration patterns used in the Maps Demo application. It serves as a reference for developers working with the codebase and demonstrates best practices for API design and documentation.