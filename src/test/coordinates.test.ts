import { describe, it, expect } from 'vitest'
import {
  isValidCoordinates,
  lonLatToLatLng,
  latLngToLonLat,
  coordinatesToPoint,
  pointToCoordinates,
  formatCoordinates,
  calculateDistance,
  findClosestCoordinate,
  GHENT_COORDINATES,
} from '../../lib/coordinates'

describe('Coordinate Utilities', () => {
  describe('isValidCoordinates', () => {
    it('should validate correct coordinates', () => {
      expect(isValidCoordinates([3.7174, 51.0543])).toBe(true)
      expect(isValidCoordinates([0, 0])).toBe(true)
      expect(isValidCoordinates([-180, -90])).toBe(true)
      expect(isValidCoordinates([180, 90])).toBe(true)
    })

    it('should reject invalid coordinates', () => {
      expect(isValidCoordinates([181, 0])).toBe(false) // longitude out of range
      expect(isValidCoordinates([0, 91])).toBe(false) // latitude out of range
      expect(isValidCoordinates([-181, 0])).toBe(false) // longitude out of range
      expect(isValidCoordinates([0, -91])).toBe(false) // latitude out of range
      expect(isValidCoordinates([NaN, 0])).toBe(false) // NaN longitude
      expect(isValidCoordinates([0, NaN])).toBe(false) // NaN latitude
    })

    it('should handle edge cases', () => {
      expect(isValidCoordinates(['3.7174', '51.0543'] as any)).toBe(false) // strings
      expect(isValidCoordinates([3.7174])).toBe(false) // missing latitude
      expect(isValidCoordinates([3.7174, 51.0543, 100])).toBe(false) // extra parameter
    })
  })

  describe('coordinate format conversion', () => {
    it('should convert longitude-latitude to latitude-longitude', () => {
      const lonLat = [3.7174, 51.0543] as [number, number]
      const latLng = lonLatToLatLng(lonLat)
      expect(latLng).toEqual([51.0543, 3.7174])
    })

    it('should convert latitude-longitude to longitude-latitude', () => {
      const latLng = [51.0543, 3.7174] as [number, number]
      const lonLat = latLngToLonLat(latLng)
      expect(lonLat).toEqual([3.7174, 51.0543])
    })

    it('should be reversible', () => {
      const original = [3.7174, 51.0543] as [number, number]
      const converted = latLngToLonLat(lonLatToLatLng(original))
      expect(converted).toEqual(original)
    })
  })

  describe('coordinate point conversion', () => {
    it('should convert coordinates to point object', () => {
      const coords = [3.7174, 51.0543] as [number, number]
      const point = coordinatesToPoint(coords)
      expect(point).toEqual({
        longitude: 3.7174,
        latitude: 51.0543
      })
    })

    it('should convert point object to coordinates', () => {
      const point = { longitude: 3.7174, latitude: 51.0543 }
      const coords = pointToCoordinates(point)
      expect(coords).toEqual([3.7174, 51.0543])
    })

    it('should be reversible', () => {
      const original = [3.7174, 51.0543] as [number, number]
      const converted = pointToCoordinates(coordinatesToPoint(original))
      expect(converted).toEqual(original)
    })
  })

  describe('formatCoordinates', () => {
    it('should format coordinates with default precision', () => {
      const coords = [3.7174, 51.0543] as [number, number]
      const formatted = formatCoordinates(coords)
      expect(formatted).toBe('51.054300, 3.717400')
    })

    it('should format coordinates with custom precision', () => {
      const coords = [3.7174, 51.0543] as [number, number]
      const formatted = formatCoordinates(coords, 2)
      expect(formatted).toBe('51.05, 3.72')
    })

    it('should handle zero coordinates', () => {
      const coords = [0, 0] as [number, number]
      const formatted = formatCoordinates(coords, 1)
      expect(formatted).toBe('0.0, 0.0')
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const ghent = [3.7174, 51.0543] as [number, number]
      const brussels = [4.3517, 50.8476] as [number, number]
      
      const distance = calculateDistance(ghent, brussels)
      
      // Distance between Ghent and Brussels is approximately 55-60km
      expect(distance).toBeGreaterThan(50000) // 50km
      expect(distance).toBeLessThan(70000) // 70km
    })

    it('should return zero for identical coordinates', () => {
      const coords = [3.7174, 51.0543] as [number, number]
      const distance = calculateDistance(coords, coords)
      expect(distance).toBe(0)
    })

    it('should be symmetric', () => {
      const point1 = [3.7174, 51.0543] as [number, number]
      const point2 = [4.3517, 50.8476] as [number, number]
      
      const distance1 = calculateDistance(point1, point2)
      const distance2 = calculateDistance(point2, point1)
      
      expect(distance1).toBe(distance2)
    })
  })

  describe('findClosestCoordinate', () => {
    const ghent = [3.7174, 51.0543] as [number, number]
    const brussels = [4.3517, 50.8476] as [number, number]
    const antwerp = [4.4024, 51.2194] as [number, number]
    const coordinates = [ghent, brussels, antwerp]

    it('should find closest coordinate', () => {
      const target = [3.8, 51.1] as [number, number] // Close to Ghent
      const result = findClosestCoordinate(target, coordinates)
      
      expect(result).not.toBeNull()
      expect(result!.coordinate).toEqual(ghent)
      expect(result!.index).toBe(0)
      expect(result!.distance).toBeGreaterThan(0)
    })

    it('should return null for empty array', () => {
      const target = [3.7174, 51.0543] as [number, number]
      const result = findClosestCoordinate(target, [])
      
      expect(result).toBeNull()
    })

    it('should find exact match', () => {
      const result = findClosestCoordinate(ghent, coordinates)
      
      expect(result).not.toBeNull()
      expect(result!.coordinate).toEqual(ghent)
      expect(result!.distance).toBe(0)
    })

    it('should find different closest points', () => {
      const targetNearBrussels = [4.35, 50.85] as [number, number]
      const result = findClosestCoordinate(targetNearBrussels, coordinates)
      
      expect(result).not.toBeNull()
      expect(result!.coordinate).toEqual(brussels)
      expect(result!.index).toBe(1)
    })
  })

  describe('constants', () => {
    it('should have valid Ghent coordinates', () => {
      expect(GHENT_COORDINATES).toEqual([3.7174, 51.0543])
      expect(isValidCoordinates(GHENT_COORDINATES)).toBe(true)
    })
  })
})