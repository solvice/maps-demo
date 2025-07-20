import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCoordinates } from '../../hooks/use-coordinates'
import { mockCoordinates } from './utils'

describe('useCoordinates hook', () => {
  describe('initial state', () => {
    it('should start with null coordinates', () => {
      const { result } = renderHook(() => useCoordinates())
      
      expect(result.current.coordinates.origin).toBeNull()
      expect(result.current.coordinates.destination).toBeNull()
      expect(result.current.hasOrigin).toBe(false)
      expect(result.current.hasDestination).toBe(false)
      expect(result.current.hasBoth).toBe(false)
    })

    it('should have correct initial helper values', () => {
      const { result } = renderHook(() => useCoordinates())
      
      expect(result.current.getCoordinatesArray()).toEqual([])
    })
  })

  describe('setOrigin', () => {
    it('should set origin coordinates', () => {
      const { result } = renderHook(() => useCoordinates())
      
      act(() => {
        result.current.setOrigin(mockCoordinates.ghent)
      })
      
      expect(result.current.coordinates.origin).toEqual(mockCoordinates.ghent)
      expect(result.current.hasOrigin).toBe(true)
      expect(result.current.hasBoth).toBe(false)
    })

    it('should reject invalid coordinates', () => {
      const { result } = renderHook(() => useCoordinates())
      
      act(() => {
        result.current.setOrigin([200, 100] as any) // Invalid coordinates
      })
      
      expect(result.current.coordinates.origin).toBeNull()
      expect(result.current.hasOrigin).toBe(false)
    })

    it('should clear origin with null', () => {
      const { result } = renderHook(() => useCoordinates())
      
      act(() => {
        result.current.setOrigin(mockCoordinates.ghent)
      })
      
      expect(result.current.hasOrigin).toBe(true)
      
      act(() => {
        result.current.setOrigin(null)
      })
      
      expect(result.current.coordinates.origin).toBeNull()
      expect(result.current.hasOrigin).toBe(false)
    })
  })

  describe('setDestination', () => {
    it('should set destination coordinates', () => {
      const { result } = renderHook(() => useCoordinates())
      
      act(() => {
        result.current.setDestination(mockCoordinates.brussels)
      })
      
      expect(result.current.coordinates.destination).toEqual(mockCoordinates.brussels)
      expect(result.current.hasDestination).toBe(true)
      expect(result.current.hasBoth).toBe(false)
    })

    it('should reject invalid coordinates', () => {
      const { result } = renderHook(() => useCoordinates())
      
      act(() => {
        result.current.setDestination([200, 100] as any)
      })
      
      expect(result.current.coordinates.destination).toBeNull()
      expect(result.current.hasDestination).toBe(false)
    })
  })

  describe('hasBoth state', () => {
    it('should be true when both origin and destination are set', () => {
      const { result } = renderHook(() => useCoordinates())
      
      act(() => {
        result.current.setOrigin(mockCoordinates.ghent)
        result.current.setDestination(mockCoordinates.brussels)
      })
      
      expect(result.current.hasBoth).toBe(true)
      expect(result.current.hasOrigin).toBe(true)
      expect(result.current.hasDestination).toBe(true)
    })

    it('should be false when only origin is set', () => {
      const { result } = renderHook(() => useCoordinates())
      
      act(() => {
        result.current.setOrigin(mockCoordinates.ghent)
      })
      
      expect(result.current.hasBoth).toBe(false)
    })
  })

  describe('setCoordinate', () => {
    it('should set origin via setCoordinate', () => {
      const { result } = renderHook(() => useCoordinates())
      
      act(() => {
        result.current.setCoordinate('origin', mockCoordinates.ghent)
      })
      
      expect(result.current.coordinates.origin).toEqual(mockCoordinates.ghent)
    })

    it('should set destination via setCoordinate', () => {
      const { result } = renderHook(() => useCoordinates())
      
      act(() => {
        result.current.setCoordinate('destination', mockCoordinates.brussels)
      })
      
      expect(result.current.coordinates.destination).toEqual(mockCoordinates.brussels)
    })
  })

  describe('replaceClosest', () => {
    it('should set as origin when no coordinates exist', () => {
      const { result } = renderHook(() => useCoordinates())
      
      let replacedType: string | null = null
      act(() => {
        replacedType = result.current.replaceClosest(mockCoordinates.ghent)
      })
      
      expect(replacedType).toBe('origin')
      expect(result.current.coordinates.origin).toEqual(mockCoordinates.ghent)
    })

    it('should replace closest marker when both exist', () => {
      const { result } = renderHook(() => useCoordinates())
      
      // Set up origin and destination
      act(() => {
        result.current.setOrigin(mockCoordinates.ghent)
        result.current.setDestination(mockCoordinates.brussels)
      })
      
      // New point closer to Ghent should replace origin
      const newPoint = [3.8, 51.1] as [number, number] // Close to Ghent
      
      let replacedType: string | null = null
      act(() => {
        replacedType = result.current.replaceClosest(newPoint)
      })
      
      expect(replacedType).toBe('origin')
      expect(result.current.coordinates.origin).toEqual(newPoint)
      expect(result.current.coordinates.destination).toEqual(mockCoordinates.brussels)
    })

    it('should reject invalid coordinates', () => {
      const { result } = renderHook(() => useCoordinates())
      
      let replacedType: string | null = null
      act(() => {
        replacedType = result.current.replaceClosest([200, 100] as any)
      })
      
      expect(replacedType).toBeNull()
      expect(result.current.coordinates.origin).toBeNull()
    })
  })

  describe('clear', () => {
    it('should clear all coordinates', () => {
      const { result } = renderHook(() => useCoordinates())
      
      // Set up coordinates
      act(() => {
        result.current.setOrigin(mockCoordinates.ghent)
        result.current.setDestination(mockCoordinates.brussels)
      })
      
      expect(result.current.hasBoth).toBe(true)
      
      // Clear
      act(() => {
        result.current.clear()
      })
      
      expect(result.current.coordinates.origin).toBeNull()
      expect(result.current.coordinates.destination).toBeNull()
      expect(result.current.hasOrigin).toBe(false)
      expect(result.current.hasDestination).toBe(false)
      expect(result.current.hasBoth).toBe(false)
    })
  })

  describe('getCoordinatesArray', () => {
    it('should return empty array when no coordinates', () => {
      const { result } = renderHook(() => useCoordinates())
      
      expect(result.current.getCoordinatesArray()).toEqual([])
    })

    it('should return origin only', () => {
      const { result } = renderHook(() => useCoordinates())
      
      act(() => {
        result.current.setOrigin(mockCoordinates.ghent)
      })
      
      expect(result.current.getCoordinatesArray()).toEqual([mockCoordinates.ghent])
    })

    it('should return both coordinates in order', () => {
      const { result } = renderHook(() => useCoordinates())
      
      act(() => {
        result.current.setOrigin(mockCoordinates.ghent)
        result.current.setDestination(mockCoordinates.brussels)
      })
      
      expect(result.current.getCoordinatesArray()).toEqual([
        mockCoordinates.ghent,
        mockCoordinates.brussels
      ])
    })
  })
})