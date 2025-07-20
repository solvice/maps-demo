# Old Codebase Analysis

## Overview
Analysis of the existing JavaScript/Leaflet-based maps application in `old-code/` directory. This evaluation provides insights for the new React/TypeScript/MapLibre implementation while maintaining the planned approach.

## Technology Stack (Current)
- **Leaflet** (~1.9.4) - Map library
- **Browserify** - Module bundling (outdated)
- **Vanilla JavaScript** - No framework
- **leaflet-routing-machine** - Routing functionality
- **leaflet-control-geocoder** - Geocoding
- **MapLibre GL** (4.5.2) - Present but commented out
- **Local Storage** - State persistence

## Architecture Analysis

### Core Components Structure
```
src/
├── index.js              # Main application entry
├── routing-engine/       # Custom routing logic
├── geocoder.js          # Geocoding functionality  
├── itinerary_builder.js # Route display
├── leaflet_options.js   # Map configuration
├── state.js             # State management
└── tools.js             # Utility controls
```

### Key Implementation Patterns

#### 1. Map Initialization (lines 29-34)
```javascript
var map = L.map('map', {
  zoomControl: true,
  dragging: true,
  layers: layers,
  maxZoom: 18
}).setView(mergedOptions.center, mergedOptions.zoom);
```
**Insight**: Simple, effective map setup with sensible defaults.

#### 2. Click-to-Place Logic (lines 197-211)
```javascript
map.on('click', function (e){
  addWaypoint(e.latlng);
});

function addWaypoint(waypoint) {
  var length = lrmControl.getWaypoints().filter(function(pnt) {
    return pnt.latLng;
  });
  length = length.length;
  if (!length) {
    lrmControl.spliceWaypoints(0, 1, waypoint);
  } else {
    if (length === 1) length = length + 1;
    lrmControl.spliceWaypoints(length - 1, 1, waypoint);
  }
}
```
**Insight**: Clear logic for first click → origin, second click → destination. This pattern should be replicated in our React implementation.

#### 3. Marker Creation (lines 84-107)
```javascript
function makeIcon(i, n) {
  var markerList = ['images/marker-start-icon-2x.png', 'images/marker-end-icon-2x.png'];
  if (i === 0) return L.icon({ iconUrl: markerList[0], ... });
  if (i === n - 1) return L.icon({ iconUrl: markerList[1], ... });
  else return L.icon({ iconUrl: 'images/marker-via-icon-2x.png', ... });
}
```
**Insight**: Visual distinction between origin/destination markers is important for UX.

#### 4. Real-time Routing Configuration (lines 110, 122)
```javascript
routeWhileDragging: true,
routeDragInterval: options.lrm.routeDragInterval,
```
**Insight**: Confirms our spec requirement for real-time route calculation with debouncing.

#### 5. Geocoding Integration (line 109)
```javascript
geocoder: L.Control.Geocoder.nominatim(),
```
**Insight**: Shows integration pattern for text input geocoding.

#### 6. MapLibre Integration (lines 64-72, commented)
```javascript
// L.maplibreGL({
//   style: 'https://cdn.solvice.io/styles/light.json',
// }).addTo(map2);
```
**Insight**: MapLibre was already considered but not fully implemented.

## Feature Analysis

### Implemented Features
- ✅ Click-to-place markers
- ✅ Drag markers for route recalculation  
- ✅ Text input with geocoding
- ✅ Real-time routing
- ✅ Route alternatives
- ✅ Marker click-to-remove
- ✅ GeoJSON route export
- ✅ Localization (12 languages)
- ✅ User preference persistence
- ✅ Geolocation with fallback
- ✅ Layer switching
- ✅ Route summary display

### Missing from Our Spec (Optional Enhancements)
- Route alternatives display
- Click-to-remove markers
- Route export functionality
- Multi-language support
- User preference persistence
- Layer switching controls

## Technical Debt & Limitations

### Build Process
- **Browserify** instead of modern bundlers (Vite/Webpack)
- **UglifyJS** for minification (outdated)
- No TypeScript support
- No modern testing framework

### Code Quality
- **Global variables** and imperative style
- **Mixed concerns** in main index.js
- **No type safety**
- **jQuery-style DOM manipulation**
- **Callback-based async patterns**

### Performance Issues
- **Bundle size**: Large bundle.js (likely unoptimized)
- **No code splitting**
- **No lazy loading**
- **Multiple map libraries** (Leaflet + MapLibre)

## Coordinate Handling Insights

### Current Format (Leaflet)
```javascript
// Leaflet uses lat/lng
e.latlng = { lat: 51.0543, lng: 3.7174 }
```

### Required Format (Solvice API)
```javascript
// API expects lon/lat order
coordinates: [3.7174, 51.0543]
```

**Critical**: Coordinate conversion will be essential in our implementation.

## State Management Patterns

### Current Approach
```javascript
// Global state with local storage
var mergedOptions = L.extend(leafletOptions.defaultState, parsedOptions);
ls.set('layer', e.name);  // Persist user preferences
```

### Recommended Modern Approach
- React state hooks for UI state
- Context for shared state
- Local storage for preferences only

## Routing Engine Architecture

The routing engine is well-modularized:
- `osrm-v1.js` - API client
- `control.js` - UI controls
- `plan.js` - Waypoint management
- `line.js` - Route visualization
- `itinerary.js` - Route instructions

**Insight**: This modular approach should inform our React component structure.

## Recommendations for New Implementation

### What to Preserve
1. **Click-to-place logic** - Works well, proven UX
2. **Real-time routing** - Core feature that users expect
3. **Marker visual distinction** - Clear origin/destination UX
4. **Coordinate validation** - Prevent invalid routing requests
5. **Debounced drag updates** - Performance optimization

### What to Modernize
1. **Framework**: React with hooks vs vanilla JS
2. **Bundling**: Vite vs Browserify
3. **Type Safety**: TypeScript vs vanilla JS
4. **Testing**: Modern testing stack vs none
5. **State Management**: React patterns vs global variables
6. **Map Library**: MapLibre vs Leaflet
7. **Styling**: Tailwind/shadcn vs custom CSS
8. **API Client**: Modern fetch vs custom HTTP

### What to Avoid
1. **Large bundle sizes** - Current bundle.js is likely bloated
2. **Global state pollution** - Keep state local to components
3. **Mixed library approaches** - Stick to MapLibre, avoid Leaflet
4. **Imperative DOM manipulation** - Use React declarative patterns
5. **Callback hell** - Use modern async/await patterns

## Conclusion

The old codebase provides excellent functional reference for our new implementation. The core UX patterns (click-to-place, real-time routing, marker dragging) are solid and should be preserved. However, the technical implementation needs complete modernization for maintainability, performance, and developer experience.

The analysis confirms our planned approach is sound while highlighting the importance of proper coordinate handling and real-time interaction patterns.