# Maps Demo TDD Implementation Plan

## Project Overview
Building a React-based maps application with MapLibre, shadcn/ui, and real-time routing capabilities. The implementation follows Test-Driven Development principles with incremental, testable steps.

## Implementation Strategy

### Phase 1: Foundation & Setup
**Goal**: Establish project structure, testing framework, and basic components

### Phase 2: Core Map Functionality
**Goal**: Implement map display, geolocation, and basic interactions

### Phase 3: Marker System
**Goal**: Add marker placement, movement, and coordinate management

### Phase 4: Routing Integration
**Goal**: Connect to Solvice API and display routes

### Phase 5: Input Controls
**Goal**: Add text input with geocoding and autocomplete

### Phase 6: Route Details & Polish
**Goal**: Display route information and final UI refinements

---

## Detailed Implementation Steps

### Step 1: Project Setup & Testing Foundation
**Complexity**: Low | **Dependencies**: None

```
Set up a new React project with TypeScript, Tailwind CSS, and testing infrastructure. Initialize the project with Vite, configure Jest/Vitest for unit testing, React Testing Library for component testing, and Playwright for E2E testing. Set up shadcn/ui components and create a basic app shell with proper TypeScript configuration.

Requirements:
- Create React + TypeScript + Vite project
- Configure Tailwind CSS and shadcn/ui
- Set up testing frameworks (Vitest + React Testing Library + Playwright)
- Create basic App component with full viewport layout
- Add lint and typecheck scripts
- Implement basic error boundary

Testing focus:
- App renders without crashing
- Basic component structure is correct
- Build process works
- Linting and type checking pass
```

### Step 2: Map Container & Basic Display
**Complexity**: Medium | **Dependencies**: Step 1

```
Create the core Map component using MapLibre GL JS. Implement basic map initialization with the Solvice light style, proper container sizing, and error handling for map loading failures. The map should fill the full viewport and handle resize events.

Requirements:
- Install and configure MapLibre GL JS and React wrapper
- Create Map component with proper TypeScript types
- Implement map initialization with Solvice style
- Add proper error handling for style loading failures
- Ensure map fills full viewport and handles window resize
- Add basic map controls (zoom, pan)

Testing focus:
- Map component renders with correct container
- Map loads with Solvice style successfully
- Error states are handled gracefully
- Map responds to container size changes
- Basic map interactions work (zoom, pan)
```

### Step 3: Geolocation & Initial Positioning
**Complexity**: Medium | **Dependencies**: Step 2

```
Implement geolocation functionality with graceful fallback to Ghent coordinates. Handle browser permission requests, error states, and provide appropriate user feedback. Ensure the map centers correctly on successful geolocation or falls back appropriately.

Requirements:
- Implement browser geolocation with permission handling
- Add fallback to Ghent coordinates (3.7174, 51.0543)
- Handle geolocation errors and timeouts gracefully
- Center map on determined location with appropriate zoom level
- Add proper TypeScript types for coordinate handling

Testing focus:
- Geolocation success centers map correctly
- Geolocation failure falls back to Ghent
- Permission denied handled gracefully
- Timeout scenarios work correctly
- Map centers with appropriate zoom level
```

### Step 4: Coordinate Management System
**Complexity**: Medium | **Dependencies**: Step 3

```
Create a robust coordinate management system that handles coordinate transformations, validates coordinates, and manages the conversion between longitude-latitude and latitude-longitude formats as required by different APIs and display needs.

Requirements:
- Create coordinate utility functions and types
- Implement coordinate validation
- Handle coordinate format conversion (lon-lat vs lat-lon)
- Create coordinate state management hooks
- Add proper error handling for invalid coordinates

Testing focus:
- Coordinate conversion functions work correctly
- Coordinate validation catches invalid inputs
- State management maintains coordinate consistency
- Error handling for edge cases works
- TypeScript types prevent coordinate format errors
```

### Step 5: Marker Placement System
**Complexity**: Medium | **Dependencies**: Step 4

```
Implement the marker placement system that allows users to click on the map to place origin and destination markers. Handle the logic for first click (origin), second click (destination), and subsequent clicks (replace closest marker).

Requirements:
- Create Marker component with proper styling
- Implement click-to-place functionality
- Add logic for origin/destination marker placement
- Implement closest marker replacement for additional clicks
- Add visual distinction between origin and destination markers
- Handle marker state management

Testing focus:
- First click places origin marker
- Second click places destination marker
- Additional clicks replace closest marker
- Marker coordinates are tracked correctly
- Visual markers appear at correct map locations
- State updates trigger proper re-renders
```

### Step 6: Marker Dragging & Movement
**Complexity**: Medium | **Dependencies**: Step 5

```
Add drag functionality to both markers, allowing users to move them around the map. Implement smooth dragging interactions with proper coordinate updates and visual feedback during drag operations.

Requirements:
- Implement marker dragging functionality
- Add drag start/end event handling
- Update coordinates during drag operations
- Provide visual feedback during dragging
- Ensure dragging works on both touch and mouse
- Prevent map panning during marker drag

Testing focus:
- Markers can be dragged smoothly
- Coordinates update correctly during drag
- Drag events don't interfere with map interactions
- Touch and mouse dragging both work
- Visual feedback appears during drag operations
- Drag operations update application state
```

### Step 7: Solvice API Integration
**Complexity**: High | **Dependencies**: Step 6

```
Integrate with the Solvice Maps API for route calculation. Implement API client with proper error handling, coordinate format conversion, and response parsing. Handle API failures gracefully with user feedback.

Requirements:
- Create Solvice API client with TypeScript types
- Implement route calculation endpoint integration
- Handle coordinate format requirements (lon-lat order)
- Add comprehensive error handling and retry logic
- Implement proper request/response types
- Add API response validation

Testing focus:
- API client handles coordinate format correctly
- Route requests succeed with valid coordinates
- Error responses are handled appropriately
- API timeouts are managed gracefully
- Response data is properly typed and validated
- Retry logic works for transient failures
```

### Step 8: Route Display & Visualization
**Complexity**: Medium | **Dependencies**: Step 7

```
Display calculated routes on the map using polylines with clean visual styling. Implement route rendering that matches the v0.dev/shadcn aesthetic with proper colors, line weights, and visual hierarchy.

Requirements:
- Create route polyline rendering
- Implement clean, modern route styling
- Add route layer management
- Handle route updates and clearing
- Ensure route visibility and contrast
- Add smooth route animation (optional)

Testing focus:
- Routes render correctly on the map
- Route styling matches design requirements
- Route updates work smoothly
- Multiple route calculations handle correctly
- Route clearing works properly
- Visual hierarchy is maintained
```

### Step 9: Real-time Route Calculation
**Complexity**: High | **Dependencies**: Step 8

```
Implement automatic route calculation that triggers when the second marker is placed and whenever either marker is moved. Handle debouncing for smooth performance during drag operations and manage loading states appropriately.

Requirements:
- Trigger route calculation on second marker placement
- Implement automatic recalculation on marker movement
- Add debouncing for drag operations
- Handle concurrent API requests properly
- Manage route calculation state
- Add proper error recovery

Testing focus:
- Route calculates automatically on second marker
- Route recalculates when markers move
- Debouncing prevents excessive API calls
- Concurrent requests are handled correctly
- Error states don't break the flow
- Performance remains smooth during interactions
```

### Step 10: Top-left Input Overlay
**Complexity**: Medium | **Dependencies**: Step 9

```
Create the top-left overlay panel with origin and destination input fields. Implement clean shadcn/ui styling that matches the design requirements and ensure proper responsive behavior for mobile devices.

Requirements:
- Create overlay panel component with shadcn/ui
- Add origin and destination input fields
- Implement responsive design for mobile stacking
- Ensure proper z-index and positioning
- Add clean, minimal styling
- Handle focus states and accessibility

Testing focus:
- Overlay appears in correct position
- Input fields render with proper styling
- Mobile responsive behavior works
- Overlay doesn't interfere with map interactions
- Accessibility features work correctly
- Visual hierarchy is maintained
```

### Step 11: Input-Map Synchronization
**Complexity**: High | **Dependencies**: Step 10

```
Implement bidirectional synchronization between map markers and text input fields. When markers move, update input fields with addresses. When users type in inputs, update marker positions accordingly.

Requirements:
- Sync marker coordinates to input field addresses
- Implement reverse geocoding for coordinate-to-address
- Add debouncing for smooth input updates
- Handle geocoding errors gracefully
- Maintain state consistency between inputs and markers
- Add proper loading states for geocoding operations

Testing focus:
- Moving markers updates input fields
- Input field changes move markers
- Synchronization works in both directions
- Debouncing prevents excessive API calls
- Error states are handled gracefully
- State remains consistent across interactions
```

### Step 12: Geocoding & Autocomplete
**Complexity**: High | **Dependencies**: Step 11

```
Add geocoding service integration with autocomplete functionality for the input fields. Implement search-as-you-type with proper debouncing, result selection, and error handling for geocoding operations.

Requirements:
- Integrate geocoding service (MapBox, Google, or alternative)
- Implement autocomplete with search suggestions
- Add debounced search functionality
- Handle geocoding API responses and errors
- Implement result selection and coordinate extraction
- Add proper loading and error states

Testing focus:
- Autocomplete suggestions appear correctly
- Search debouncing works properly
- Geocoding results are accurate
- Result selection updates markers
- Error handling works for failed geocoding
- Loading states provide good UX
```

### Step 13: Route Details Sidebar
**Complexity**: Medium | **Dependencies**: Step 12

```
Create the right sidebar that displays route information including distance, travel time, and other relevant details. Implement clean design that complements the overall interface and ensure proper responsive behavior.

Requirements:
- Create route details sidebar component
- Display distance, travel time, and route info
- Implement responsive design for mobile
- Add clean shadcn/ui styling
- Handle empty states when no route exists
- Add proper loading states during calculation

Testing focus:
- Sidebar displays correct route information
- Route details update when route changes
- Responsive behavior works on mobile
- Empty states are handled properly
- Loading states appear during calculations
- Visual design matches specifications
```

### Step 14: Error Handling & Toast Notifications
**Complexity**: Low | **Dependencies**: Step 13

```
Implement comprehensive error handling throughout the application using Sonner toast notifications. Handle API failures, geocoding errors, and other edge cases with appropriate user feedback.

Requirements:
- Integrate Sonner toast notifications
- Add error handling for all API operations
- Implement user-friendly error messages
- Handle network connectivity issues
- Add proper error recovery mechanisms
- Ensure errors don't break application flow

Testing focus:
- Toast notifications appear for errors
- Error messages are user-friendly
- Application recovers from errors gracefully
- Network errors are handled appropriately
- Error states don't break user interactions
- Toast notifications have proper styling
```

### Step 15: Mobile Responsiveness & Polish
**Complexity**: Medium | **Dependencies**: Step 14

```
Implement comprehensive mobile responsiveness, ensure touch interactions work properly, and add final polish to the user interface. Test across different device sizes and ensure the application works well on mobile devices.

Requirements:
- Ensure all interactions work on touch devices
- Implement proper mobile responsive design
- Add touch-friendly target sizes
- Handle device orientation changes
- Optimize performance for mobile devices
- Add final UI polish and refinements

Testing focus:
- All interactions work on touch devices
- Responsive design works across device sizes
- Touch targets are appropriately sized
- Orientation changes are handled properly
- Performance is acceptable on mobile
- UI polish meets design requirements
```

### Step 16: End-to-End Integration & Testing
**Complexity**: High | **Dependencies**: Step 15

```
Implement comprehensive end-to-end testing that covers all user workflows, perform final integration testing, and ensure all components work together seamlessly. Add performance optimizations and final bug fixes.

Requirements:
- Create comprehensive E2E test suite
- Test all user workflows end-to-end
- Add performance monitoring and optimization
- Implement final bug fixes and polish
- Ensure cross-browser compatibility
- Add production build optimization

Testing focus:
- Complete user workflows work end-to-end
- All features integrate properly
- Performance meets requirements
- Cross-browser compatibility is verified
- Production build works correctly
- No critical bugs remain
```

---

## Testing Strategy

### Unit Tests
- Individual component functionality
- Utility function correctness
- State management logic
- API client operations

### Integration Tests
- Component interaction
- State synchronization
- API integration
- User workflow steps

### End-to-End Tests
- Complete user journeys
- Cross-browser compatibility
- Mobile device testing
- Performance validation

## Success Criteria
- All tests pass consistently
- Application works smoothly on desktop and mobile
- Real-time interactions feel responsive
- Error handling provides good user experience
- Code is maintainable and well-documented