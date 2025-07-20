import { NextRequest, NextResponse } from 'next/server';
import { isValidCoordinates, Coordinates } from '@/lib/coordinates';

// Request format matches Solvice API OpenAPI spec (CreateRouteDto schema)
export interface RouteRequest {
  coordinates: Coordinates[];
  bearings?: number[][];
  radiuses?: number[];
  hints?: string[];
  generate_hints?: boolean;
  alternatives?: number;
  steps?: boolean;
  annotations?: string[];
  geometries?: 'polyline' | 'geojson' | 'polyline6';
  overview?: 'full' | 'simplified' | 'false';
  continue_straight?: boolean;
  approaches?: string[];
  waypoints?: number[];
  snapping?: 'default' | 'any';
  vehicleType?: 'CAR' | 'BIKE' | 'TRUCK' | 'ELECTRIC_CAR' | 'ELECTRIC_BIKE';
  routingEngine?: 'OSM' | 'TOMTOM' | 'GOOGLE' | 'ANYMAP';
  departureTime?: string;
  interpolate?: boolean;
}

// Response format matches Solvice API OpenAPI spec (RouteDto schema)
export interface RouteResponse {
  routes: {
    distance?: number;
    duration?: number;
    geometry?: string;
    legs?: {
      summary?: string;
      distance?: number;
      duration?: number;
      weight?: number;
      steps?: unknown[];
    }[];
    weight_name?: string;
    weight?: number;
  }[];
  waypoints: {
    hint?: string;
    distance?: number;
    name?: string;
    location: [number, number];
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: RouteRequest = await request.json();
    const { coordinates, ...optionalParams } = body;

    // Validate input coordinates array
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 coordinates are required' },
        { status: 400 }
      );
    }

    // Validate each coordinate
    for (let i = 0; i < coordinates.length; i++) {
      if (!isValidCoordinates(coordinates[i])) {
        return NextResponse.json(
          { error: `Invalid coordinates at index ${i}` },
          { status: 400 }
        );
      }
    }

    // Get API key from server environment
    const apiKey = process.env.SOLVICE_API_KEY;
    if (!apiKey) {
      console.error('SOLVICE_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Route calculation service is not configured' },
        { status: 503 }
      );
    }

    // Call Solvice API (correct endpoint from OpenAPI spec)
    const requestBody = {
      coordinates,
      ...optionalParams
    };

    const solviceResponse = await fetch('https://routing.solvice.io/route', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!solviceResponse.ok) {
      console.error('Solvice API error:', solviceResponse.status, solviceResponse.statusText);
      return NextResponse.json(
        { error: `Route calculation failed: ${solviceResponse.status} ${solviceResponse.statusText}` },
        { status: solviceResponse.status }
      );
    }

    const routeData: RouteResponse = await solviceResponse.json();

    if (!routeData.routes || routeData.routes.length === 0) {
      return NextResponse.json(
        { error: 'No routes found' },
        { status: 404 }
      );
    }

    return NextResponse.json(routeData);

  } catch (error) {
    console.error('Route API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}