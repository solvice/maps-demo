# Table Sync Demo Specification

## Overview
Implement a `/table/sync` endpoint demo for the Solvice Maps application, providing a synchronous matrix calculation service that computes distance and duration matrices between multiple geographic coordinates.

## API Integration

### Endpoint
- **URL**: `https://routing.solvice.io/table/sync`
- **Method**: POST
- **Authentication**: API key via Authorization header (server-side proxy)

### Request Format (CreateTableDto)
```json
{
  "coordinates": [
    [4.9, 50.2],
    [4.8, 50.4], 
    [5.0, 50.9],
    [5.05, 50.9]
  ],
  "sources": [0, 1, 2, 3],
  "destinations": [0, 1, 2, 3],
  "annotations": ["duration", "distance"],
  "vehicleType": "CAR",
  "engine": "OSM"
}
```

### Response Format (TableResponseDto)
```json
{
  "tableId": 12345,
  "durations": [
    [0, 1976.1, 5772.3, 5642.6],
    [2010.2, 0, 4783.9, 4654.2],
    [5817.2, 4797.4, 0, 508.6],
    [5705.3, 4685.5, 530.2, 0]
  ],
  "distances": [
    [0, 31561.2, 89234.1, 87123.4],
    [32012.5, 0, 74219.8, 72108.6],
    [89876.3, 74861.2, 0, 7891.2],
    [88234.7, 73945.1, 8123.4, 0]
  ],
  "sources": [...],
  "destinations": [...]
}
```

## User Interface

### Layout
- **Route**: `/table` (new page following existing pattern)
- **Navigation**: Add link from main page (`/`) to `/table`
- **Simple UI**: Minimal interface focused on coordinate input and map visualization

### Components

#### 1. Table Request Input
- **Type**: Large textarea for JSON input
- **Label**: "Table Request (JSON format)"
- **Placeholder**: Example CreateTableDto JSON object
- **Format**: Complete table request object matching CreateTableDto schema
- **Validation**: Client-side JSON parsing and table request validation
- **Auto-trigger**: Automatically start calculation on valid table request paste (no button needed)

#### 2. Map Visualization
- **Library**: MapLibre GL JS (consistent with existing route demo)
- **Theme**: Same light/dark theme toggle as route demo
- **Default View**: Auto-fit to show all coordinate points

#### 3. Interactive Elements

##### Markers
- **Style**: Small blue circles (consistent, simple design)
- **Position**: Plotted at each coordinate from the input
- **Hover Behavior**: Show tooltip with lat/lon coordinates
- **Tooltip Format**: `"Lat: 50.2000, Lng: 4.9000"`

##### Connection Lines
- **Visibility**: Show only when hovering over a marker
- **Style**: Thin lines connecting hovered marker to all other markers
- **Color**: Neutral color (e.g., gray or blue)
- **Hover Behavior**: Show tooltip on line hover with distance/duration
- **Tooltip Format**: `"Distance: 31.6 km, Duration: 32.9 min"`

### Error Handling
- **Invalid JSON**: Toast notification for parsing errors
- **Invalid Coordinates**: Toast notification for coordinate validation errors
- **API Errors**: Toast notification using existing error handling pattern
- **Loading State**: Show loading spinner during API request

## Technical Implementation

### File Structure
Following existing patterns:
```
app/
├── table/
│   └── page.tsx              # Main table demo page
├── api/
│   └── table/
│       └── sync/
│           └── route.ts      # Server-side API proxy
components/
├── table-*.tsx               # Table-specific components
hooks/
├── use-table.ts              # Table calculation hook
lib/
├── solvice-table-api.ts      # Table API client functions
```

### API Proxy Implementation
- **File**: `app/api/table/sync/route.ts`
- **Pattern**: Follow existing `app/api/route/route.ts` structure
- **Validation**: Use coordinate validation utilities from existing codebase
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Security**: Server-side API key management (same as route endpoint)

### Client-Side Integration
- **Hook**: `use-table.ts` for managing table calculations
- **API Client**: `solvice-table-api.ts` for TypeScript interface
- **State Management**: Loading states, error handling, result storage
- **Debouncing**: Optional debouncing for textarea input changes

### TypeScript Interfaces
```typescript
interface TableRequest {
  coordinates: [number, number][];
  sources?: number[];
  destinations?: number[];
  annotations?: string[];
  vehicleType?: 'CAR' | 'BIKE' | 'TRUCK' | 'ELECTRIC_CAR' | 'ELECTRIC_BIKE';
  engine?: 'OSM' | 'TOMTOM' | 'GOOGLE' | 'ANYMAP';
}

interface TableResponse {
  tableId: number;
  durations?: number[][];
  distances?: number[][];
  sources?: Waypoint[];
  destinations?: Waypoint[];
}
```

## Default Configuration
- **Vehicle Type**: CAR
- **Routing Engine**: OSM
- **Annotations**: ["duration", "distance"]
- **Sources/Destinations**: Use all coordinates as both sources and destinations

## Example Table Request
Provide example table request in the textarea placeholder:
```json
{
  "coordinates": [
    [4.9, 50.2],
    [4.8, 50.4], 
    [5.0, 50.9],
    [5.05, 50.9]
  ],
  "sources": [0, 1, 2, 3],
  "destinations": [0, 1, 2, 3],
  "annotations": ["duration", "distance"],
  "vehicleType": "CAR",
  "engine": "OSM"
}
```

## Testing Requirements
- **Unit Tests**: Coordinate parsing, validation, API client
- **Integration Tests**: API proxy functionality
- **E2E Tests**: Complete user workflow (input → calculation → visualization)
- **Error Scenarios**: Invalid JSON, API failures, network timeouts

## Performance Considerations
- **Matrix Size Limit**: Enforce 50x50 matrix limit (API constraint)
- **Input Validation**: Client-side validation before API calls
- **Memory Management**: Proper MapLibre resource cleanup
- **Request Optimization**: Single API call per coordinate set

## Future Enhancements
- **Export Functionality**: Download matrix results as CSV/JSON
- **Coordinate Import**: File upload for coordinate sets
- **Advanced Visualization**: Color-coded matrices, heatmap overlays
- **Batch Processing**: Multiple coordinate sets comparison
- **URL Sharing**: Share coordinate sets via URL parameters