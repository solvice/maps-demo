import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TableConnections } from '@/components/table-connections';
import { createMapContextMock, tableTestCoordinates, tableAPIFixtures } from './utils/table-test-utils';
import { baselineResponses, trafficResponses } from './fixtures/table-api-responses';

// Test fails - need to write component first
describe('TableConnections Component', () => {
  const mockMap = createMapContextMock();
  
  const defaultProps = {
    map: mockMap,
    coordinates: tableTestCoordinates.simple,
    table: tableAPIFixtures.simple,
    trafficTable: tableAPIFixtures.withTraffic,
    trafficImpacts: [[1.0, 1.3], [1.3, 1.0]], // 30% traffic impact
    maxTrafficImpact: 1.3,
    showTrafficImpact: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset map state
    Object.keys(mockMap._getLayers()).forEach(key => delete mockMap._getLayers()[key]);
    Object.keys(mockMap._getSources()).forEach(key => delete mockMap._getSources()[key]);
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      // TDD: Write failing test first
      expect(() => {
        render(<TableConnections {...defaultProps} />);
      }).not.toThrow();
    });

    it('should add connection layers to the map', () => {
      render(<TableConnections {...defaultProps} />);
      
      const layers = mockMap._getLayers();
      const sources = mockMap._getSources();
      
      // Should have created both source and layer for connections
      expect(Object.keys(sources)).toContain('table-connections');
      expect(Object.keys(layers)).toContain('table-connections-layer');
    });

    it('should create connections for all coordinate pairs', () => {
      render(<TableConnections {...defaultProps} />);
      
      const connectionSource = mockMap._getSources()['table-connections'];
      
      // For 2 coordinates, should have 2 connections (A->B, B->A)
      expect(connectionSource.data.features.length).toBe(2);
    });

    it('should not render when coordinates are missing', () => {
      render(
        <TableConnections 
          {...defaultProps} 
          coordinates={[]}
        />
      );
      
      const layers = mockMap._getLayers();
      expect(Object.keys(layers)).not.toContain('table-connections-layer');
    });
  });

  describe('Traffic Impact Visualization', () => {
    it('should apply traffic impact colors when showTrafficImpact is true', () => {
      render(<TableConnections {...defaultProps} />);
      
      const layer = mockMap._getLayers()['table-connections-layer'];
      
      // Check that layer paint includes traffic impact styling
      expect(layer.paint['line-color']).toBeDefined();
      expect(layer.paint['line-width']).toBeDefined();
    });

    it('should use baseline styling when showTrafficImpact is false', () => {
      render(
        <TableConnections 
          {...defaultProps} 
          showTrafficImpact={false}
        />
      );
      
      const layer = mockMap._getLayers()['table-connections-layer'];
      
      // Should use uniform baseline styling
      expect(typeof layer.paint['line-color']).toBe('string');
    });

    it('should update colors when traffic impact data changes', () => {
      const { rerender } = render(<TableConnections {...defaultProps} />);
      
      const newTrafficImpacts = [[1.0, 1.8], [1.8, 1.0]]; // Higher impact
      
      rerender(
        <TableConnections 
          {...defaultProps} 
          trafficImpacts={newTrafficImpacts}
          maxTrafficImpact={1.8}
        />
      );
      
      // Layer should be updated with new styling
      const layer = mockMap._getLayers()['table-connections-layer'];
      expect(layer.paint).toBeDefined();
    });

    it('should handle missing traffic data gracefully', () => {
      expect(() => {
        render(
          <TableConnections 
            {...defaultProps} 
            trafficImpacts={null}
            maxTrafficImpact={1.0}
          />
        );
      }).not.toThrow();
    });
  });

  describe('Connection Geometry', () => {
    it('should create correct GeoJSON LineString features', () => {
      render(<TableConnections {...defaultProps} />);
      
      const connectionSource = mockMap._getSources()['table-connections'];
      const features = connectionSource.data.features;
      
      // Check first connection feature
      expect(features[0].type).toBe('Feature');
      expect(features[0].geometry.type).toBe('LineString');
      expect(features[0].geometry.coordinates.length).toBe(2);
    });

    it('should include proper feature properties', () => {
      render(<TableConnections {...defaultProps} />);
      
      const connectionSource = mockMap._getSources()['table-connections'];
      const feature = connectionSource.data.features[0];
      
      expect(feature.properties).toEqual(
        expect.objectContaining({
          fromIndex: expect.any(Number),
          toIndex: expect.any(Number),
          duration: expect.any(Number),
          distance: expect.any(Number),
          trafficImpact: expect.any(Number)
        })
      );
    });

    it('should skip diagonal connections (same source and destination)', () => {
      render(<TableConnections {...defaultProps} />);
      
      const connectionSource = mockMap._getSources()['table-connections'];
      const features = connectionSource.data.features;
      
      // No feature should have same fromIndex and toIndex
      features.forEach(feature => {
        expect(feature.properties.fromIndex).not.toBe(feature.properties.toIndex);
      });
    });

    it('should handle coordinate updates correctly', () => {
      const { rerender } = render(<TableConnections {...defaultProps} />);
      
      const newCoordinates = tableTestCoordinates.medium;
      
      rerender(
        <TableConnections 
          {...defaultProps} 
          coordinates={newCoordinates}
        />
      );
      
      const connectionSource = mockMap._getSources()['table-connections'];
      
      // Should have more connections for 4 coordinates (4*3 = 12 non-diagonal connections)
      expect(connectionSource.data.features.length).toBe(12);
    });
  });

  describe('Layer Styling', () => {
    it('should apply correct line styling properties', () => {
      render(<TableConnections {...defaultProps} />);
      
      const layer = mockMap._getLayers()['table-connections-layer'];
      
      expect(layer.type).toBe('line');
      expect(layer.paint).toEqual(
        expect.objectContaining({
          'line-opacity': expect.any(Number),
          'line-width': expect.any(Object), // Expression for width
        })
      );
    });

    it('should use different styles for different traffic impact levels', () => {
      const highImpactProps = {
        ...defaultProps,
        trafficImpacts: [[1.0, 2.0], [2.0, 1.0]], // Very high impact
        maxTrafficImpact: 2.0
      };
      
      render(<TableConnections {...highImpactProps} />);
      
      const layer = mockMap._getLayers()['table-connections-layer'];
      
      // High impact connections should have different styling
      expect(layer.paint['line-color']).toBeDefined();
      expect(layer.paint['line-width']).toBeDefined();
    });

    it('should support custom styling options', () => {
      const customProps = {
        ...defaultProps,
        lineOpacity: 0.8,
        baseLineWidth: 3
      };
      
      render(<TableConnections {...customProps} />);
      
      const layer = mockMap._getLayers()['table-connections-layer'];
      expect(layer.paint['line-opacity']).toBe(0.8);
    });
  });

  describe('Performance', () => {
    it('should handle large coordinate sets efficiently', () => {
      const largeCoordinateSet = tableTestCoordinates.large; // 8 coordinates
      const largeTable = {
        durations: Array(8).fill(null).map(() => Array(8).fill(3600)),
        distances: Array(8).fill(null).map(() => Array(8).fill(100000))
      };
      
      const startTime = performance.now();
      
      render(
        <TableConnections 
          {...defaultProps}
          coordinates={largeCoordinateSet}
          table={largeTable}
          trafficTable={largeTable}
        />
      );
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render reasonably quickly (less than 100ms)
      expect(renderTime).toBeLessThan(100);
      
      const connectionSource = mockMap._getSources()['table-connections'];
      // 8 coordinates should create 8*7 = 56 connections
      expect(connectionSource.data.features.length).toBe(56);
    });

    it('should debounce rapid updates', async () => {
      const { rerender } = render(<TableConnections {...defaultProps} />);
      
      // Rapidly change coordinates multiple times
      for (let i = 0; i < 5; i++) {
        rerender(
          <TableConnections 
            {...defaultProps}
            coordinates={tableTestCoordinates.medium}
          />
        );
      }
      
      // Should only update once after debounce period
      await waitFor(() => {
        const updateCalls = mockMap.getSource.mock.calls.length;
        expect(updateCalls).toBeLessThan(10); // Much less than 5 rapid updates
      });
    });
  });

  describe('Interaction Events', () => {
    it('should support hover events on connections', () => {
      render(<TableConnections {...defaultProps} />);
      
      // Check that hover event handlers were registered
      const hoverHandlers = mockMap.on.mock.calls
        .filter(call => ['mouseenter', 'mouseleave'].includes(call[0]));
      
      expect(hoverHandlers.length).toBeGreaterThanOrEqual(2);
    });

    it('should display connection information on hover', async () => {
      const onConnectionHover = vi.fn();
      render(
        <TableConnections 
          {...defaultProps}
          onConnectionHover={onConnectionHover}
        />
      );
      
      // Simulate mouseenter on connection
      const mouseenterHandler = mockMap.on.mock.calls
        .find(call => call[0] === 'mouseenter')?.[2];
      
      if (mouseenterHandler) {
        const mockEvent = {
          features: [{
            properties: {
              fromIndex: 0,
              toIndex: 1,
              duration: 3600,
              distance: 100000,
              trafficImpact: 1.3
            }
          }]
        };
        
        mouseenterHandler(mockEvent);
        expect(onConnectionHover).toHaveBeenCalledWith(mockEvent.features[0].properties);
      }
    });

    it('should support click events on connections', () => {
      const onConnectionClick = vi.fn();
      render(
        <TableConnections 
          {...defaultProps}
          onConnectionClick={onConnectionClick}
        />
      );
      
      const clickHandler = mockMap.on.mock.calls
        .find(call => call[0] === 'click')?.[2];
      
      if (clickHandler) {
        const mockEvent = {
          features: [{
            properties: {
              fromIndex: 0,
              toIndex: 1,
              duration: 3600
            }
          }]
        };
        
        clickHandler(mockEvent);
        expect(onConnectionClick).toHaveBeenCalledWith(mockEvent.features[0].properties);
      }
    });
  });

  describe('Cleanup', () => {
    it('should remove layers and sources on unmount', () => {
      const { unmount } = render(<TableConnections {...defaultProps} />);
      
      // Verify layers and sources exist
      expect(Object.keys(mockMap._getLayers())).toContain('table-connections-layer');
      expect(Object.keys(mockMap._getSources())).toContain('table-connections');
      
      unmount();
      
      // Should call removeLayer and removeSource
      expect(mockMap.removeLayer).toHaveBeenCalledWith('table-connections-layer');
      expect(mockMap.removeSource).toHaveBeenCalledWith('table-connections');
    });

    it('should remove event listeners on unmount', () => {
      const { unmount } = render(<TableConnections {...defaultProps} />);
      
      unmount();
      
      // Should call off for registered events
      expect(mockMap.off).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', () => {
      // Mock removeLayer to throw error
      mockMap.removeLayer.mockImplementationOnce(() => {
        throw new Error('Layer not found');
      });
      
      const { unmount } = render(<TableConnections {...defaultProps} />);
      
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing map prop gracefully', () => {
      expect(() => {
        render(
          <TableConnections 
            {...defaultProps}
            map={null as any}
          />
        );
      }).not.toThrow();
    });

    it('should handle malformed table data gracefully', () => {
      expect(() => {
        render(
          <TableConnections 
            {...defaultProps}
            table={null as any}
            trafficTable={undefined as any}
          />
        );
      }).not.toThrow();
    });

    it('should handle coordinate-table mismatch gracefully', () => {
      const mismatchedTable = {
        durations: [[0, 3600, 7200]], // 1x3 instead of 2x2
        distances: [[0, 100000, 200000]]
      };
      
      expect(() => {
        render(
          <TableConnections 
            {...defaultProps}
            table={mismatchedTable}
          />
        );
      }).not.toThrow();
    });
  });
});