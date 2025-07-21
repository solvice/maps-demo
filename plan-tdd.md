# TDD Refactoring Plan: Top 3 Code Quality Improvements

## Overview
This plan addresses the top 3 refactoring opportunities identified in the codebase:
1. **Format Function Duplication** - Centralize formatting utilities
2. **Massive Route Control Panel** - Break down 603-line component
3. **Complex Speed Profile Data Processing** - Extract business logic

## Project Goals
- Eliminate code duplication and inconsistencies
- Improve component maintainability and testability
- Separate concerns between business logic and UI
- Maintain existing functionality throughout refactoring
- Follow TDD principles with comprehensive test coverage

## Architecture Principles
- Single Responsibility Principle
- DRY (Don't Repeat Yourself)
- Separation of Concerns
- Test-Driven Development
- Incremental, safe refactoring
- Maintain backward compatibility

---

# Detailed Step-by-Step Implementation Prompts

## Phase 1: Format Function Consolidation

### Step 1.1: Test Current Formatting Behavior

```
Create comprehensive tests for all existing formatting functions to document current behavior before refactoring.

REQUIREMENTS:
1. Test the formatDuration function in lib/format.ts covering:
   - Zero duration
   - Seconds only (< 60s)
   - Minutes only (< 60m)  
   - Hours and minutes
   - Edge cases (negative, decimal, very large numbers)

2. Test the formatDistance function in lib/format.ts covering:
   - Zero distance
   - Meters only (< 1000m)
   - Kilometers with decimals
   - Large distances
   - Edge cases (negative, decimal precision)

3. Test the duplicate functions in route-control-panel.tsx:
   - Compare behavior with lib/format.ts versions
   - Document any differences in behavior
   - Test all edge cases that might cause inconsistencies

4. Create test file: __tests__/lib/format.test.ts
5. Use Jest with describe/it blocks
6. Aim for 100% code coverage
7. Include performance benchmarks for formatting functions

The tests should pass with current implementation and serve as regression tests during refactoring.
```

### Step 1.2: Centralize and Enhance Format Utilities

```
Consolidate all formatting logic into lib/format.ts with improved edge case handling and comprehensive TypeScript types.

REQUIREMENTS:
1. Enhance lib/format.ts with:
   - Proper TypeScript types for all parameters
   - Comprehensive JSDoc documentation
   - Improved edge case handling (null, undefined, negative values)
   - Consistent rounding and precision rules
   - Input validation with helpful error messages

2. Add new utility functions as needed:
   - formatSpeed (km/h, m/s conversion)
   - formatCoordinates (lat/lng display)
   - formatPercentage (for efficiency calculations)

3. Ensure all functions handle:
   - null/undefined inputs gracefully
   - Negative numbers appropriately  
   - Very large numbers with scientific notation
   - Internationalization considerations (decimal separators)

4. Add comprehensive unit tests for enhanced functions
5. Maintain backward compatibility with existing behavior
6. Add performance optimizations where beneficial

All existing tests from Step 1.1 should continue to pass.
```

### Step 1.3: Remove Duplicates and Update Imports

```
Remove duplicate formatting functions from RouteControlPanel and update all imports across the codebase to use centralized utilities.

REQUIREMENTS:
1. Remove duplicate formatDuration and formatDistance functions from:
   - components/route-control-panel.tsx (lines 101-117)

2. Update imports in route-control-panel.tsx:
   - Add import for formatDuration, formatDistance from '../lib/format'
   - Ensure all calls to formatting functions use imported versions

3. Search codebase for any other duplicate formatting logic:
   - Check all components for inline formatting code
   - Replace with centralized utilities where found
   - Update imports consistently

4. Run all existing tests to ensure no regressions
5. Update any component tests that might be affected by import changes
6. Verify UI behavior remains exactly the same

The application should function identically but with no duplicate formatting code.
```

### Step 1.4: Validation Testing

```
Create comprehensive integration tests to ensure all formatting behavior remains consistent across the application after consolidation.

REQUIREMENTS:
1. Create integration test file: __tests__/integration/formatting-integration.test.ts

2. Test formatting in actual UI components:
   - RouteControlPanel duration displays
   - RouteControlPanel distance displays  
   - Speed profile chart tooltips
   - Any other components using formatting

3. Test edge cases in UI context:
   - Very short routes (< 1km, < 1min)
   - Very long routes (> 1000km, > 24h)
   - Route calculation errors/null values
   - Loading states

4. Visual regression testing approach:
   - Document expected formatted outputs for common scenarios
   - Test with sample route data
   - Verify consistent formatting across components

5. Performance validation:
   - Benchmark formatting performance in UI context
   - Ensure no performance regression from consolidation

All tests should pass and demonstrate identical behavior before and after refactoring.
```

## Phase 2: Route Control Panel Decomposition

### Step 2.1: Extract Route Statistics Logic

```
Create a useRouteStats custom hook to handle all route statistics calculations, moving business logic out of the RouteControlPanel component.

REQUIREMENTS:
1. Create hooks/useRouteStats.ts with comprehensive TypeScript types:
   - Input: RouteResponse, selected route index, traffic route data
   - Output: Calculated statistics (duration, distance, efficiency, etc.)

2. Extract and test these calculations from RouteControlPanel:
   - Total route duration and distance
   - Traffic vs regular route comparisons
   - Efficiency calculations and percentages
   - Route alternative statistics
   - Time savings calculations

3. Implement proper memoization:
   - Use useMemo for expensive calculations
   - Proper dependency arrays
   - Handle null/undefined route data gracefully

4. Create comprehensive tests: __tests__/hooks/useRouteStats.test.ts:
   - Test with various route configurations
   - Test with and without traffic data
   - Test edge cases (null routes, empty data)
   - Test memoization behavior
   - Performance benchmarks

5. Hook should be pure and side-effect free
6. Include proper TypeScript types for all inputs/outputs
7. Add JSDoc documentation

The hook should provide all route statistics needed by UI components without containing any UI logic.
```

### Step 2.2: Extract Clipboard Operations  

```
Create a useClipboard custom hook to handle all copy-to-clipboard functionality with proper error handling and user feedback.

REQUIREMENTS:
1. Create hooks/useClipboard.ts with TypeScript interface:
   - copyToClipboard function that accepts string content
   - Return success/error states and loading state
   - Support for different content types (text, JSON)

2. Extract clipboard logic from RouteControlPanel:
   - JSON request copying functionality
   - URL copying functionality  
   - Proper error handling for clipboard API failures
   - User feedback through toast notifications

3. Implement modern clipboard API with fallbacks:
   - Use navigator.clipboard.writeText() when available
   - Fallback to document.execCommand('copy') for older browsers
   - Handle clipboard permissions properly
   - Provide clear error messages

4. Create comprehensive tests: __tests__/hooks/useClipboard.test.ts:
   - Mock clipboard API
   - Test successful copy operations
   - Test error scenarios (permissions denied, API unavailable)
   - Test different content types
   - Test user feedback mechanisms

5. Integration with existing toast system:
   - Success messages for successful copies
   - Error messages for failures
   - Consistent messaging across different copy operations

The hook should provide robust clipboard functionality that can be reused across components.
```

### Step 2.3: Extract URL Sharing Logic

```
Create a useUrlSharing custom hook to handle shareable URL generation and management.

REQUIREMENTS:
1. Create hooks/useUrlSharing.ts with TypeScript types:
   - Generate shareable URLs for routes
   - Handle URL parameter encoding/decoding
   - Support for different sharing contexts

2. Extract URL sharing logic from RouteControlPanel:
   - Move getShareUrl function logic
   - Handle origin/destination coordinates
   - Include departure time in URLs
   - Route configuration parameters

3. Implement comprehensive URL handling:
   - Proper URL encoding for coordinates
   - Validation of generated URLs
   - Support for relative and absolute URLs
   - Handle edge cases (missing coordinates, invalid data)

4. Create tests: __tests__/hooks/useUrlSharing.test.ts:
   - Test URL generation with various route configurations
   - Test parameter encoding/decoding
   - Test edge cases (null coordinates, invalid departure times)
   - Validate generated URLs are properly formatted
   - Test URL shortening if implemented

5. Integration considerations:
   - Should work with existing route state management
   - Maintain compatibility with current URL parameter structure
   - Handle browser history and navigation properly

The hook should provide clean URL sharing functionality without coupling to specific UI components.
```

### Step 2.4: Extract JSON Generation Logic

```
Create a useJsonGeneration custom hook to handle API request JSON generation and formatting.

REQUIREMENTS:
1. Create hooks/useJsonGeneration.ts with proper TypeScript types:
   - Generate API request JSON for current route configuration
   - Handle different route types and configurations
   - Support for route alternatives and traffic routing

2. Extract JSON generation logic from RouteControlPanel:
   - Move request body generation logic
   - Handle coordinate formatting
   - Include all route configuration options
   - Proper JSON serialization

3. Implement robust JSON handling:
   - Validate input data before JSON generation
   - Handle optional parameters gracefully
   - Proper error handling for invalid configurations
   - Clean, readable JSON formatting

4. Create comprehensive tests: __tests__/hooks/useJsonGeneration.test.ts:
   - Test JSON generation with various route configurations
   - Test with different vehicle types and options
   - Test edge cases (missing coordinates, invalid options)
   - Validate generated JSON structure matches API requirements
   - Test JSON parsing and formatting

5. API compatibility:
   - Ensure generated JSON matches current API expectations
   - Include all necessary fields for route calculation
   - Handle version compatibility if needed
   - Proper handling of optional vs required fields

The hook should generate valid API request JSON for any route configuration without UI dependencies.
```

### Step 2.5: Create RouteInfoDisplay Component

```
Extract route information display logic into a focused, testable RouteInfoDisplay component.

REQUIREMENTS:
1. Create components/route-info-display.tsx:
   - Display route statistics (duration, distance, efficiency)
   - Handle multiple route alternatives
   - Show traffic comparison data when available
   - Responsive design for different screen sizes

2. Component interface:
   - Props: route data, traffic route data, selected route index
   - Use useRouteStats hook for calculations
   - Pure component focused only on display logic
   - Proper TypeScript prop definitions

3. Extract UI elements from RouteControlPanel:
   - Route duration and distance displays
   - Efficiency calculations and comparisons
   - Route alternative information
   - Traffic vs regular route comparisons
   - Loading and error states

4. Implement proper component patterns:
   - Use proper React patterns (memo, proper key usage)
   - Handle loading and error states gracefully
   - Responsive design with Tailwind CSS
   - Accessibility considerations (ARIA labels, semantic HTML)

5. Create comprehensive tests: __tests__/components/route-info-display.test.ts:
   - Test with different route configurations
   - Test loading and error states
   - Test responsive behavior
   - Test accessibility features
   - Integration tests with useRouteStats hook

The component should be reusable and focused solely on displaying route information.
```

### Step 2.6: Create VehicleSelector Component

```
Extract vehicle type selection UI into a reusable, accessible VehicleSelector component.

REQUIREMENTS:
1. Create components/vehicle-selector.tsx:
   - Support all vehicle types (CAR, BIKE, TRUCK, ELECTRIC_CAR, ELECTRIC_BIKE)
   - Accessible select interface with proper ARIA labels
   - Visual icons or indicators for each vehicle type
   - Proper change event handling

2. Component interface:
   - Props: currentVehicleType, onVehicleTypeChange, disabled state
   - Emit proper TypeScript-typed events
   - Support controlled component pattern
   - Handle loading/disabled states

3. Extract from RouteControlPanel:
   - Vehicle selection dropdown/radio buttons
   - Vehicle type validation logic
   - Visual styling and icons
   - Change event handling

4. Implement accessibility features:
   - Proper ARIA labels and descriptions
   - Keyboard navigation support
   - Screen reader compatibility
   - Focus management and visual indicators

5. Create comprehensive tests: __tests__/components/vehicle-selector.test.ts:
   - Test all vehicle type selections
   - Test change event handling
   - Test disabled states
   - Test accessibility features (keyboard navigation, ARIA)
   - Test visual styling and responsive behavior

The component should be fully accessible and reusable across different parts of the application.
```

### Step 2.7: Create ActionButtons Component

```
Extract action buttons (share, JSON, copy) into a focused ActionButtons component with proper state management.

REQUIREMENTS:
1. Create components/action-buttons.tsx:
   - Share button with URL generation
   - JSON button with API request copying
   - Copy button functionality
   - Proper loading and success states

2. Component interface:
   - Props: route data, coordinates, disabled states
   - Use useUrlSharing and useClipboard hooks
   - Handle button states (loading, success, error)
   - Support for different button configurations

3. Extract from RouteControlPanel:
   - Share button and URL generation logic
   - JSON button and API request formatting
   - Copy to clipboard functionality
   - Button styling and state management

4. Implement proper UX patterns:
   - Loading spinners during operations
   - Success feedback (checkmarks, color changes)
   - Error handling with user feedback
   - Proper button disabled states
   - Tooltip or help text for button functions

5. Create comprehensive tests: __tests__/components/action-buttons.test.ts:
   - Test all button click handlers
   - Test integration with useUrlSharing and useClipboard hooks
   - Test loading and success states
   - Test error scenarios and user feedback
   - Test button accessibility and keyboard navigation

The component should provide clear user feedback and handle all action button functionality independently.
```

### Step 2.8: Create HelpPopover Component

```
Extract help documentation into a standalone, accessible HelpPopover component.

REQUIREMENTS:
1. Create components/help-popover.tsx:
   - Comprehensive API documentation content
   - URL parameter explanations
   - Usage examples and tips
   - Proper popover positioning and responsive behavior

2. Component interface:
   - Trigger element (help button/icon)
   - Popover content with proper positioning
   - Keyboard navigation and focus management
   - Close on outside click or escape key

3. Extract from RouteControlPanel:
   - All help content and documentation
   - Popover positioning logic
   - Open/close state management
   - Help content formatting and styling

4. Implement accessibility features:
   - Proper ARIA attributes for popover
   - Focus trap within popover when open
   - Keyboard navigation (Tab, Escape)
   - Screen reader announcements
   - Proper heading hierarchy

5. Create comprehensive tests: __tests__/components/help-popover.test.ts:
   - Test popover open/close functionality
   - Test keyboard navigation and focus management
   - Test accessibility features
   - Test responsive positioning
   - Test content rendering and formatting

The component should be fully accessible and provide comprehensive help without cluttering the main UI.
```

### Step 2.9: Create AutocompleteInputs Component  

```
Extract origin and destination input fields with autocomplete into a focused component.

REQUIREMENTS:
1. Create components/autocomplete-inputs.tsx:
   - Origin and destination input fields
   - Autocomplete functionality integration
   - Proper form validation and error handling
   - Loading states during geocoding

2. Component interface:
   - Props: origin/destination values, change handlers, loading states
   - Integration with existing geocoding functionality
   - Support for both text input and selection events
   - Proper TypeScript typing for address results

3. Extract from RouteControlPanel:
   - Input field components and styling
   - Autocomplete integration logic
   - Change event handling for both inputs
   - Loading and error state management

4. Implement proper form patterns:
   - Accessible form labels and ARIA attributes
   - Input validation with helpful error messages
   - Debounced input for performance
   - Proper tab order and keyboard navigation

5. Create comprehensive tests: __tests__/components/autocomplete-inputs.test.ts:
   - Test input change handling
   - Test autocomplete integration
   - Test form validation and error states
   - Test accessibility features
   - Test loading state handling

The component should handle all address input functionality while maintaining integration with existing geocoding services.
```

### Step 2.10: Refactor Main RouteControlPanel

```
Refactor the main RouteControlPanel component to compose extracted components and hooks, reducing it to orchestration logic only.

REQUIREMENTS:
1. Update components/route-control-panel.tsx:
   - Reduce from 603 lines to < 200 lines
   - Use extracted components and hooks
   - Focus on component composition and data flow
   - Maintain existing prop interface for backward compatibility

2. Component composition:
   - Import and use AutocompleteInputs, VehicleSelector, RouteInfoDisplay, ActionButtons, HelpPopover
   - Pass appropriate props to each component
   - Handle component communication through callbacks
   - Maintain consistent styling and layout

3. Hook integration:
   - Use useRouteStats, useClipboard, useUrlSharing, useJsonGeneration hooks
   - Pass hook results to appropriate components
   - Handle loading and error states from hooks
   - Maintain performance with proper memoization

4. Preserve existing functionality:
   - All existing props should work unchanged
   - All existing behavior should be preserved
   - No breaking changes to component interface
   - Maintain styling and responsive behavior

5. Create integration tests: __tests__/components/route-control-panel-refactored.test.ts:
   - Test component composition works correctly
   - Test data flow between components
   - Test that all original functionality is preserved
   - Test error handling and edge cases
   - Compare behavior with original implementation

The refactored component should be much smaller, more maintainable, and easier to test while preserving all existing functionality.
```

### Step 2.11: Integration Testing

```
Create comprehensive integration tests to ensure the refactored RouteControlPanel structure works correctly and maintains all original functionality.

REQUIREMENTS:
1. Create comprehensive test suite: __tests__/integration/route-control-panel-integration.test.ts:
   - Test complete user workflows (address input -> route calculation -> sharing)
   - Test component interactions and data flow
   - Test error handling across component boundaries
   - Test loading states and user feedback

2. Regression testing:
   - Compare refactored behavior with original implementation
   - Test all existing prop combinations
   - Test edge cases and error scenarios
   - Validate no functionality has been lost

3. Performance testing:
   - Benchmark rendering performance before/after refactoring
   - Test memory usage and component re-rendering
   - Validate memoization is working correctly
   - Ensure no performance regressions

4. User experience testing:
   - Test complete user workflows end-to-end
   - Validate all user interactions work correctly
   - Test responsive behavior across screen sizes
   - Test accessibility features across all components

5. Cross-component communication:
   - Test data flow between extracted components
   - Test event handling and callback propagation
   - Test state synchronization across components
   - Test error boundary behavior

All tests should pass and demonstrate that the refactored component structure maintains full compatibility with the original implementation.
```

## Phase 3: Speed Profile Data Processing Extraction

### Step 3.1: Extract Route Data Processing

```
Create speed-profile-utils.ts utility module to handle core route data extraction and transformation logic.

REQUIREMENTS:
1. Create lib/speed-profile-utils.ts:
   - Extract extractSpeedData function from components/speed-profile.tsx
   - Add proper TypeScript interfaces for route data structures
   - Handle all route data formats (step-level, annotation arrays, leg-level fallbacks)
   - Include comprehensive error handling and validation

2. Core functionality to extract:
   - Route speed calculation logic (distance/duration -> km/h)
   - Cumulative distance calculation
   - Step index tracking
   - Geometry data preservation
   - Location name extraction (step.name, step.ref, step.destinations)

3. Utility functions to create:
   - extractSpeedDataFromRoute(route, selectedRouteIndex, routeType)
   - validateRouteData(route) - input validation
   - calculateSpeedFromStep(step) - speed calculation logic
   - processRouteLeg(leg) - individual leg processing

4. Error handling and edge cases:
   - Handle missing or malformed route data
   - Graceful fallbacks for missing step data
   - Validation of numeric calculations
   - Proper handling of zero or negative durations

5. Create comprehensive tests: __tests__/lib/speed-profile-utils.test.ts:
   - Test with various route data structures
   - Test speed calculations with known inputs
   - Test error handling and edge cases
   - Test data validation functions
   - Performance benchmarks for large route datasets

All extracted functions should be pure, side-effect free, and thoroughly tested.
```

### Step 3.2: Extract Interpolation Logic

```
Create route-interpolation-utils.ts module for mathematical interpolation and data resampling functions.

REQUIREMENTS:
1. Create lib/route-interpolation-utils.ts:
   - Extract interpolateSpeedAtDistance function
   - Extract data resampling and distance grid generation
   - Add mathematical validation and error handling
   - Support different interpolation methods

2. Core mathematical functions:
   - interpolateSpeedAtDistance(speedData, targetDistance)
   - createDistanceGrid(maxDistance, sampleInterval)
   - findClosestDataPoint(data, targetDistance)
   - resampleRouteData(originalData, distanceGrid)

3. Advanced interpolation support:
   - Linear interpolation (current implementation)
   - Option for cubic spline interpolation
   - Proper boundary condition handling
   - Performance optimization for large datasets

4. Data validation and error handling:
   - Validate input data structure and types
   - Handle edge cases (empty data, single point, negative distances)
   - Proper null/undefined handling
   - Mathematical validation (no division by zero, etc.)

5. Create comprehensive tests: __tests__/lib/route-interpolation-utils.test.ts:
   - Test interpolation accuracy with known datasets
   - Test edge cases and boundary conditions
   - Test performance with large datasets
   - Test different interpolation methods
   - Validate mathematical correctness

Functions should provide accurate, performant interpolation suitable for visualization and analysis.
```

### Step 3.3: Extract Geometry Utilities

```
Create geometry-utils.ts module for coordinate and geometry operations used in speed profile functionality.

REQUIREMENTS:
1. Create lib/geometry-utils.ts:
   - Extract findClosestGeometry function
   - Add coordinate validation and transformation utilities
   - Handle polyline encoding/decoding if needed
   - Support for different coordinate systems

2. Geometry functions to implement:
   - findClosestGeometry(speedData, targetDistance)
   - validateCoordinates(coords) - coordinate validation
   - calculateDistance(coord1, coord2) - if needed for validation
   - parsePolylineGeometry(encoded) - if polyline decoding needed

3. Coordinate system support:
   - Handle WGS84 coordinates (standard GPS)
   - Proper longitude/latitude validation
   - Handle coordinate precision and rounding
   - Support for different coordinate formats

4. Performance optimization:
   - Efficient closest point algorithms
   - Proper data structure usage for large coordinate sets
   - Memoization where appropriate
   - Avoid unnecessary coordinate transformations

5. Create comprehensive tests: __tests__/lib/geometry-utils.test.ts:
   - Test coordinate validation with valid/invalid inputs
   - Test closest geometry finding with various datasets
   - Test performance with large coordinate arrays
   - Test edge cases (duplicate coordinates, extreme values)
   - Validate mathematical accuracy

Utilities should provide robust, performant geometry operations for mapping and visualization needs.
```

### Step 3.4: Create useSpeedData Hook

```
Create useSpeedData custom hook for speed data processing with memoization and performance optimization.

REQUIREMENTS:
1. Create hooks/useSpeedData.ts:
   - Use extracted speed-profile-utils functions
   - Implement proper memoization with useMemo
   - Handle loading states and error conditions
   - Support for both regular and traffic route data

2. Hook interface and functionality:
   - Input: route, trafficRoute, selectedRouteIndex
   - Output: processed speed data, loading states, error handling
   - Memoized calculations based on route data changes
   - Separate processing for regular vs traffic routes

3. Performance optimization:
   - Use useMemo for expensive data processing
   - Proper dependency arrays to prevent unnecessary recalculations
   - Handle large route datasets efficiently
   - Debounce rapid route changes if needed

4. Error handling and edge cases:
   - Handle null/undefined route data gracefully
   - Provide meaningful error messages
   - Fallback behavior for malformed data
   - Loading state management

5. Create comprehensive tests: __tests__/hooks/useSpeedData.test.ts:
   - Test hook with various route configurations
   - Test memoization behavior and dependency tracking
   - Test error handling and edge cases
   - Test performance with large datasets
   - Test integration with speed-profile-utils

The hook should provide clean, performant access to processed speed data for UI components.
```

### Step 3.5: Create useRouteInterpolation Hook

```
Create useRouteInterpolation custom hook for route data interpolation and resampling.

REQUIREMENTS:
1. Create hooks/useRouteInterpolation.ts:
   - Use route-interpolation-utils functions
   - Handle interpolation of multiple route datasets
   - Implement proper memoization for performance
   - Support different resampling strategies

2. Hook functionality:
   - Input: speed data arrays, interpolation parameters
   - Output: resampled/interpolated data for visualization
   - Handle synchronization of multiple data sources
   - Configurable sampling intervals and methods

3. Data synchronization:
   - Align regular and traffic route data on common distance grid
   - Handle datasets with different lengths or resolutions
   - Preserve important data points during resampling
   - Maintain data integrity during interpolation

4. Performance considerations:
   - Memoize expensive interpolation calculations
   - Efficient algorithms for large datasets
   - Lazy evaluation where possible
   - Proper cleanup of intermediate calculations

5. Create comprehensive tests: __tests__/hooks/useRouteInterpolation.test.ts:
   - Test interpolation accuracy and consistency
   - Test performance with various dataset sizes
   - Test memoization and dependency tracking
   - Test data synchronization across multiple routes
   - Test integration with route-interpolation-utils

The hook should provide efficient, accurate route data interpolation for chart visualization.
```

### Step 3.6: Create useGeometryMapping Hook

```
Create useGeometryMapping custom hook for geometry coordinate mapping and closest point finding.

REQUIREMENTS:
1. Create hooks/useGeometryMapping.ts:
   - Use geometry-utils functions
   - Handle geometry data mapping for chart interactions
   - Support for hover/selection functionality
   - Efficient lookup for large geometry datasets

2. Hook functionality:
   - Input: geometry data, chart interaction coordinates
   - Output: mapped geometry for map highlighting
   - Handle coordinate transformations if needed
   - Support for different geometry formats

3. Chart interaction support:
   - Map chart coordinates to route geometry
   - Find closest geometry segments for hover effects
   - Handle coordinate precision and rounding
   - Support for different chart coordinate systems

4. Performance optimization:
   - Memoize geometry lookups
   - Efficient spatial indexing if needed
   - Proper handling of large geometry datasets
   - Avoid unnecessary coordinate calculations

5. Create comprehensive tests: __tests__/hooks/useGeometryMapping.test.ts:
   - Test coordinate mapping accuracy
   - Test closest point finding with various geometries
   - Test performance with large datasets
   - Test chart interaction scenarios
   - Test integration with geometry-utils

The hook should provide efficient geometry mapping for interactive chart features.
```

### Step 3.7: Refactor Speed Profile Component

```
Refactor the SpeedProfile component to use extracted utilities and hooks, focusing only on UI rendering.

REQUIREMENTS:
1. Update components/speed-profile.tsx:
   - Remove extractSpeedData function and related logic
   - Use useSpeedData, useRouteInterpolation, useGeometryMapping hooks
   - Focus component on UI rendering and chart configuration
   - Maintain existing prop interface and behavior

2. Component refactoring:
   - Replace inline data processing with hook usage
   - Simplify component logic to focus on rendering
   - Remove mathematical calculations from component
   - Maintain chart configuration and styling

3. Hook integration:
   - Use useSpeedData for route data processing
   - Use useRouteInterpolation for data resampling
   - Use useGeometryMapping for chart interactions
   - Handle loading and error states from hooks

4. Preserve functionality:
   - All existing props should work unchanged
   - Chart rendering and interactions preserved
   - Tooltip functionality maintained
   - Hover effects and geometry highlighting preserved

5. Create comprehensive tests: __tests__/components/speed-profile-refactored.test.ts:
   - Test component rendering with extracted hooks
   - Test chart interactions and tooltip functionality
   - Test loading and error state handling
   - Compare behavior with original implementation
   - Test performance improvements

The refactored component should be significantly smaller and focused only on UI concerns.
```

### Step 3.8: Performance Optimization

```
Add performance optimizations to the refactored speed profile system with benchmarking and monitoring.

REQUIREMENTS:
1. Performance analysis and optimization:
   - Benchmark original vs refactored performance
   - Identify and optimize performance bottlenecks
   - Add proper memoization where needed
   - Optimize re-rendering patterns

2. Hook optimization:
   - Review and optimize useMemo dependencies
   - Add useCallback for stable function references
   - Implement proper cleanup in useEffect if needed
   - Optimize data flow between hooks

3. Data processing optimization:
   - Optimize mathematical calculations in utilities
   - Use efficient data structures for large datasets
   - Implement lazy evaluation where beneficial
   - Add caching for expensive operations

4. Component optimization:
   - Use React.memo for components where appropriate
   - Optimize chart rendering performance
   - Reduce unnecessary prop drilling
   - Optimize tooltip rendering

5. Create performance tests: __tests__/performance/speed-profile-performance.test.ts:
   - Benchmark data processing functions
   - Test memory usage and cleanup
   - Test rendering performance with large datasets
   - Compare before/after refactoring performance
   - Set performance regression guards

Performance improvements should be measurable and maintain all existing functionality.
```

### Step 3.9: Integration Testing

```
Create comprehensive integration tests for the complete refactored speed profile system.

REQUIREMENTS:
1. End-to-end integration testing: __tests__/integration/speed-profile-integration.test.ts:
   - Test complete data flow from route input to chart rendering
   - Test interactions between all extracted utilities and hooks
   - Test chart hover functionality and geometry highlighting
   - Test error propagation and handling across the system

2. Regression testing:
   - Compare refactored system behavior with original
   - Test all speed profile features and interactions
   - Validate mathematical accuracy is preserved
   - Ensure no functionality has been lost

3. Performance integration testing:
   - Test system performance with realistic datasets
   - Validate memory usage and cleanup
   - Test with multiple concurrent route calculations
   - Ensure performance improvements are realized

4. Cross-component testing:
   - Test speed profile integration with map components
   - Test tooltip and geometry highlighting interactions
   - Test route data updates and re-processing
   - Test error boundary behavior

5. User experience testing:
   - Test complete user workflows with speed profiles
   - Test responsive behavior and chart interactions
   - Test accessibility features
   - Validate smooth performance under normal usage

All integration tests should pass and demonstrate that the refactored system provides identical functionality with improved maintainability and performance.
```

---

# Final Validation and Deployment

## Complete System Integration Test

```
Perform final validation that all three refactoring phases work together correctly and the complete system maintains full functionality.

REQUIREMENTS:
1. System-wide integration testing:
   - Test complete user workflows from route input to sharing
   - Validate all refactored components work together
   - Test error handling and edge cases across the system
   - Performance testing of the complete refactored system

2. Regression testing:
   - Compare complete system behavior with original codebase
   - Validate no functionality has been lost
   - Test all existing features and user workflows
   - Verify UI/UX remains identical

3. Code quality validation:
   - Verify all success criteria have been met
   - Check test coverage meets requirements
   - Validate TypeScript compliance
   - Code review and quality checks

4. Performance validation:
   - Benchmark complete system performance
   - Memory usage analysis
   - Validate performance improvements
   - Check for any performance regressions

5. Deployment readiness:
   - All tests passing
   - Documentation updated
   - Performance metrics validated
   - Rollback plan prepared

The system should be fully functional, better maintainable, and ready for production deployment.
```

## Success Metrics

### Phase 1 Success Criteria
- [ ] Zero format function duplication
- [ ] 100% test coverage for formatting utilities
- [ ] No regression in formatting behavior
- [ ] All components use centralized formatting

### Phase 2 Success Criteria
- [ ] RouteControlPanel reduced to < 200 lines
- [ ] 5+ extracted components with single responsibilities
- [ ] 4+ custom hooks for business logic
- [ ] 90%+ test coverage for all new components/hooks
- [ ] No regression in existing functionality

### Phase 3 Success Criteria
- [ ] Speed profile data processing extracted to utilities
- [ ] Performance improvement through memoization
- [ ] Mathematical logic fully tested
- [ ] Component reduced to UI rendering only
- [ ] No regression in speed profile functionality

## Timeline
- **Phase 1**: 2 days (Format consolidation)
- **Phase 2**: 5 days (RouteControlPanel decomposition)
- **Phase 3**: 3 days (Speed profile extraction)
- **Total**: 10 days with buffer for testing and integration