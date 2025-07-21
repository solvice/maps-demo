# URL Parameters Documentation

The Solvice Maps application supports URL parameters that allow users to share specific route configurations and automatically load routes with predefined settings.

## Overview

URL parameters enable:
- **Direct Route Sharing**: Share complete route configurations via URL
- **Bookmarking**: Save specific route queries for later use
- **API Integration**: Programmatically generate URLs for specific routes
- **Deep Linking**: Link directly to route results from external applications

## Supported Parameters

### Core Route Parameters

#### `origin`
- **Type**: Comma-separated coordinates `longitude,latitude`
- **Format**: `origin=lng,lat`
- **Example**: `origin=3.7174,51.0543`
- **Description**: Sets the starting point for route calculation
- **Notes**: Coordinates are automatically reverse-geocoded to display human-readable addresses

#### `destination`
- **Type**: Comma-separated coordinates `longitude,latitude`
- **Format**: `destination=lng,lat`
- **Example**: `destination=3.7274,51.0643`
- **Description**: Sets the ending point for route calculation
- **Notes**: Coordinates are automatically reverse-geocoded to display human-readable addresses

### Route Configuration Parameters

#### `vehicle`
- **Type**: String (enum)
- **Valid Values**: `CAR`, `TRUCK`, `BIKE`, `ELECTRIC_CAR`, `ELECTRIC_BIKE`
- **Default**: `CAR`
- **Example**: `vehicle=TRUCK`
- **Description**: Specifies the vehicle type for route optimization
- **Notes**: Different vehicle types may produce different routes based on restrictions and preferences

#### `engine`
- **Type**: String (enum)
- **Valid Values**: `OSM`, `TOMTOM`, `GOOGLE`, `ANYMAP`
- **Default**: `OSM`
- **Example**: `engine=TOMTOM`
- **Description**: Selects the routing engine for route calculation
- **Notes**: Different engines may provide different route options and data quality

#### `steps`
- **Type**: Boolean string
- **Valid Values**: `true`, `false`
- **Default**: `false`
- **Example**: `steps=true`
- **Description**: Enables turn-by-turn navigation instructions and detailed route steps
- **Notes**: When enabled, shows the speed profile chart and step-by-step directions

## URL Structure

### Base URL Format
```
https://your-domain.com/?[parameter1]=[value1]&[parameter2]=[value2]...
```

### Complete Example
```
https://maps-demo.solvice.io/?origin=3.7174,51.0543&destination=3.7274,51.0643&engine=TOMTOM&steps=true
```

This URL will:
- Set origin to coordinates 3.7174°, 51.0543° (Brussels area)
- Set destination to coordinates 3.7274°, 51.0643° (nearby location)
- Use CAR vehicle profile for routing (default)
- Use TOMTOM routing engine
- Enable turn-by-turn instructions

## Usage Examples

### Basic Route
Load a simple car route between two points:
```
/?origin=3.7174,51.0543&destination=3.7274,51.0643
```

### Route with Instructions
Load a car route with turn-by-turn directions using TOMTOM:
```
/?origin=3.7174,51.0543&destination=3.7274,51.0643&engine=TOMTOM&steps=true
```

### Truck Route with TOMTOM
Use truck routing with TOMTOM engine:
```
/?origin=3.7174,51.0543&destination=3.7274,51.0643&vehicle=TRUCK&engine=TOMTOM
```

### Complete Configuration
Full route configuration with all parameters:
```
/?origin=3.7174,51.0543&destination=3.7274,51.0643&vehicle=TRUCK&engine=TOMTOM&steps=true
```

## Implementation Details

### URL Encoding
Coordinates use simple comma-separated format (URL-safe):
- Format: `3.7174,51.0543`
- No encoding required for standard coordinate values

### Parameter Precedence
1. URL parameters take precedence over default values
2. Invalid parameters are ignored (logged to console)
3. Missing parameters use application defaults

### Automatic Behaviors

#### Route Calculation
- Routes are automatically calculated when both origin and destination are present
- Route updates occur when any configuration parameter changes
- Traffic comparison is enabled based on routing engine capabilities

#### Address Resolution
- Coordinates are reverse-geocoded to display human-readable addresses
- Geocoding occurs asynchronously and doesn't block route calculation
- Fallback to coordinate display if geocoding fails

#### URL Synchronization
- URL automatically updates when route parameters change
- Only non-default values are included in the URL
- URL changes don't trigger page reloads (uses `router.replace`)

## Error Handling

### Invalid Coordinates
```javascript
// Invalid coordinates format
/?origin=invalid-coordinates
// Result: Parameter ignored, no origin marker displayed

// Missing coordinate
/?origin=3.7174
// Result: Parameter ignored, no origin marker displayed
```

### Invalid Vehicle Type
```javascript
// Unknown vehicle type
/?vehicle=SPACESHIP
// Result: Parameter ignored, defaults to CAR
```

### Malformed Parameters
- Invalid JSON is caught and logged to console
- Malformed parameters don't crash the application
- Invalid values are ignored and defaults are used

## API Integration

### Generating URLs Programmatically

```javascript
function generateRouteUrl(config) {
  const params = new URLSearchParams();
  
  if (config.origin) {
    params.set('origin', `${config.origin[0]},${config.origin[1]}`);
  }
  
  if (config.destination) {
    params.set('destination', `${config.destination[0]},${config.destination[1]}`);
  }
  
  if (config.vehicle && config.vehicle !== 'CAR') {
    params.set('vehicle', config.vehicle);
  }
  
  if (config.engine && config.engine !== 'OSM') {
    params.set('engine', config.engine);
  }
  
  if (config.steps) {
    params.set('steps', 'true');
  }
  
  return `${window.location.origin}/?${params.toString()}`;
}

// Usage
const routeUrl = generateRouteUrl({
  origin: [3.7174, 51.0543],
  destination: [3.7274, 51.0643],
  vehicle: 'TRUCK',
  engine: 'TOMTOM',
  steps: true
});
```

### Parsing Current URL Parameters

```javascript
function getCurrentRouteConfig() {
  const params = new URLSearchParams(window.location.search);
  const config = {};
  
  const origin = params.get('origin');
  if (origin) {
    try {
      const parts = origin.split(',');
      if (parts.length === 2) {
        const coords = [parseFloat(parts[0]), parseFloat(parts[1])];
        if (!isNaN(coords[0]) && !isNaN(coords[1])) {
          config.origin = coords;
        }
      }
    } catch (e) {
      console.error('Invalid origin parameter:', e);
    }
  }
  
  const destination = params.get('destination');
  if (destination) {
    try {
      const parts = destination.split(',');
      if (parts.length === 2) {
        const coords = [parseFloat(parts[0]), parseFloat(parts[1])];
        if (!isNaN(coords[0]) && !isNaN(coords[1])) {
          config.destination = coords;
        }
      }
    } catch (e) {
      console.error('Invalid destination parameter:', e);
    }
  }
  
  config.vehicle = params.get('vehicle') || 'CAR';
  config.engine = params.get('engine') || 'OSM';
  config.steps = params.get('steps') === 'true';
  
  return config;
}
```

## Best Practices

### URL Structure
- Keep URLs as short as possible by omitting default values
- Use descriptive parameter names that are easy to understand
- Maintain consistent parameter ordering for readability

### Error Handling
- Always validate coordinate values before using them
- Provide fallbacks for invalid or missing parameters
- Log errors to help with debugging but don't show them to users

### Performance
- Debounce URL updates to avoid excessive history entries
- Use `router.replace()` instead of `router.push()` to avoid cluttering browser history
- Only update URL when parameters actually change

### User Experience
- Display loading states while routes are calculating
- Show meaningful error messages for route calculation failures
- Provide visual feedback when parameters are loaded from URL

## Browser Support

### Required Features
- `URLSearchParams` API (supported in all modern browsers)
- `JSON.parse()` and `JSON.stringify()` (universal support)
- Next.js `useSearchParams` and `useRouter` hooks

### Fallback Behavior
- Graceful degradation when URL APIs are not available
- Application functions normally without URL parameter support
- Manual parameter entry remains available as backup

## Security Considerations

### Input Validation
- All URL parameters are validated before use
- Invalid JSON is safely caught and handled
- No eval() or similar dangerous operations are used

### XSS Prevention
- Coordinate values are sanitized through JSON parsing
- String parameters are validated against allowed enums
- No user input is directly inserted into HTML

## Testing

The URL parameters functionality is thoroughly tested with:
- Unit tests for parameter parsing and validation
- Integration tests for route calculation triggering
- Error handling tests for invalid inputs
- URL generation and synchronization tests

See `src/test/url-parameters.test.tsx` for the complete test suite.