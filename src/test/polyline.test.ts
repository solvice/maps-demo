import { describe, it, expect } from 'vitest';
import { decodePolyline, encodePolyline } from '@/lib/polyline';

describe('Polyline Utilities', () => {
  describe('decodePolyline', () => {
    it('should decode a simple polyline correctly', () => {
      // This is a known polyline encoding for a simple path
      const polyline = 'u{~vFvyys@fS]';
      const decoded = decodePolyline(polyline);
      
      expect(decoded).toEqual(expect.any(Array));
      expect(decoded.length).toBeGreaterThan(0);
      
      // Check that all coordinates are valid
      decoded.forEach(([lng, lat]) => {
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      });
    });

    it('should return empty array for invalid polyline', () => {
      const invalid = 'invalid_polyline';
      const decoded = decodePolyline(invalid);
      
      expect(decoded).toEqual([]);
    });

    it('should handle empty string', () => {
      const decoded = decodePolyline('');
      expect(decoded).toEqual([]);
    });

    it('should handle null input', () => {
      const decoded = decodePolyline(null as any);
      expect(decoded).toEqual([]);
    });

    it('should handle non-string input', () => {
      const decoded = decodePolyline(123 as any);
      expect(decoded).toEqual([]);
    });
  });

  describe('encodePolyline', () => {
    it('should encode coordinates to polyline', () => {
      const coordinates: [number, number][] = [
        [3.7174, 51.0543],
        [4.3517, 50.8476]
      ];
      
      const encoded = encodePolyline(coordinates);
      expect(typeof encoded).toBe('string');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should return empty string for empty array', () => {
      const encoded = encodePolyline([]);
      expect(encoded).toBe('');
    });

    it('should handle null input', () => {
      const encoded = encodePolyline(null as any);
      expect(encoded).toBe('');
    });

    it('should handle invalid input', () => {
      const encoded = encodePolyline('invalid' as any);
      expect(encoded).toBe('');
    });
  });

  describe('encode/decode roundtrip', () => {
    it('should encode and decode to approximately the same coordinates', () => {
      const originalCoords: [number, number][] = [
        [3.7174, 51.0543],
        [4.3517, 50.8476],
        [5.1234, 52.5678]
      ];
      
      const encoded = encodePolyline(originalCoords);
      const decoded = decodePolyline(encoded);
      
      expect(decoded.length).toBe(originalCoords.length);
      
      // Check coordinates are approximately equal (within precision limits)
      decoded.forEach(([lng, lat], index) => {
        const [origLng, origLat] = originalCoords[index];
        expect(lng).toBeCloseTo(origLng, 4);
        expect(lat).toBeCloseTo(origLat, 4);
      });
    });
  });
});