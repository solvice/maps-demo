# TDD Implementation Prompts for Table Page Testing

## Phase 1: Foundation Testing Infrastructure

### Step 1.1: Enhanced Test Utilities and Mocks

```
Create comprehensive testing utilities for the table page functionality. You need to build enhanced mocking capabilities specifically for table-related components.

Requirements:
1. Extend the existing test setup to support table-specific functionality
2. Create enhanced MapLibre mocks that handle marker creation, positioning, and layer management
3. Build API response fixtures for various table calculation scenarios
4. Set up toast notification mocking for success/error messages

Implementation approach:
- Examine existing test utilities in src/test/ directory
- Create table-specific mock data and fixtures
- Enhance MapLibre mock to support marker arrays and connection layers
- Add comprehensive API response scenarios (success, error, timeout, invalid data)
- Create helper functions for table component testing

Deliverables:
- Enhanced test utilities in src/test/utils/table-test-utils.ts
- API fixtures in src/test/fixtures/table-api-responses.ts
- Enhanced MapLibre mock supporting marker and layer operations
- Toast notification mock setup

Focus on TDD: Write tests first that demonstrate the required mock behavior, then implement the mocks to satisfy those tests.
```

### Step 1.2: Basic Unit Test Structure

```
Establish the fundamental unit testing structure for all table components. Create the scaffolding that will support comprehensive testing throughout the project.

Requirements:
1. Create basic rendering tests for each table component
2. Establish prop validation patterns
3. Implement error boundary testing
4. Set up test files with proper imports and mocking

Components to scaffold:
- TableDemoControls
- TableMarker  
- TableConnections
- useTable hook

Implementation approach:
- Follow existing test patterns from route components
- Create test files for each component with basic structure
- Write minimal rendering tests that currently fail
- Set up proper mock imports and dependencies
- Establish consistent test naming and organization

Deliverables:
- src/test/table-demo-controls.test.tsx (basic structure)
- src/test/table-marker.test.tsx (basic structure)  
- src/test/table-connections.test.tsx (basic structure)
- src/test/use-table.test.tsx (basic structure)
- Consistent test setup patterns across all files

Start with TDD: Write failing tests for basic rendering of each component, then implement minimal test setup to make them pass.
```

## Phase 2: Core Component Testing

### Step 2.1: TableDemoControls Component Tests

```
Implement comprehensive unit tests for the TableDemoControls component. This component handles JSON input, validation, loading states, and user feedback.

Requirements:
1. Test JSON textarea input validation and parsing
2. Test loading state display and user feedback  
3. Test help system popover and documentation links
4. Test calculation time display formatting
5. Test user input handling and change events

Key scenarios to test:
- Valid JSON input and parsing
- Invalid JSON handling and error display
- Loading state UI changes
- Calculation time formatting (ms display)
- Help popover trigger and content
- Documentation link functionality
- Textarea disabled state during loading
- Error message display and clearing

Implementation approach:
- Write failing tests for each feature first
- Mock dependencies (toast, window.open, etc.)
- Test user interactions with fireEvent
- Verify UI state changes and prop updates
- Test edge cases and error conditions

Focus areas:
- JSON validation logic
- UI state management
- User interaction handling
- Accessibility features

Start TDD: Write tests that verify the component handles valid/invalid JSON input correctly, then implement the necessary validation logic.
```

### Step 2.2: Table API Layer Tests

```
Create comprehensive tests for the table API integration layer. This includes both the client-side API functions and the server-side endpoint.

Requirements:
1. Test lib/solvice-table-api.ts client functions with various inputs
2. Test app/api/table/sync/route.ts endpoint validation and responses
3. Test error handling for network failures and invalid responses
4. Test input sanitization and security measures

API client tests (lib/solvice-table-api.ts):
- Input validation (coordinates, parameters)
- Request formatting and headers
- Response parsing and error handling
- Network timeout scenarios
- Rate limiting behavior

API endpoint tests (app/api/table/sync/route.ts):
- Request validation and sanitization
- Solvice API integration
- Error response formatting
- Security measures (API key handling)
- HTTP status code handling

Implementation approach:
- Mock fetch for client-side tests
- Mock Solvice API responses
- Test both success and failure scenarios
- Verify request/response formats
- Test error boundary conditions

Deliverables:
- Comprehensive tests for API client functions
- Server endpoint tests with mocked Solvice API
- Error scenario coverage
- Security and validation tests

TDD approach: Start with tests for basic API client function calls, then build the implementation to satisfy increasingly complex scenarios.
```

### Step 2.3: useTable Hook Tests

```
Implement thorough testing for the useTable hook, which manages the core business logic including dual API calls, traffic calculations, and state management.

Requirements:
1. Test dual API call management (baseline OSM + traffic TOMTOM)
2. Test traffic impact calculations and color mapping
3. Test debounced execution logic (300ms default, 0ms for tests)
4. Test state management and error recovery
5. Test request cancellation and race condition prevention

Key functionality to test:
- Simultaneous API calls to different engines
- Traffic impact calculation (ratio of traffic vs baseline times)
- State updates during loading/success/error phases  
- Debounced execution with proper cleanup
- Request cancellation when new requests are made
- Error handling and recovery mechanisms
- Calculation time tracking

Complex scenarios:
- Rapid successive calls (debouncing)
- Network failures during one or both API calls
- Partial data scenarios (baseline succeeds, traffic fails)
- Component unmounting during API calls
- Invalid response data handling

Implementation approach:
- Use @testing-library/react-hooks for hook testing
- Mock API calls with various response scenarios
- Test timing-dependent behavior with fake timers
- Verify state transitions and side effects
- Test cleanup and cancellation logic

TDD focus: Start with basic API call tests, then layer in complexity for traffic calculations, debouncing, and error handling.
```

## Phase 3: Interactive Component Testing

### Step 3.1: TableMarker Component Tests

```
Create comprehensive tests for the TableMarker component, focusing on MapLibre integration, positioning accuracy, and user interactions.

Requirements:
1. Test MapLibre marker creation and positioning
2. Test hover effects and animations
3. Test tooltip display with coordinate information
4. Test event handler management and cleanup
5. Test integration with map context

Key testing areas:
- Marker creation with proper MapLibre integration
- Positioning accuracy (coordinates to pixel mapping)
- Hover state changes (size animations, visual feedback)
- Tooltip content formatting and display
- Event listener attachment and cleanup
- Map style loading synchronization
- Marker anchor point accuracy

Interactive scenarios:
- Mouse enter/leave events
- Marker positioning at different zoom levels  
- Tooltip content with coordinate formatting
- Animation transitions during hover
- Multiple markers on same map
- Marker cleanup when component unmounts

Implementation approach:
- Mock MapLibre marker functionality thoroughly
- Test DOM element creation and styling
- Verify event handler attachment/removal
- Test coordinate formatting in tooltips
- Verify CSS styling and transitions
- Test map context integration

Challenges to address:
- MapLibre marker positioning mocking
- Animation testing with timing
- Event handler verification
- Memory leak prevention

TDD approach: Start with basic marker creation tests, then add hover interactions, tooltip functionality, and finally cleanup behavior.
```

### Step 3.2: TableConnections Component Tests

```
Implement comprehensive testing for the TableConnections component, which handles complex line visualization, traffic impact colors, and interactive tooltips.

Requirements:
1. Test background connection line rendering for all coordinate pairs
2. Test traffic impact color calculations (blue to red gradient)
3. Test hover interaction and popup display with distance/duration data
4. Test MapLibre layer management and cleanup
5. Test GeoJSON data generation and updates

Core functionality:
- Background line generation for all coordinate combinations
- Traffic impact color mapping based on calculated ratios
- Hover-specific line highlighting
- Interactive popups with formatted distance/duration data
- Layer source management (creation, updates, cleanup)
- Event handler management for line interactions

Complex scenarios:
- Large coordinate sets (performance)
- Traffic data with varying impact levels
- Missing or invalid traffic data
- Layer cleanup during component updates
- Multiple hover interactions
- Popup positioning and content

Advanced features to test:
- Color gradient calculations (getTrafficImpactColor function)
- GeoJSON feature generation
- MapLibre layer styling with dynamic colors
- Popup HTML generation and formatting
- Event handler attachment to specific layers

Implementation approach:
- Mock MapLibre layer operations comprehensively
- Test color calculation algorithms
- Verify GeoJSON generation for line features
- Test popup content and positioning
- Verify proper cleanup of layers and sources

TDD strategy: Begin with line generation tests, add traffic color calculations, then hover interactions, and finally comprehensive cleanup testing.
```

## Phase 4: Integration Testing

### Step 4.1: Component Communication Tests

```
Test the integration and communication patterns between table page components. Focus on data flow, event propagation, and state synchronization.

Requirements:
1. Test parent-child state synchronization (TableContent ↔ children)
2. Test event propagation and handling across component boundaries
3. Test map context integration and sharing
4. Test error boundary behavior and error state propagation

Integration patterns to verify:
- TableContent coordinates state → TableMarker rendering
- TableContent hoveredMarkerIndex → TableConnections highlighting
- useTable hook state → TableDemoControls display updates
- Map click events → TableContent coordinate updates
- Error states → Toast notifications → UI feedback

Data flow scenarios:
- JSON input parsing → coordinate extraction → marker creation
- Map clicks → coordinate addition → debounced calculation
- API responses → state updates → UI refresh
- Hover events → connection highlighting → popup display
- Error conditions → error propagation → user feedback

Implementation approach:
- Create integration test suites that render multiple components
- Test real data flow between components
- Verify state updates propagate correctly
- Test event handling across component boundaries
- Mock only external dependencies (not internal components)

Complex scenarios:
- Rapid user interactions affecting multiple components
- Error conditions bubbling up through component hierarchy
- State consistency during async operations
- Memory cleanup during component lifecycle changes

TDD approach: Start with simple parent-child communication tests, then build up to complex multi-component data flow scenarios.
```

### Step 4.2: Table Page Integration Tests

```
Create comprehensive integration tests for the complete table page functionality, testing end-to-end workflows without mocking internal components.

Requirements:
1. Test JSON parsing and coordinate extraction workflows
2. Test click-to-place marker workflow with debounced calculations
3. Test map fitting and animation integration
4. Test toast notification integration with user actions
5. Test complete user journey integration

End-to-end workflows:
- JSON paste → parsing → validation → marker creation → calculation
- Map click → marker placement → coordinate collection → auto-calculation
- Mixed workflow: JSON + clicks → coordinate merging → unified display
- Error recovery: invalid input → error display → correction → success

Integration points:
- TableContent orchestration of all child components
- Map context sharing across marker and connection components
- useTable hook integration with UI component states
- Toast notification triggering from various user actions
- Debounced calculation coordination

Testing approach:
- Render complete page components without mocking internals
- Simulate real user interactions (typing, clicking, hovering)
- Verify complete workflows from start to finish
- Test error conditions and recovery scenarios
- Validate UI state consistency throughout workflows

Performance considerations:
- Large coordinate datasets
- Rapid user interactions
- Memory usage during extended sessions
- Animation performance with multiple elements

TDD strategy: Build up complete workflows incrementally - start with simple JSON input, add click interactions, then error handling, and finally performance scenarios.
```

## Phase 5: End-to-End Testing

### Step 5.1: Core User Workflows E2E

```
Implement end-to-end tests for core user workflows using Playwright. Test complete user journeys in a real browser environment.

Requirements:
1. Test JSON paste workflow with complete validation cycle
2. Test click-to-place marker progression with auto-calculation
3. Test mixed input method usage (JSON + clicks)
4. Test error recovery scenarios with user corrections

Core workflows to test:
- Complete JSON workflow: paste valid JSON → see markers → hover interactions → view results
- Progressive click workflow: click map repeatedly → see markers appear → auto-calculation triggers
- Mixed workflow: start with JSON → add clicks → see combined results
- Error workflow: invalid JSON → see error → correct input → see success

User interaction patterns:
- Textarea focus, paste, and validation feedback
- Map clicking at various locations and zoom levels
- Marker hover interactions and tooltip display
- Connection line hover with distance/duration popups
- Help system navigation and documentation links

E2E testing approach:
- Use real browser environment with actual MapLibre rendering
- Test with real network requests (mocked Solvice API responses)
- Verify visual elements appear correctly
- Test responsive behavior at different screen sizes
- Validate accessibility features (keyboard navigation, screen readers)

Browser compatibility:
- Test across Chrome, Firefox, Safari
- Verify MapLibre rendering consistency
- Test touch interactions on mobile devices
- Validate performance across different hardware

TDD for E2E: Write failing E2E tests that describe complete user journeys, then ensure the application functionality supports those journeys.
```

### Step 5.2: Advanced E2E Scenarios

```
Implement advanced end-to-end testing scenarios covering performance, error handling, and edge cases in real browser environments.

Requirements:
1. Test large coordinate datasets for performance validation
2. Test network failure and recovery scenarios
3. Test browser compatibility across different environments
4. Test mobile responsiveness and touch interactions
5. Test accessibility navigation and screen reader compatibility

Advanced scenarios:
- Large dataset performance: 50+ coordinates with full matrix calculation
- Network resilience: API failures → error display → retry success
- Browser compatibility: consistent behavior across Chrome/Firefox/Safari
- Mobile testing: touch interactions, responsive layout, performance
- Accessibility: keyboard navigation, screen reader announcements

Performance testing:
- Large coordinate matrix calculations (measure response times)
- Memory usage during extended sessions
- Animation smoothness with many markers
- API request timing and timeout handling
- Browser rendering performance

Error scenario testing:
- Network disconnection during calculation
- API rate limiting responses
- Invalid API responses
- Browser compatibility issues
- Memory constraints on mobile devices

Implementation approach:
- Use Playwright for cross-browser testing
- Implement custom performance measuring utilities
- Create realistic test data sets of varying sizes
- Mock network conditions (slow, failing, intermittent)
- Test with accessibility tools and screen readers

Mobile-specific testing:
- Touch interaction accuracy
- Responsive layout behavior
- Performance on mobile hardware
- Battery usage considerations
- Network connectivity variations

TDD approach: Define performance benchmarks and accessibility requirements as failing tests, then optimize the application to meet those benchmarks.
```

## Phase 6: Performance and Edge Case Testing

### Step 6.1: Performance Testing

```
Implement comprehensive performance testing to ensure the table page handles large datasets and rapid interactions efficiently.

Requirements:
1. Test large matrix calculations (up to 50x50 coordinate matrices)
2. Test rapid user interactions (clicking, typing, hovering)
3. Test memory leak prevention during extended usage
4. Test animation performance with multiple visual elements
5. Test API rate limiting and optimization strategies

Performance benchmarks:
- Matrix calculation response time: <2 seconds for 25x25 matrix
- Marker rendering: <500ms for 50 markers
- Connection line rendering: <300ms for full background connections
- Memory usage: no leaks during 30-minute test sessions
- Animation smoothness: 60fps for hover effects and transitions

Testing scenarios:
- Rapid clicking to place 50 markers in sequence
- Large JSON input with maximum coordinate count
- Extended hovering sessions over multiple markers
- Rapid navigation between route and table pages
- Memory usage monitoring during various workflows

Implementation approach:
- Create performance testing utilities for timing measurements
- Use browser performance APIs for memory and timing analysis
- Implement automated benchmarks with pass/fail criteria
- Test across different hardware configurations
- Monitor for memory leaks using heap analysis

Optimization areas:
- Debouncing strategies for user interactions
- Efficient MapLibre layer management
- API request batching and caching
- Component rendering optimization
- Memory cleanup during component lifecycle

TDD for performance: Write performance tests with specific benchmarks that initially fail, then optimize the application to meet those benchmarks consistently.
```

### Step 6.2: Edge Case and Error Testing

```
Implement comprehensive edge case and error scenario testing to ensure robust application behavior under all conditions.

Requirements:
1. Test invalid JSON formats and boundary cases
2. Test coordinate boundary cases (extreme values, invalid formats)
3. Test API timeout scenarios and error recovery
4. Test network connectivity issues and offline behavior
5. Test concurrent request handling and race conditions

Edge cases to cover:
- JSON parsing: malformed JSON, empty objects, wrong structure
- Coordinates: extreme lat/lng values, invalid formats, null/undefined
- API responses: timeouts, 500 errors, malformed responses, rate limits
- Network: offline mode, slow connections, intermittent failures
- Concurrency: rapid successive requests, request cancellation

Error scenarios:
- Invalid coordinate values (outside valid lat/lng ranges)
- API key authentication failures
- Network timeouts during calculation
- Browser memory limitations
- Simultaneous requests from multiple tabs

Implementation approach:
- Create comprehensive test data for boundary cases
- Mock various error conditions systematically
- Test error message clarity and user guidance
- Verify graceful degradation when features fail
- Test recovery mechanisms and retry logic

Boundary testing:
- Coordinate values at geographic extremes
- Maximum coordinate array sizes
- Unicode characters in JSON input
- Browser storage limitations
- API request size limitations

TDD approach: Define edge case scenarios as failing tests that expose application weaknesses, then implement robust error handling and validation to handle these scenarios gracefully.
```

## Implementation Guidelines

### TDD Process for Each Step:
1. **Red**: Write failing tests that describe desired functionality
2. **Green**: Write minimal code to make tests pass
3. **Refactor**: Improve code quality while maintaining test coverage
4. **Integrate**: Ensure new functionality works with existing components

### Quality Standards:
- **Unit tests**: >95% coverage with meaningful assertions
- **Integration tests**: Cover all component interaction patterns  
- **E2E tests**: Validate complete user workflows
- **Performance tests**: Meet defined benchmarks consistently
- **Error tests**: Handle all failure scenarios gracefully

### Success Criteria:
- All tests pass consistently across environments
- Performance benchmarks met under load
- Error scenarios handled with clear user guidance
- Code coverage requirements satisfied
- Documentation updated with testing practices

Each prompt builds incrementally on previous work, ensuring no orphaned code and maintaining integration throughout the development process.