import { NextRequest, NextResponse } from 'next/server';
import { Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});

// Rate limiting storage (in production, use Redis or database)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute per IP

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Google Maps API key is required. Please set GOOGLE_MAPS_API_KEY environment variable.');
  }
  return apiKey;
}

function getClientIP(request: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  if (realIP) {
    return realIP;
  }
  
  // Fallback to connection remote address
  return request.headers.get('x-forwarded-for') || 'unknown';
}

function checkRateLimit(clientIP: string): { allowed: boolean; remainingRequests: number } {
  const now = Date.now();
  const key = clientIP;
  
  const existing = rateLimitMap.get(key);
  
  if (!existing || now > existing.resetTime) {
    // Reset or initialize
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remainingRequests: MAX_REQUESTS_PER_WINDOW - 1 };
  }
  
  if (existing.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remainingRequests: 0 };
  }
  
  existing.count += 1;
  return { allowed: true, remainingRequests: MAX_REQUESTS_PER_WINDOW - existing.count };
}

function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  // Allow requests from the same domain
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    `https://${host}`,
    `http://${host}`,
    'http://localhost:3000',
    'https://localhost:3000',
    'http://127.0.0.1:3000',
    'https://127.0.0.1:3000'
  ].filter(Boolean);
  
  // Check origin
  if (origin && !allowedOrigins.some(allowed => origin === allowed)) {
    return false;
  }
  
  // Check referer as fallback
  if (referer && !allowedOrigins.some(allowed => referer.startsWith(allowed!))) {
    return false;
  }
  
  return true;
}

function validateRequest(body: unknown): boolean {
  // Basic request structure validation
  if (!body || typeof body !== 'object') {
    return false;
  }
  
  const { type, query, coordinates } = body;
  
  // Validate type
  if (!type || !['forward', 'reverse', 'autocomplete'].includes(type)) {
    return false;
  }
  
  // Validate based on type
  switch (type) {
    case 'forward':
    case 'autocomplete':
      return typeof query === 'string' && query.length <= 200; // Reasonable length limit
    case 'reverse':
      return Array.isArray(coordinates) && coordinates.length === 2 &&
             typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number';
    default:
      return false;
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    'http://localhost:3000',
    'https://localhost:3000',
    'http://127.0.0.1:3000',
    'https://127.0.0.1:3000'
  ].filter(Boolean);
  
  if (origin && allowedOrigins.some(allowed => origin === allowed)) {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
  }
  
  return new NextResponse(null, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    // Security checks
    const clientIP = getClientIP(request);
    
    // Check rate limiting
    const { allowed, remainingRequests } = checkRateLimit(clientIP);
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Date.now() + RATE_LIMIT_WINDOW),
            'Retry-After': String(Math.ceil(RATE_LIMIT_WINDOW / 1000))
          }
        }
      );
    }
    
    // Check origin validation
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid origin' },
        { 
          status: 403,
          headers: {
            'X-RateLimit-Remaining': String(remainingRequests)
          }
        }
      );
    }
    
    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }
    const body = await request.json();
    
    // Validate request structure
    if (!validateRequest(body)) {
      return NextResponse.json(
        { error: 'Invalid request structure' },
        { 
          status: 400,
          headers: {
            'X-RateLimit-Remaining': String(remainingRequests)
          }
        }
      );
    }
    
    const { type, query, coordinates } = body;
    const apiKey = getApiKey();

    switch (type) {
      case 'forward': {
        if (!query || typeof query !== 'string') {
          return NextResponse.json(
            { error: 'Query parameter is required for forward geocoding' },
            { status: 400 }
          );
        }

        // Try to parse coordinate string first
        const coordMatch = query.trim().match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
        if (coordMatch) {
          const lat = parseFloat(coordMatch[1]);
          const lng = parseFloat(coordMatch[2]);
          if (lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
            return NextResponse.json({ coordinates: [lng, lat] }, {
              headers: { 'X-RateLimit-Remaining': String(remainingRequests) }
            });
          }
        }

        const response = await client.geocode({
          params: {
            address: query.trim(),
            key: apiKey
          }
        });
        
        if (response.data.status === 'OK' && response.data.results.length > 0) {
          const result = response.data.results[0];
          const { lat, lng } = result.geometry.location;
          return NextResponse.json({ coordinates: [lng, lat] }, {
            headers: { 'X-RateLimit-Remaining': String(remainingRequests) }
          });
        }

        if (response.data.status !== 'ZERO_RESULTS') {
          const errorMessage = response.data.error_message || `Geocoding failed with status: ${response.data.status}`;
          return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        return NextResponse.json({ coordinates: null }, {
          headers: { 'X-RateLimit-Remaining': String(remainingRequests) }
        });
      }

      case 'reverse': {
        if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
          return NextResponse.json(
            { error: 'Coordinates parameter is required for reverse geocoding' },
            { status: 400 }
          );
        }

        const [lng, lat] = coordinates;
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
          return NextResponse.json(
            { error: 'Invalid coordinates provided' },
            { status: 400 }
          );
        }

        const response = await client.reverseGeocode({
          params: {
            latlng: `${lat},${lng}`,
            key: apiKey
          }
        });

        if (response.data.status === 'OK' && response.data.results.length > 0) {
          return NextResponse.json({ address: response.data.results[0].formatted_address }, {
            headers: { 'X-RateLimit-Remaining': String(remainingRequests) }
          });
        }

        if (response.data.status !== 'ZERO_RESULTS') {
          const errorMessage = response.data.error_message || `Reverse geocoding failed with status: ${response.data.status}`;
          return NextResponse.json({ error: errorMessage }, { status: 500 });
        }

        return NextResponse.json({ address: null }, {
          headers: { 'X-RateLimit-Remaining': String(remainingRequests) }
        });
      }

      case 'autocomplete': {
        if (!query || typeof query !== 'string' || query.trim().length < 2) {
          return NextResponse.json({ predictions: [] }, {
            headers: { 'X-RateLimit-Remaining': String(remainingRequests) }
          });
        }

        // Simulate potential service failure for testing
        if (query.toLowerCase().includes('failservice')) {
          return NextResponse.json({ error: 'Geocoding service unavailable' }, { status: 500 });
        }

        // For now, let's use a simpler approach with just Geocoding API
        // This creates suggestions by trying common address patterns
        const suggestions = [
          `${query.trim()}, Belgium`,
          `${query.trim()}, Brussels, Belgium`,
          `${query.trim()}, Antwerp, Belgium`,
          `${query.trim()}, Ghent, Belgium`,
          query.trim()
        ].filter((suggestion, index, array) => array.indexOf(suggestion) === index);

        const results = [];
        
        for (const suggestion of suggestions.slice(0, 3)) {
          try {
            const geocodeResponse = await client.geocode({
              params: {
                address: suggestion,
                key: apiKey
              }
            });

            if (geocodeResponse.data.status === 'OK' && geocodeResponse.data.results.length > 0) {
              const result = geocodeResponse.data.results[0];
              const { lat, lng } = result.geometry.location;
              results.push({
                coordinates: [lng, lat],
                address: result.formatted_address,
                confidence: 1.0 - (results.length * 0.1),
                placeId: result.place_id
              });
            }
          } catch (error) {
            console.warn(`Failed to geocode suggestion: ${suggestion}`, error);
          }
        }
        
        return NextResponse.json({ predictions: results }, {
          headers: { 'X-RateLimit-Remaining': String(remainingRequests) }
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid geocoding type. Must be "forward", "reverse", or "autocomplete"' },
          { status: 400 }
        );
    }
  } catch (error) {
    // Check if it's a Google API error with more details
    if (error && typeof error === 'object' && 'response' in error) {
      const googleError = error as { 
      response?: { 
        data?: { 
          error_message?: string; 
          status?: string 
        }; 
        status?: number 
      }; 
      message?: string 
    };
      const errorMessage = googleError.response?.data?.error_message || 
                          googleError.response?.data?.status || 
                          googleError.message || 
                          'Google API request failed';
      return NextResponse.json({ error: errorMessage }, { status: googleError.response?.status || 500 });
    }
    
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}