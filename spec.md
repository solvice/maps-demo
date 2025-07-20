# Maps Demo Application Specification

## Overview
A React-based maps application that recreates Solvice Maps functionality, focusing on routing capabilities with a clean, modern interface inspired by v0.dev and shadcn/ui design principles.

## Core Features

### Map Interaction
- **Marker Placement**: Users can click twice on the map to create origin and destination markers
- **Marker Movement**: Both markers are draggable, with real-time route recalculation on movement
- **Additional Clicks**: When clicking after two markers exist, replace the closest marker to the click location
- **Real-time Routing**: Route calculation triggers immediately on second marker placement and on any marker movement

### User Interface
- **Full Viewport Layout**: Map takes up entire viewport
- **Top-left Overlay**: Clean overlay panel containing origin and destination input fields
- **Mobile Responsive**: Overlay stacks vertically on mobile devices
- **Minimal UI**: Clean map interface with minimal or no additional controls

### Input Methods
- **Click-to-Place**: Primary interaction via map clicking
- **Text Input**: Origin and destination fields with autocomplete and geocoding
- **Dual Sync**: Both input methods update each other bidirectionally

### Route Display
- **Visual Route**: Polyline displayed on map with v0.dev/shadcn aesthetic
- **Route Details**: Right sidebar with route information (distance, travel time)
- **Error Handling**: Sonner toast notifications for API failures
- **No Loading States**: Fast API responses without spinner indicators

### Map Configuration
- **Initial View**: Start with user's browser geolocation, fallback to Ghent if denied
- **Map Provider**: MapLibre GL JS with React integration
- **Map Style**: Solvice light style (`https://cdn.solvice.io/styles/light.json`)
- **Internet Required**: No offline fallback, requires connectivity

## Technical Stack

### Core Technologies
- **React**: Frontend framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling framework
- **shadcn/ui**: Component library
- **MapLibre React**: Map visualization

### APIs and Integration
- **Solvice Maps API**: Routing endpoint (`/route`)
- **OpenAPI Spec**: https://mapr-gateway-staging-181354976021.europe-west1.run.app/q/openapi.yaml
- **API Documentation**: https://maps.solvice.io/llms-full.txt
- **Coordinate Format**: Longitude-Latitude order (as specified by API)

### Additional Components
- **Sonner**: Toast notifications for errors
- **Geocoding Service**: For address autocomplete and coordinate resolution

## User Experience Flow

1. **Application Load**
   - Map centers on user's geolocation (fallback: Ghent)
   - Clean interface with top-left input overlay
   - Empty state ready for interaction

2. **Route Creation**
   - User clicks first location → origin marker appears
   - User clicks second location → destination marker appears + route calculates
   - Route displays immediately with details in right sidebar

3. **Route Modification**
   - Drag either marker → route recalculates in real-time
   - Type in input fields → markers update + route recalculates
   - Click elsewhere on map → closest marker moves to new location

4. **Error Scenarios**
   - API failure → Sonner toast with error message
   - Invalid coordinates → Graceful handling with user feedback

## Design Principles

### Visual Design
- Clean, modern aesthetic following v0.dev standards
- Minimal interface elements
- Focus on map content
- Consistent shadcn/ui component styling

### Performance
- Fast API responses (no loading indicators)
- Real-time updates without lag
- Efficient re-rendering on marker movement

### Accessibility
- Keyboard navigation support
- Screen reader friendly
- High contrast route visualization
- Touch-friendly mobile interface

## Implementation Notes

### Map Initialization
```javascript
new maplibregl.Map({
  container: "map",
  hash: true,
  center: [userLon, userLat], // or Ghent fallback
  zoom: 12,
  style: 'https://cdn.solvice.io/styles/light.json',
});
```

### Coordinate Handling
- API expects longitude-latitude order
- Internal state should maintain consistency
- Convert between display formats and API format

### State Management
- Track origin/destination coordinates
- Sync between map markers and input fields
- Manage route data and display state

## Success Criteria
- Smooth, responsive map interactions
- Accurate route calculations and display
- Clean, professional UI matching design requirements
- Error-free operation under normal conditions
- Mobile-friendly responsive design