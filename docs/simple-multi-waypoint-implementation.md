# Simple Multi-Waypoint Implementation Plan

## Updated Requirements

**Simplified Goal**: Add waypoints between origin and destination via right-click context menu. No TSP optimization - just sequential routing through waypoints in order.

**User Flow**:
1. Set origin (click or right-click → "Origin")
2. Right-click anywhere → "Add waypoint here" (inserted before destination)
3. Set destination (click or right-click → "Destination") 
4. Route calculates: Origin → Waypoint(s) → Destination
5. Waypoints can be removed individually

## Implementation Strategy

### Phase 1: Data Structure Changes (2 days)

**Current State (2 points only):**
```typescript
const [origin, setOrigin] = useState<Coordinates | null>(null);
const [destination, setDestination] = useState<Coordinates | null>(null);
```

**New State (multi-waypoint):**
```typescript
interface RoutePoint {
  id: string;                    // Unique ID for React keys
  coordinates: Coordinates;      // [lng, lat]
  type: 'origin' | 'waypoint' | 'destination';
  address?: string;              // Geocoded address
}

const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);

// Helper functions to maintain backward compatibility
const getOrigin = () => routePoints.find(p => p.type === 'origin');
const getDestination = () => routePoints.find(p => p.type === 'destination');
const getWaypoints = () => routePoints.filter(p => p.type === 'waypoint');
```

**Benefits of this approach:**
- Single array is easier to manage than separate state
- Natural ordering for route calculation
- Easy to add/remove points at any index
- Maps cleanly to API `coordinates: Coordinates[]` parameter

### Phase 2: Context Menu Enhancement (1 day)

**Current context menu (map-with-context-menu.tsx):**
```typescript
// Add new handler for waypoints
interface MapProps {
  onSetOrigin?: (coordinates: Coordinates) => void;
  onSetDestination?: (coordinates: Coordinates) => void;
  onAddWaypoint?: (coordinates: Coordinates) => void;  // NEW
}

// Enhanced context menu options
const renderContextMenu = () => (
  <div>
    <div onClick={handleFromHere}>🟢 Origin</div>
    <div onClick={handleToHere}>🔴 Destination</div>
    {hasOrigin && !hasDestination && (
      <div onClick={handleAddWaypoint}>🔵 Add waypoint here</div>
    )}
    {hasOrigin && hasDestination && (
      <div onClick={handleInsertWaypoint}>🔵 Insert waypoint here</div>
    )}
  </div>
);
```

**Logic for waypoint insertion:**
```typescript
const handleAddWaypoint = () => {
  if (!contextMenu.coordinates) return;
  
  const newWaypoint: RoutePoint = {
    id: `waypoint-${Date.now()}`,
    coordinates: contextMenu.coordinates,
    type: 'waypoint',
  };
  
  setRoutePoints(current => {
    const origin = current.find(p => p.type === 'origin');
    const destination = current.find(p => p.type === 'destination');
    const waypoints = current.filter(p => p.type === 'waypoint');
    
    // Insert waypoint before destination
    return [
      ...(origin ? [origin] : []),
      ...waypoints,
      newWaypoint,
      ...(destination ? [destination] : [])
    ];
  });
};
```

### Phase 3: Route Calculation Update (1 day)

**Current API call (only 2 points):**
```typescript
// lib/solvice-api.ts - calculateRoute function already supports this!
export async function calculateRoute(
  origin: Coordinates,
  destination: Coordinates,  // Remove this parameter
  options?: CreateRouteOptions
): Promise<RouteResponse>

// Change to:
export async function calculateRouteMulti(
  coordinates: Coordinates[],  // Array of all points
  options?: CreateRouteOptions
): Promise<RouteResponse>
```

**Update useRoute hook:**
```typescript
// hooks/use-route.ts 
const calculateRoute = useCallback((
  routePoints: RoutePoint[],    // Instead of origin/destination
  options?: CreateRouteOptions,
  debounceMs: number = 300
) => {
  if (routePoints.length < 2) {
    // Clear route if insufficient points
    setState(prev => ({ ...prev, route: null }));
    return;
  }
  
  const coordinates = routePoints.map(p => p.coordinates);
  
  // Call updated API
  const routeData = await apiCalculateRouteMulti(coordinates, options);
}, []);
```

**Backend already supports this!**
The `app/api/route/route.ts` already accepts `coordinates: Coordinates[]` - no backend changes needed.

### Phase 4: UI Updates (2 days)

**Marker rendering:**
```typescript
// In route/page.tsx
{routePoints.map((point, index) => (
  <Marker
    key={point.id}
    coordinates={point.coordinates}
    type={point.type}
    index={point.type === 'waypoint' ? index : undefined}
    onDragEnd={(coords) => handlePointDrag(point.id, coords)}
    onDelete={point.type === 'waypoint' ? () => handleDeletePoint(point.id) : undefined}
  />
))}
```

**Waypoint list in sidebar:**
```typescript
const WaypointList = ({ routePoints, onDelete, onReorder }) => (
  <div className="space-y-2">
    {routePoints.map((point, index) => (
      <div key={point.id} className="flex items-center gap-2 p-2 border rounded">
        <div className={`w-3 h-3 rounded-full ${getPointColor(point.type)}`} />
        <span className="flex-1 text-sm truncate">
          {point.address || `${point.coordinates[1].toFixed(4)}, ${point.coordinates[0].toFixed(4)}`}
        </span>
        {point.type === 'waypoint' && (
          <button onClick={() => onDelete(point.id)} className="text-red-500">×</button>
        )}
      </div>
    ))}
  </div>
);
```

### Phase 5: URL Parameters (1 day)

**Current URL format:**
```
/?origin=3.7174,51.0543&destination=3.7274,51.0643
```

**New format for backward compatibility:**
```
// Still support old format
/?origin=3.7174,51.0543&destination=3.7274,51.0643

// New format with waypoints
/?waypoints=3.7174,51.0543|3.7200,51.0600|3.7274,51.0643

// Mixed format (transition period)
/?origin=3.7174,51.0543&waypoints=3.7200,51.0600&destination=3.7274,51.0643
```

**URL parsing logic:**
```typescript
const parseUrlParams = (searchParams: URLSearchParams): RoutePoint[] => {
  const points: RoutePoint[] = [];
  
  // Check for new waypoints format first
  const waypointsParam = searchParams.get('waypoints');
  if (waypointsParam) {
    const coordinates = waypointsParam.split('|').map(coord => {
      const [lng, lat] = coord.split(',').map(Number);
      return [lng, lat] as Coordinates;
    });
    
    return coordinates.map((coord, index) => ({
      id: `url-point-${index}`,
      coordinates: coord,
      type: index === 0 ? 'origin' : 
            index === coordinates.length - 1 ? 'destination' : 'waypoint'
    }));
  }
  
  // Fall back to legacy origin/destination format
  const origin = searchParams.get('origin');
  const destination = searchParams.get('destination');
  
  if (origin) {
    const [lng, lat] = origin.split(',').map(Number);
    points.push({
      id: 'origin',
      coordinates: [lng, lat],
      type: 'origin'
    });
  }
  
  if (destination) {
    const [lng, lat] = destination.split(',').map(Number);
    points.push({
      id: 'destination', 
      coordinates: [lng, lat],
      type: 'destination'
    });
  }
  
  return points;
};
```

## Component Updates Required

### 1. Marker Component Enhancement
```typescript
// components/marker.tsx - Add waypoint number display
interface MarkerProps {
  coordinates: Coordinates;
  type: 'origin' | 'waypoint' | 'destination';
  index?: number;           // For waypoint numbering
  onDelete?: () => void;    // For waypoint deletion
  // ... existing props
}

const getMarkerContent = (type: string, index?: number) => {
  switch (type) {
    case 'origin': return 'A';
    case 'destination': return 'B';
    case 'waypoint': return index?.toString() || '•';
  }
};
```

### 2. Route Controls Update
```typescript
// components/route-demo-controls.tsx - Show waypoint count
const RouteInfo = ({ routePoints, route }) => (
  <div className="p-4 border rounded">
    <div className="flex justify-between mb-2">
      <span>Route Points:</span>
      <span>{routePoints.length}</span>
    </div>
    <div className="flex justify-between mb-2">
      <span>Waypoints:</span>
      <span>{routePoints.filter(p => p.type === 'waypoint').length}</span>
    </div>
    {route && (
      <>
        <div className="flex justify-between mb-2">
          <span>Distance:</span>
          <span>{formatDistance(route.routes[0].distance)}</span>
        </div>
        <div className="flex justify-between">
          <span>Duration:</span>
          <span>{formatDuration(route.routes[0].duration)}</span>
        </div>
      </>
    )}
  </div>
);
```

## Testing Strategy

### Unit Tests to Update
- [ ] `src/test/use-route.test.tsx` - Update for multi-waypoint calls
- [ ] `src/test/url-parameters.test.tsx` - Add waypoint URL parsing
- [ ] `src/test/map-with-context-menu.test.tsx` - Test waypoint context menu

### New Unit Tests
- [ ] Waypoint insertion logic
- [ ] RoutePoint array management
- [ ] URL parameter backward compatibility

### Integration Tests  
- [ ] Full user flow: origin → waypoint → destination
- [ ] Right-click waypoint insertion
- [ ] Waypoint deletion
- [ ] Route recalculation with waypoints

### E2E Tests
- [ ] Multi-waypoint route creation via UI
- [ ] URL sharing with waypoints
- [ ] Mobile waypoint management

## Performance Considerations

**Minimal Performance Impact Expected:**
- Backend API already supports coordinate arrays
- Route calculation time increases linearly (not exponentially) with waypoints
- UI only adds markers and list items - minimal rendering cost

**Optimizations:**
- Limit waypoints to 10-15 for demo purposes
- Debounce route calculation during rapid waypoint changes  
- Use React.memo for marker components
- Virtual scrolling if waypoint list becomes large

## Migration Strategy

**Backward Compatibility:**
- Keep existing origin/destination URL parameters working
- Maintain current click behavior (first click = origin, second = destination)
- Existing tests continue to pass with minimal changes

**Rollout Plan:**
1. Deploy with feature flag disabled
2. Test internally with multi-waypoints
3. Enable for demo users
4. Monitor performance and usage
5. Update documentation and sales materials

## Success Criteria

**Technical:**
- [ ] Support 1-15 waypoints between origin and destination
- [ ] Route calculation time < 3 seconds for 10 waypoints  
- [ ] Smooth UI interactions (no lag during waypoint operations)
- [ ] 100% backward compatibility with existing URLs

**User Experience:**
- [ ] Intuitive right-click waypoint insertion
- [ ] Clear visual hierarchy (origin → waypoints → destination)
- [ ] Easy waypoint removal
- [ ] Informative route information display

**Business Value:**
- [ ] Demonstrates multi-stop routing capability
- [ ] Shows Solvice API handling complex routes
- [ ] Enables more realistic demo scenarios
- [ ] Differentiates from simple A→B routing tools

This simplified approach focuses on the core user value (multi-stop routing) without the complexity of optimization algorithms, making it achievable in 1-2 weeks while still showcasing Solvice's capabilities.