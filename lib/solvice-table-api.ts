import { Coordinates, isValidCoordinates } from './coordinates';

// Request format matches Solvice API OpenAPI spec (CreateTableDto schema)
export interface CreateTableOptions {
  sources?: number[];
  destinations?: number[];
  annotations?: string[];
  vehicleType?: 'CAR' | 'BIKE' | 'TRUCK' | 'ELECTRIC_CAR' | 'ELECTRIC_BIKE';
  engine?: 'OSM' | 'TOMTOM' | 'GOOGLE' | 'ANYMAP';
  departureTime?: string;
  interpolate?: boolean;
}

// Waypoint interface matches Solvice API
export interface Waypoint {
  distance: number;
  name: string;
  location: [number, number];
  hint: string;
}

// Response format matches Solvice API OpenAPI spec (TableResponseDto schema)
export interface TableResponse {
  tableId: number;
  durations?: number[][];
  distances?: number[][];
  sources?: Waypoint[];
  destinations?: Waypoint[];
}

export async function calculateTable(
  coordinates: Coordinates[],
  options?: CreateTableOptions
): Promise<TableResponse> {
  // Validate coordinates before making API call
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error('At least 2 coordinates are required');
  }

  for (let i = 0; i < coordinates.length; i++) {
    if (!isValidCoordinates(coordinates[i])) {
      throw new Error(`Invalid coordinates at index ${i}`);
    }
  }

  // Validate sources and destinations indices if provided
  if (options?.sources) {
    for (const source of options.sources) {
      if (source < 0 || source >= coordinates.length) {
        throw new Error(`Invalid source index: ${source}`);
      }
    }
  }

  if (options?.destinations) {
    for (const destination of options.destinations) {
      if (destination < 0 || destination >= coordinates.length) {
        throw new Error(`Invalid destination index: ${destination}`);
      }
    }
  }

  // Check matrix size limit (50x50 API constraint)
  const sourceCount = options?.sources?.length || coordinates.length;
  const destinationCount = options?.destinations?.length || coordinates.length;
  if (sourceCount > 50 || destinationCount > 50) {
    throw new Error('Matrix size exceeds 50x50 limit');
  }

  try {
    // Call our secure server API endpoint
    const response = await fetch('/api/table/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        coordinates,
        ...options
      })
    });

    if (!response.ok) {
      // Handle specific HTTP status codes
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || `Table calculation failed: ${response.status} ${response.statusText}`;
      } catch {
        errorMessage = `Table calculation failed: ${response.status} ${response.statusText}`;
      }
      
      throw new Error(errorMessage);
    }

    let data: TableResponse;
    try {
      data = await response.json();
    } catch {
      throw new Error('Failed to parse table response - invalid JSON');
    }

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid table response format');
    }
    
    if (!data.durations && !data.distances) {
      throw new Error('No table data found in response');
    }

    return data;
  } catch (error) {
    // Re-throw known errors as-is
    if (error instanceof Error) {
      // Network errors (fetch failures)
      if (error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
      }
      
      // Already formatted errors
      if (error.message.startsWith('Table calculation failed:') || 
          error.message.startsWith('Invalid coordinates') ||
          error.message.startsWith('At least 2 coordinates') ||
          error.message.startsWith('Invalid source index') ||
          error.message.startsWith('Invalid destination index') ||
          error.message.startsWith('Matrix size exceeds') ||
          error.message.startsWith('Rate limit exceeded') ||
          error.message.startsWith('Failed to parse table response') ||
          error.message.startsWith('No table data found') ||
          error.message.startsWith('Network error') ||
          error.message.startsWith('Invalid table response')) {
        throw error;
      }
      
      // Wrap unknown errors
      throw new Error(`Table calculation failed: ${error.message}`);
    }
    
    // Fallback for non-Error objects
    throw new Error('Table calculation failed: Unknown error');
  }
}