# Architecture Documentation

## Overview

The Maps Demo application is built using modern React patterns with a focus on clean separation of concerns, type safety, and performance. The architecture follows Next.js App Router conventions with server-side API integration for secure Solvice Maps API communication.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           Frontend (React/Next.js)              │
├─────────────────────────────────────────────────────────────────┤
│                     app/page.tsx (Main Container)               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Map Layer     │  │  Control Panels │  │  Route Display  │  │
│  │                 │  │                 │  │                 │  │
│  │ • MapLibre GL   │  │ • Input Overlay │  │ • Route Sidebar │  │
│  │ • Markers       │  │ • Map Controls  │  │ • Speed Profile │  │
│  │ • Route Lines   │  │ • Context Menu  │  │ • Instructions  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      Shared State & Context                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  MapContext     │  │  Custom Hooks   │  │   Utilities     │  │
│  │                 │  │                 │  │                 │  │
│  │ • Map Instance  │  │ • useRoute      │  │ • Coordinates   │  │
│  │ • Event Handlers│  │ • useGeocoding  │  │ • Polyline      │  │
│  │                 │  │ • useGeolocation│  │ • Formatting    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                         API Layer                               │
│                    app/api/route/route.ts                       │
│                    (Server-side Proxy)                          │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Solvice API    │  │  Map Tiles      │  │   Geocoding     │  │
│  │                 │  │                 │  │                 │  │
│  │ • Route Calc    │  │ • Light/Dark    │  │ • Mock Service  │  │
│  │ • Turn-by-Turn  │  │ • Vector Tiles  │  │ • Address Search│  │
│  │ • Speed Data    │  │                 │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Hierarchy

### Core Components

**Main Container (`app/page.tsx`)**
- Central state management for the entire application
- Coordinates communication between all child components
- Manages origin/destination coordinates, route config, and UI state

**Map Layer Components**
```
Map (map.tsx)
├── MapWithContextMenu (map-with-context-menu.tsx)
├── Marker (marker.tsx) × 2 (origin + destination)
├── RouteLayer (route-layer.tsx)
└── StepHighlight (step-highlight.tsx)
```

**Control Panel Components**
```
InputOverlay (input-overlay.tsx)
├── AutocompleteInput (autocomplete-input.tsx) × 2
└── RouteControlPanel (route-control-panel.tsx)
    ├── VehicleTypeToggle
    ├── RouteDetails
    ├── RouteInstructions (route-instructions.tsx)
    └── DebugControls
```

**Expert Controls**
```
MapControls (map-controls.tsx)
├── StyleToggle
├── TrafficToggle  
├── StepsToggle
├── PrecisionToggle
└── AlternativesToggle
```

**Route Display**
```
RouteSidebar (route-sidebar.tsx)
├── RouteDetails
├── SpeedProfile (elevation-profile.tsx)
└── RouteInstructions
```

## State Management

### 1. Application State (page.tsx)

The main container manages all critical application state:

```typescript
// Core coordinates
const [origin, setOrigin] = useState<Coordinates | null>(null);
const [destination, setDestination] = useState<Coordinates | null>(null);

// Route configuration
const [routeConfig, setRouteConfig] = useState<RouteConfig>({
  vehicleType: 'CAR',
  alternatives: 1,
  steps: false,
  geometries: 'polyline',
  routingEngine: 'OSM'
});

// UI state
const [isDragging, setIsDragging] = useState(false);
const [highlightedRoute, setHighlightedRoute] = useState<number | null>(null);
const [highlightedStepGeometry, setHighlightedStepGeometry] = useState<string | null>(null);
```

### 2. Context-Based State (MapContext)

```typescript
export interface MapContextType {
  map: maplibregl.Map | null;
  setMap: (map: maplibregl.Map | null) => void;
}
```

The MapContext provides the MapLibre instance to all map-related components, enabling:
- Layer management
- Event handling
- Geometry rendering
- Style updates

### 3. Custom Hook State Management

**useRoute Hook**
- Manages route calculation requests
- Handles debouncing during marker dragging
- Provides request cancellation and error handling
- Returns route data, loading states, and error information

**useGeocoding Hook**
- Handles forward/reverse geocoding requests
- Provides autocomplete suggestions
- Manages debounced search queries

**useGeolocation Hook**
- Manages browser geolocation requests
- Provides user's current position
- Handles permission states and errors

## Data Flow

### 1. Route Calculation Flow

```
User Action (click/drag/input) 
    ↓
State Update (origin/destination)
    ↓
useRoute Hook (debounced calculation)
    ↓
API Request (app/api/route/route.ts)
    ↓
Solvice API Call
    ↓
Response Processing
    ↓
State Update (route data)
    ↓
UI Update (RouteLayer, RouteSidebar)
```

### 2. Marker Interaction Flow

```
Map Click/Drag Event
    ↓
Coordinate Extraction
    ↓
Marker Position Update
    ↓
Reverse Geocoding (if needed)
    ↓
Input Field Sync
    ↓
Route Recalculation (if both markers exist)
```

### 3. Configuration Change Flow

```
Control Panel Interaction
    ↓
Route Config Update
    ↓
Conditional Route Recalculation
    ↓
UI State Updates (instructions, speed profile)
```

## API Architecture

### Server-Side Proxy Pattern

The application uses a secure server-side proxy to protect API credentials:

```typescript
// app/api/route/route.ts
export async function POST(request: NextRequest) {
  // 1. Extract request body
  const { coordinates, ...options } = await request.json();
  
  // 2. Validate inputs
  validateCoordinates(coordinates);
  
  // 3. Proxy to Solvice API
  const response = await fetch('https://routing.solvice.io/route', {
    headers: { 'Authorization': process.env.SOLVICE_API_KEY }
  });
  
  // 4. Return processed response
  return NextResponse.json(data);
}
```

**Benefits:**
- API key protection (never exposed to client)
- Request validation and sanitization
- Error handling and user-friendly messages
- Rate limiting and caching potential

### Client-Side API Layer

```typescript
// lib/solvice-api.ts
export async function calculateRoute(
  origin: Coordinates,
  destination: Coordinates,
  options: RouteConfig = {}
): Promise<RouteResponse> {
  // Client-side validation
  if (!isValidCoordinates(origin) || !isValidCoordinates(destination)) {
    throw new Error('Invalid coordinates provided');
  }

  // Request to internal API
  const response = await fetch('/api/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coordinates: [origin, destination], ...options })
  });

  // Error handling with user-friendly messages
  if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  return response.json();
}
```

## MapLibre Integration

### Map Lifecycle Management

```typescript
// components/map.tsx
export function Map({ center, zoom, onLoad, onClick, children }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    // Initialize map
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://cdn.solvice.io/styles/white.json',
      center, zoom
    });

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
}
```

### Layer Management Strategy

**Route Layers**
- Each route alternative gets its own layer and source
- Layers are cleaned up and recreated on route updates
- Proper z-index ordering for route highlighting

**Marker Management**
- Custom React markers using HTML elements
- Positioned using MapLibre's `Marker` class
- Drag event handling with coordinate callbacks

**Step Highlighting**
- Dynamic layer creation for speed profile interactions
- Temporary geometry highlighting on hover
- Proper cleanup on component unmount

## Performance Optimizations

### 1. Debouncing Strategy

```typescript
// Different debounce times based on interaction type
const calculateRoute = useCallback((origin, destination, options, debounceMs) => {
  const requestId = Date.now();
  currentRequestRef.current = requestId;
  
  debounceTimeoutRef.current = setTimeout(async () => {
    // Only update if still current request
    if (currentRequestRef.current === requestId) {
      // Make API call
    }
  }, debounceMs);
}, []);

// Usage:
// During dragging: debounceMs = 0 (instant)
// Regular updates: debounceMs = 300ms
// Geocoding: debounceMs = 500ms
```

### 2. Request Cancellation

```typescript
// Track current request to prevent race conditions
const currentRequestRef = useRef<number>(0);

// Cancel previous requests when new ones start
const handleNewRequest = () => {
  currentRequestRef.current = Date.now();
  // Previous requests check this ID and abort if stale
};
```

### 3. Efficient Re-rendering

```typescript
// Stable callback references
const handleOriginChange = useCallback((coords: Coordinates) => {
  setOrigin(coords);
  if (destination) calculateRoute(coords, destination, routeConfig, 300);
}, [destination, routeConfig, calculateRoute]);

// Memoized computations
const routeGeometry = useMemo(() => {
  if (!route?.routes?.[0]) return null;
  return decodePolyline(route.routes[0].geometry);
}, [route]);
```

## Error Handling Architecture

### 1. Error Boundary Pattern

```typescript
// components/error-boundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('Application Error:', error);
    
    // Show user-friendly notification
    toast.error('An unexpected error occurred. Please try refreshing the page.');
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />;
    }
    return this.props.children;
  }
}
```

### 2. API Error Classification

```typescript
// lib/solvice-api.ts
export function classifyError(error: unknown): string {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'Network error - please check your connection';
  }
  
  if (error instanceof Error) {
    if (error.message.includes('429')) {
      return 'Rate limit exceeded. Please try again later.';
    }
    if (error.message.includes('coordinates')) {
      return 'Invalid location selected. Please try a different location.';
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
}
```

### 3. Graceful Degradation

- Map continues to function if routing fails
- Fallback coordinates when geolocation fails
- Mock data for development/testing scenarios
- Proper loading states for async operations

## Security Considerations

### 1. API Key Protection
- Server-side proxy prevents client exposure
- Environment variable configuration
- No API keys in client-side code

### 2. Input Validation
- Coordinate bounds checking
- Request payload sanitization
- TypeScript type safety

### 3. XSS Prevention
- React's built-in XSS protection
- Sanitized user inputs
- No dangerouslySetInnerHTML usage

## Testing Architecture

### 1. Unit Testing (Vitest)
- Component rendering tests
- Hook behavior testing
- Utility function validation
- Mock external dependencies

### 2. Integration Testing
- API integration tests
- Component interaction tests
- State management testing
- Error handling verification

### 3. End-to-End Testing (Playwright)
- Complete user workflows
- Cross-browser compatibility
- Mobile responsiveness
- Performance testing

## Deployment Considerations

### Build Process
- Next.js static optimization
- TypeScript compilation
- CSS optimization with Tailwind
- Bundle analysis and tree shaking

### Environment Configuration
- Production API endpoints
- Environment-specific settings
- Performance monitoring setup
- Error reporting integration

### Scalability Patterns
- Component lazy loading
- API response caching
- CDN integration for static assets
- Progressive Web App features

## Future Architecture Considerations

### 1. State Management Evolution
- Consider Redux Toolkit for complex state
- Implement state persistence
- Add optimistic updates

### 2. Performance Enhancements
- Route calculation memoization
- Virtual scrolling for large datasets
- Service worker for offline support

### 3. Feature Expansion
- Multi-waypoint routing support
- Real-time traffic integration
- Route sharing and collaboration
- Advanced analytics and monitoring