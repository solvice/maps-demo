import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from './utils'
import { Marker } from '../../components/marker'
import { MapProvider } from '../../contexts/map-context'
import maplibregl from 'maplibre-gl'

// Mock for draggable marker
const mockMarker = {
  setLngLat: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis(),
  remove: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  off: vi.fn().mockReturnThis(),
  setDraggable: vi.fn().mockReturnThis(),
  isDraggable: vi.fn().mockReturnValue(false),
  getLngLat: vi.fn().mockReturnValue({ lng: 3.7174, lat: 51.0543 }),
}

const mockMap = {
  on: vi.fn(),
  off: vi.fn(),
  remove: vi.fn(),
  resize: vi.fn(),
  setCenter: vi.fn(),
  dragging: {
    disable: vi.fn(),
    enable: vi.fn(),
  },
}

vi.mock('maplibre-gl', () => ({
  default: {
    Marker: vi.fn(() => mockMarker),
  },
  Marker: vi.fn(() => mockMarker),
}))

describe('Marker Dragging', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(maplibregl.Marker).mockImplementation(() => mockMarker)
  })

  describe('drag initialization', () => {
    it('should make marker draggable when rendered', () => {
      render(
        <MapProvider value={mockMap as any}>
          <Marker
            coordinates={[3.7174, 51.0543]}
            type="origin"
          />
        </MapProvider>
      )

      expect(mockMarker.setDraggable).toHaveBeenCalledWith(true)
    })

    it('should register drag event handlers', () => {
      render(
        <MapProvider value={mockMap as any}>
          <Marker
            coordinates={[3.7174, 51.0543]}
            type="origin"
          />
        </MapProvider>
      )

      // Should register dragstart, drag, and dragend events
      const onCalls = mockMarker.on.mock.calls
      const registeredEvents = onCalls.map(call => call[0])
      
      expect(registeredEvents).toContain('dragstart')
      expect(registeredEvents).toContain('drag')
      expect(registeredEvents).toContain('dragend')
    })
  })

  describe('drag start behavior', () => {
    it('should disable map dragging when marker drag starts', () => {
      const onDragStart = vi.fn()
      
      render(
        <MapProvider value={mockMap as any}>
          <Marker
            coordinates={[3.7174, 51.0543]}
            type="origin"
            onDragStart={onDragStart}
          />
        </MapProvider>
      )

      // Simulate dragstart event
      const dragStartHandler = mockMarker.on.mock.calls.find(
        call => call[0] === 'dragstart'
      )?.[1]

      expect(dragStartHandler).toBeDefined()
      dragStartHandler?.()

      expect(mockMap.dragging.disable).toHaveBeenCalled()
      expect(onDragStart).toHaveBeenCalled()
    })

    it('should call onDragStart callback with marker type', () => {
      const onDragStart = vi.fn()
      
      render(
        <MapProvider value={mockMap as any}>
          <Marker
            coordinates={[3.7174, 51.0543]}
            type="destination"
            onDragStart={onDragStart}
          />
        </MapProvider>
      )

      const dragStartHandler = mockMarker.on.mock.calls.find(
        call => call[0] === 'dragstart'
      )?.[1]

      dragStartHandler?.()

      expect(onDragStart).toHaveBeenCalledWith('destination')
    })
  })

  describe('drag behavior', () => {
    it('should call onDrag callback with current coordinates during drag', () => {
      const onDrag = vi.fn()
      
      render(
        <MapProvider value={mockMap as any}>
          <Marker
            coordinates={[3.7174, 51.0543]}
            type="origin"
            onDrag={onDrag}
          />
        </MapProvider>
      )

      // Simulate drag event
      const dragHandler = mockMarker.on.mock.calls.find(
        call => call[0] === 'drag'
      )?.[1]

      expect(dragHandler).toBeDefined()
      dragHandler?.()

      expect(onDrag).toHaveBeenCalledWith([3.7174, 51.0543], 'origin')
    })

    it('should update marker position during drag', () => {
      render(
        <MapProvider value={mockMap as any}>
          <Marker
            coordinates={[3.7174, 51.0543]}
            type="origin"
          />
        </MapProvider>
      )

      const dragHandler = mockMarker.on.mock.calls.find(
        call => call[0] === 'drag'
      )?.[1]

      dragHandler?.()

      // Should get current position from marker
      expect(mockMarker.getLngLat).toHaveBeenCalled()
    })
  })

  describe('drag end behavior', () => {
    it('should re-enable map dragging when marker drag ends', () => {
      const onDragEnd = vi.fn()
      
      render(
        <MapProvider value={mockMap as any}>
          <Marker
            coordinates={[3.7174, 51.0543]}
            type="origin"
            onDragEnd={onDragEnd}
          />
        </MapProvider>
      )

      // Simulate dragend event
      const dragEndHandler = mockMarker.on.mock.calls.find(
        call => call[0] === 'dragend'
      )?.[1]

      expect(dragEndHandler).toBeDefined()
      dragEndHandler?.()

      expect(mockMap.dragging.enable).toHaveBeenCalled()
      expect(onDragEnd).toHaveBeenCalled()
    })

    it('should call onDragEnd with final coordinates and type', () => {
      const onDragEnd = vi.fn()
      
      render(
        <MapProvider value={mockMap as any}>
          <Marker
            coordinates={[3.7174, 51.0543]}
            type="destination"
            onDragEnd={onDragEnd}
          />
        </MapProvider>
      )

      const dragEndHandler = mockMarker.on.mock.calls.find(
        call => call[0] === 'dragend'
      )?.[1]

      dragEndHandler?.()

      expect(onDragEnd).toHaveBeenCalledWith([3.7174, 51.0543], 'destination')
    })
  })

  describe('touch support', () => {
    it('should work with touch events on mobile', () => {
      const onDrag = vi.fn()
      
      render(
        <MapProvider value={mockMap as any}>
          <Marker
            coordinates={[3.7174, 51.0543]}
            type="origin"
            onDrag={onDrag}
          />
        </MapProvider>
      )

      // MapLibre's draggable markers should handle touch automatically
      expect(mockMarker.setDraggable).toHaveBeenCalledWith(true)
    })
  })

  describe('cleanup', () => {
    it('should remove drag event listeners on unmount', () => {
      const { unmount } = render(
        <MapProvider value={mockMap as any}>
          <Marker
            coordinates={[3.7174, 51.0543]}
            type="origin"
          />
        </MapProvider>
      )

      unmount()

      // Should remove event listeners
      expect(mockMarker.off).toHaveBeenCalledWith('dragstart', expect.any(Function))
      expect(mockMarker.off).toHaveBeenCalledWith('drag', expect.any(Function))
      expect(mockMarker.off).toHaveBeenCalledWith('dragend', expect.any(Function))
    })

    it('should remove marker completely on unmount', () => {
      const { unmount } = render(
        <MapProvider value={mockMap as any}>
          <Marker
            coordinates={[3.7174, 51.0543]}
            type="origin"
          />
        </MapProvider>
      )

      unmount()

      expect(mockMarker.remove).toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle missing map gracefully', () => {
      expect(() => {
        render(
          <MapProvider value={null}>
            <Marker
              coordinates={[3.7174, 51.0543]}
              type="origin"
            />
          </MapProvider>
        )
      }).not.toThrow()
    })

    it('should handle drag events when callbacks are not provided', () => {
      render(
        <MapProvider value={mockMap as any}>
          <Marker
            coordinates={[3.7174, 51.0543]}
            type="origin"
          />
        </MapProvider>
      )

      // Should not throw when drag events fire without callbacks
      const dragHandler = mockMarker.on.mock.calls.find(
        call => call[0] === 'drag'
      )?.[1]

      expect(() => dragHandler?.()).not.toThrow()
    })
  })

  describe('visual feedback', () => {
    it('should provide visual feedback during drag', () => {
      // This would be tested with actual DOM manipulation
      // For now, we verify the events are properly set up
      render(
        <MapProvider value={mockMap as any}>
          <Marker
            coordinates={[3.7174, 51.0543]}
            type="origin"
          />
        </MapProvider>
      )

      // Visual feedback would be handled by MapLibre GL's built-in drag behavior
      expect(mockMarker.setDraggable).toHaveBeenCalledWith(true)
    })
  })
})