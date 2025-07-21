import { NextRequest, NextResponse } from 'next/server';
import { isValidCoordinates, Coordinates } from '@/lib/coordinates';

// Request format matches Solvice API OpenAPI spec (CreateTableDto schema)
export interface TableRequest {
  coordinates: Coordinates[];
  sources?: number[];
  destinations?: number[];
  annotations?: string[];
  vehicleType?: 'CAR' | 'BIKE' | 'TRUCK' | 'ELECTRIC_CAR' | 'ELECTRIC_BIKE';
  engine?: 'OSM' | 'TOMTOM' | 'GOOGLE' | 'ANYMAP';
  departureTime?: string;
  interpolate?: boolean;
}

// Response format matches Solvice API OpenAPI spec (TableResponseDto schema)
export interface TableResponse {
  tableId: number;
  durations?: number[][];
  distances?: number[][];
  sources?: {
    hint?: string;
    distance?: number;
    name?: string;
    location: [number, number];
  }[];
  destinations?: {
    hint?: string;
    distance?: number;
    name?: string;
    location: [number, number];
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: TableRequest = await request.json();
    const { coordinates, sources, destinations, ...optionalParams } = body;

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

    // Validate sources and destinations indices if provided
    if (sources) {
      for (const source of sources) {
        if (source < 0 || source >= coordinates.length) {
          return NextResponse.json(
            { error: `Invalid source index: ${source}` },
            { status: 400 }
          );
        }
      }
    }

    if (destinations) {
      for (const destination of destinations) {
        if (destination < 0 || destination >= coordinates.length) {
          return NextResponse.json(
            { error: `Invalid destination index: ${destination}` },
            { status: 400 }
          );
        }
      }
    }

    // Check matrix size limit (50x50 API constraint)
    const sourceCount = sources?.length || coordinates.length;
    const destinationCount = destinations?.length || coordinates.length;
    if (sourceCount > 50 || destinationCount > 50) {
      return NextResponse.json(
        { error: 'Matrix size exceeds 50x50 limit' },
        { status: 400 }
      );
    }

    // Get API key from server environment
    const apiKey = process.env.SOLVICE_API_KEY;
    if (!apiKey) {
      console.error('SOLVICE_API_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Table calculation service is not configured' },
        { status: 503 }
      );
    }

    // Call Solvice API
    const requestBody = {
      coordinates,
      sources,
      destinations,
      ...optionalParams
    };

    const solviceResponse = await fetch('https://routing.solvice.io/table/sync', {
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
        { error: `Table calculation failed: ${solviceResponse.status} ${solviceResponse.statusText}` },
        { status: solviceResponse.status }
      );
    }

    const tableData: TableResponse = await solviceResponse.json();

    if (!tableData.durations && !tableData.distances) {
      return NextResponse.json(
        { error: 'No table data found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tableData);

  } catch (error) {
    console.error('Table API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}