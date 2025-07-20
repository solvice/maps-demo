/**
 * Decodes a polyline string into an array of [longitude, latitude] coordinates
 * Based on Google's polyline algorithm
 */
export function decodePolyline(polyline: string): [number, number][] {
  if (!polyline || typeof polyline !== 'string' || polyline.length === 0) {
    return [];
  }

  try {
    const coordinates: [number, number][] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < polyline.length) {
      let byte = 0;
      let shift = 0;
      let result = 0;

      // Decode latitude
      do {
        if (index >= polyline.length) {
          // Invalid polyline - incomplete data
          return [];
        }
        byte = polyline.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += deltaLat;

      shift = 0;
      result = 0;

      // Decode longitude
      do {
        if (index >= polyline.length) {
          // Invalid polyline - incomplete data
          return [];
        }
        byte = polyline.charCodeAt(index++) - 63;
        result |= (byte & 0x1f) << shift;
        shift += 5;
      } while (byte >= 0x20);

      const deltaLng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += deltaLng;

      // Convert to degrees and add to coordinates array
      // Note: Return as [longitude, latitude] for GeoJSON format
      const decodedLng = lng / 1e5;
      const decodedLat = lat / 1e5;
      
      // Validate coordinates are reasonable
      if (decodedLng < -180 || decodedLng > 180 || decodedLat < -90 || decodedLat > 90) {
        // Invalid coordinates - likely corrupted polyline
        return [];
      }
      
      coordinates.push([decodedLng, decodedLat]);
    }

    return coordinates;
  } catch (error) {
    console.error('Failed to decode polyline:', error);
    return [];
  }
}

/**
 * Encodes an array of [longitude, latitude] coordinates into a polyline string
 * Based on Google's polyline algorithm
 */
export function encodePolyline(coordinates: [number, number][]): string {
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length === 0) {
    return '';
  }

  try {
    let encoded = '';
    let prevLat = 0;
    let prevLng = 0;

    for (const [lng, lat] of coordinates) {
      // Convert to integer representation
      const latE5 = Math.round(lat * 1e5);
      const lngE5 = Math.round(lng * 1e5);

      // Calculate deltas
      const deltaLat = latE5 - prevLat;
      const deltaLng = lngE5 - prevLng;

      // Encode latitude
      encoded += encodeValue(deltaLat);
      
      // Encode longitude
      encoded += encodeValue(deltaLng);

      prevLat = latE5;
      prevLng = lngE5;
    }

    return encoded;
  } catch (error) {
    console.error('Failed to encode polyline:', error);
    return '';
  }
}

function encodeValue(value: number): string {
  // Left-shift the binary value
  value = value < 0 ? ~(value << 1) : (value << 1);

  let encoded = '';
  while (value >= 0x20) {
    encoded += String.fromCharCode((0x20 | (value & 0x1f)) + 63);
    value >>= 5;
  }
  encoded += String.fromCharCode(value + 63);

  return encoded;
}