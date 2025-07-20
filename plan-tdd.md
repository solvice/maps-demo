# Maps Demo - True TDD Implementation Plan

## Current State Assessment
**Status**: Steps 1-5 implemented without proper TDD approach
- ✅ Project setup with Next.js, TypeScript, shadcn/ui, MapLibre
- ✅ Basic map display with Solvice style
- ✅ Geolocation with Ghent fallback
- ✅ Coordinate management utilities
- ✅ Click-to-place marker system

**Issue**: Implementation was done without test-first development, violating TDD principles.

## TDD Recovery Strategy

### Option A: Retrofit Tests (Recommended for time efficiency)
Write comprehensive tests for existing functionality (Steps 1-5), then continue with proper TDD for remaining steps.

### Option B: Complete TDD Restart
Start over with pure TDD from Step 1, discarding current implementation.

**Recommendation**: Option A - Retrofit existing code with tests, then proper TDD forward.

---

## TDD Implementation Prompts

### Phase 1: Test Retrofit for Existing Code

#### TDD Prompt 1: Test Infrastructure Setup
```
Set up comprehensive testing infrastructure for the existing Maps Demo project. The project already has Next.js, TypeScript, and basic functionality implemented.

Requirements:
1. Install and configure Vitest for unit testing
2. Set up React Testing Library for component testing
3. Configure Playwright for E2E testing
4. Add testing scripts to package.json
5. Create test utilities and mocks for MapLibre GL
6. Set up test coverage reporting

Test-First Approach:
- Write a basic smoke test that the app renders
- Write tests for existing utility functions
- Write component tests for existing components
- Ensure all tests pass with current implementation

Expected outcome: Comprehensive test suite covering existing functionality with 80%+ coverage.
```

#### TDD Prompt 2: Coordinate Management Tests
```
Write comprehensive tests for the existing coordinate management system, following TDD principles for any missing functionality.

Existing code to test:
- /lib/coordinates.ts utilities
- /hooks/use-coordinates.ts hook
- Coordinate validation and conversion functions

TDD Process:
1. RED: Write failing tests for edge cases not covered
2. GREEN: Implement minimal code to pass
3. REFACTOR: Clean up implementation while keeping tests green

Test scenarios to cover:
- Coordinate validation with invalid inputs
- Coordinate format conversions (lon-lat ↔ lat-lng)
- Distance calculations between points
- Closest coordinate finding algorithm
- State management in useCoordinates hook
- Error handling for malformed data

Expected outcome: 100% test coverage for coordinate system with robust edge case handling.
```

#### TDD Prompt 3: Map Component Test Coverage
```
Create comprehensive tests for the existing Map component using TDD principles for any enhancements.

Existing component: /components/map.tsx

TDD Process:
1. RED: Write tests for current functionality
2. GREEN: Verify existing code passes tests
3. RED: Write tests for missing error scenarios
4. GREEN: Add minimal code for error handling
5. REFACTOR: Optimize while maintaining test coverage

Test scenarios:
- Map initialization with valid/invalid styles
- Click event handling and coordinate extraction
- Resize handling and responsive behavior
- Error states and recovery
- Context provider functionality
- Memory cleanup on unmount

Mock Strategy:
- Mock MapLibre GL constructor and methods
- Mock geolocation API responses
- Test without actual map rendering

Expected outcome: Robust Map component with 95%+ test coverage and better error handling.
```

### Phase 2: True TDD for New Features

#### TDD Prompt 4: Marker Dragging Implementation
```
Implement marker dragging functionality using strict TDD methodology. This builds on the existing marker placement system.

Current state: Markers can be placed by clicking, need to add drag functionality.

TDD RED-GREEN-REFACTOR Cycle:

**RED Phase - Write failing tests first:**
1. Test: Marker should become draggable when mouse down event occurs
2. Test: Dragging should update marker coordinates in real-time
3. Test: Drag end should finalize marker position
4. Test: Map panning should be disabled during marker drag
5. Test: Touch events should work for mobile dragging
6. Test: Invalid drag positions should be handled gracefully

**GREEN Phase - Minimal implementation:**
- Add drag event listeners to marker elements
- Implement coordinate updates during drag
- Handle drag start/end states
- Prevent map interaction during drag

**REFACTOR Phase:**
- Optimize drag performance with throttling
- Clean up event listener management
- Improve TypeScript types for drag events

Requirements:
- Update /components/marker.tsx with drag functionality
- Add drag state management to useCoordinates hook
- Implement proper event handling for mouse and touch
- Ensure smooth visual feedback during drag operations

Expected outcome: Fully tested draggable markers with smooth UX.
```

#### TDD Prompt 5: Solvice API Integration
```
Implement Solvice Maps API integration using pure TDD approach.

**RED Phase - Write failing tests first:**
1. Test: API client should format coordinates correctly (lon-lat order)
2. Test: Route request should succeed with valid origin/destination
3. Test: Route response should be properly typed and validated
4. Test: API errors should be handled gracefully with retries
5. Test: Network timeouts should fail gracefully
6. Test: Malformed responses should throw appropriate errors
7. Test: Concurrent requests should be handled correctly

**GREEN Phase - Minimal implementation:**
- Create /lib/solvice-api.ts client
- Implement route calculation endpoint
- Add proper TypeScript types for requests/responses
- Handle coordinate format conversion
- Basic error handling and retry logic

**REFACTOR Phase:**
- Optimize request/response handling
- Add proper logging and monitoring
- Improve error messages for user feedback

Mock Strategy:
- Mock fetch API for reliable testing
- Test with various API response scenarios
- Simulate network failures and timeouts

Expected outcome: Robust API client with 100% test coverage and reliable error handling.
```

#### TDD Prompt 6: Route Visualization
```
Implement route display on the map using TDD methodology.

**RED Phase - Write failing tests first:**
1. Test: Route polyline should render with correct coordinates
2. Test: Route styling should match design specifications
3. Test: Route should clear when markers are removed
4. Test: Multiple route calculations should handle correctly
5. Test: Route should update when coordinates change
6. Test: Visual hierarchy should be maintained

**GREEN Phase - Minimal implementation:**
- Create /components/route.tsx component
- Add MapLibre polyline rendering
- Implement route data processing
- Add basic styling and colors

**REFACTOR Phase:**
- Optimize rendering performance
- Add smooth animations for route updates
- Improve visual design

Testing approach:
- Mock MapLibre addLayer/removeLayer methods
- Test coordinate transformation for polylines
- Verify proper cleanup of route layers

Expected outcome: Smooth route visualization with clean, tested code.
```

#### TDD Prompt 7: Real-time Route Calculation
```
Implement automatic route calculation using TDD principles.

**RED Phase - Write failing tests first:**
1. Test: Route should calculate when second marker is placed
2. Test: Route should recalculate when markers are dragged
3. Test: Debouncing should prevent excessive API calls during drag
4. Test: Loading states should be managed correctly
5. Test: Error states should not break user flow
6. Test: Concurrent route requests should be handled properly

**GREEN Phase - Minimal implementation:**
- Create route calculation logic in useCoordinates hook
- Add debouncing for drag events
- Implement loading state management
- Handle API call coordination

**REFACTOR Phase:**
- Optimize debouncing timing
- Improve error recovery mechanisms
- Add performance monitoring

Testing strategy:
- Mock timers for debouncing tests
- Test race conditions with concurrent requests
- Verify proper cleanup of pending requests

Expected outcome: Responsive real-time routing with robust state management.
```

#### TDD Prompt 8: Input Overlay UI
```
Create the top-left input overlay using TDD methodology.

**RED Phase - Write failing tests first:**
1. Test: Overlay should render in top-left position
2. Test: Origin and destination inputs should be properly labeled
3. Test: Mobile responsive layout should stack vertically
4. Test: Inputs should not interfere with map interactions
5. Test: Accessibility features should work correctly
6. Test: Focus management should be intuitive

**GREEN Phase - Minimal implementation:**
- Create /components/input-overlay.tsx
- Add shadcn/ui input components
- Implement responsive positioning
- Basic accessibility features

**REFACTOR Phase:**
- Optimize responsive behavior
- Improve visual design consistency
- Enhance accessibility support

Testing approach:
- Test responsive breakpoints with viewport mocking
- Verify z-index layering with map
- Test keyboard navigation and screen readers

Expected outcome: Clean, accessible input overlay with comprehensive test coverage.
```

#### TDD Prompt 9: Input-Map Synchronization
```
Implement bidirectional synchronization between inputs and markers using TDD.

**RED Phase - Write failing tests first:**
1. Test: Moving markers should update input fields with addresses
2. Test: Typing in inputs should move markers to coordinates
3. Test: Reverse geocoding should convert coordinates to addresses
4. Test: Forward geocoding should convert addresses to coordinates
5. Test: Debouncing should prevent excessive geocoding calls
6. Test: Error states should be handled gracefully
7. Test: State consistency should be maintained

**GREEN Phase - Minimal implementation:**
- Add reverse geocoding service integration
- Implement input field updates from marker movement
- Add coordinate updates from input changes
- Basic error handling for geocoding failures

**REFACTOR Phase:**
- Optimize geocoding call frequency
- Improve error user experience
- Add better loading states

Mock strategy:
- Mock geocoding API responses
- Test with various address formats
- Simulate API failures and recoveries

Expected outcome: Seamless bidirectional synchronization with robust error handling.
```

#### TDD Prompt 10: Autocomplete & Geocoding
```
Add autocomplete functionality to input fields using TDD.

**RED Phase - Write failing tests first:**
1. Test: Search suggestions should appear as user types
2. Test: Debouncing should limit search API calls
3. Test: Result selection should update markers
4. Test: Loading states should provide good UX
5. Test: Empty search results should be handled
6. Test: Keyboard navigation should work in dropdown

**GREEN Phase - Minimal implementation:**
- Integrate geocoding service with search
- Add dropdown component for suggestions
- Implement result selection logic
- Basic keyboard navigation

**REFACTOR Phase:**
- Optimize search performance
- Improve visual design of dropdown
- Enhance keyboard accessibility

Testing strategy:
- Mock search API with various result sets
- Test keyboard interactions thoroughly
- Verify proper cleanup of search state

Expected outcome: Smooth autocomplete experience with full test coverage.
```

#### TDD Prompt 11: Route Details Sidebar
```
Create route information sidebar using TDD methodology.

**RED Phase - Write failing tests first:**
1. Test: Sidebar should display when route is calculated
2. Test: Distance and time should be formatted correctly
3. Test: Responsive behavior should work on mobile
4. Test: Empty states should be handled appropriately
5. Test: Loading states should appear during calculation
6. Test: Route updates should refresh sidebar content

**GREEN Phase - Minimal implementation:**
- Create /components/route-sidebar.tsx
- Display basic route information
- Implement responsive layout
- Add loading and empty states

**REFACTOR Phase:**
- Improve visual design and typography
- Add smooth transitions and animations
- Optimize for mobile experience

Testing approach:
- Test with mock route data
- Verify responsive breakpoints
- Test state transitions thoroughly

Expected outcome: Informative, responsive route details sidebar.
```

#### TDD Prompt 12: Comprehensive Error Handling
```
Implement comprehensive error handling using TDD principles.

**RED Phase - Write failing tests first:**
1. Test: Network errors should show appropriate toast messages
2. Test: API failures should not break application flow
3. Test: Invalid coordinates should be handled gracefully
4. Test: Geocoding failures should provide user feedback
5. Test: Error recovery should work correctly
6. Test: Error boundaries should catch unexpected errors

**GREEN Phase - Minimal implementation:**
- Enhance error boundary with better UX
- Add comprehensive Sonner toast integration
- Implement error recovery mechanisms
- Add proper error logging

**REFACTOR Phase:**
- Optimize error message content
- Improve error recovery flows
- Add error analytics if needed

Testing strategy:
- Simulate various error conditions
- Test error boundary behavior
- Verify proper error cleanup

Expected outcome: Robust error handling with excellent user experience.
```

#### TDD Prompt 13: Mobile Responsiveness & Polish
```
Implement comprehensive mobile support using TDD.

**RED Phase - Write failing tests first:**
1. Test: Touch interactions should work on all components
2. Test: Responsive layouts should adapt to screen sizes
3. Test: Touch targets should be appropriately sized
4. Test: Orientation changes should be handled correctly
5. Test: Performance should be acceptable on mobile devices
6. Test: Gesture conflicts should be avoided

**GREEN Phase - Minimal implementation:**
- Add touch event handling
- Implement responsive design improvements
- Optimize touch target sizes
- Handle orientation changes

**REFACTOR Phase:**
- Optimize mobile performance
- Improve touch interaction feedback
- Polish mobile-specific UX

Testing strategy:
- Use device simulation for testing
- Test various screen sizes and orientations
- Verify touch vs mouse event handling

Expected outcome: Excellent mobile experience with full functionality.
```

#### TDD Prompt 14: End-to-End Integration Testing
```
Create comprehensive E2E tests covering complete user workflows.

**Test Scenarios to Implement:**
1. Complete user journey: Open app → Set markers → View route → Get directions
2. Error recovery: Handle network failures gracefully
3. Mobile workflow: Touch interactions and responsive behavior
4. Accessibility: Screen reader and keyboard navigation
5. Performance: Load times and interaction responsiveness
6. Cross-browser compatibility: Major browsers and devices

**Implementation:**
- Use Playwright for E2E testing
- Create page object models for maintainability
- Add visual regression testing
- Implement performance monitoring
- Test real API endpoints in staging environment

**Coverage Goals:**
- 100% of critical user paths
- All error scenarios
- Mobile and desktop experiences
- Accessibility compliance

Expected outcome: Comprehensive E2E test suite ensuring production readiness.
```

---

## Updated Todo Tracking

### Completed (Needs Test Retrofit)
- [x] **Step 1**: Project Setup & Testing Foundation *(needs test coverage)*
- [x] **Step 2**: Map Container & Basic Display *(needs test coverage)*
- [x] **Step 3**: Geolocation & Initial Positioning *(needs test coverage)*
- [x] **Step 4**: Coordinate Management System *(needs test coverage)*
- [x] **Step 5**: Marker Placement System *(needs test coverage)*

### To Complete with True TDD
- [ ] **Phase 1**: Test Retrofit (Prompts 1-3)
- [ ] **Step 6**: Marker Dragging & Movement (Prompt 4)
- [ ] **Step 7**: Solvice API Integration (Prompt 5)
- [ ] **Step 8**: Route Display & Visualization (Prompt 6)
- [ ] **Step 9**: Real-time Route Calculation (Prompt 7)
- [ ] **Step 10**: Input Overlay UI (Prompt 8)
- [ ] **Step 11**: Input-Map Synchronization (Prompt 9)
- [ ] **Step 12**: Autocomplete & Geocoding (Prompt 10)
- [ ] **Step 13**: Route Details Sidebar (Prompt 11)
- [ ] **Step 14**: Error Handling & Polish (Prompt 12)
- [ ] **Step 15**: Mobile Responsiveness (Prompt 13)
- [ ] **Step 16**: E2E Integration Testing (Prompt 14)

## Success Criteria
- **Test Coverage**: 95%+ for all new code, 80%+ for retrofitted code
- **TDD Compliance**: All new features implemented test-first
- **Performance**: < 3s load time, smooth 60fps interactions
- **Accessibility**: WCAG 2.1 AA compliance
- **Mobile**: Full functionality on iOS/Android browsers
- **Browser Support**: Chrome, Firefox, Safari, Edge latest versions

## Next Action
Start with **TDD Prompt 1: Test Infrastructure Setup** to retrofit existing code with comprehensive tests before continuing with new feature development.