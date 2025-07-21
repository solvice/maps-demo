# Traffic Comparison Feature - TDD Implementation Plan

## Overview

Implement a traffic comparison feature that makes two routing requests when traffic control is enabled:
1. Regular request (current behavior with OSM engine)
2. Traffic request (same parameters but with TOMTOM engine and departureTime)

The feature will display both durations and highlight the traffic-induced time difference in the results pane.

## Current Architecture Analysis

### Key Components
- `components/route-control-panel.tsx`: Main UI with route results display (lines 219-249)
- `components/map-controls.tsx`: Contains traffic control button (Car icon, lines 76-96)
- `hooks/use-route.ts`: Route calculation logic and state management
- `lib/solvice-api.ts`: API client for route requests
- `app/api/route/route.ts`: Server-side route handler

### Current Traffic Control
- Traffic button toggles between OSM and TOMTOM routing engines
- When enabled, sets `routingEngine: 'TOMTOM'` and `departureTime: new Date().toISOString()`
- Currently makes only one request per route calculation

### Route Display
- Shows duration and distance for each route alternative
- Duration formatted as "23 min" or "1h 15m" via `formatDuration()` function
- Results displayed in route info section with hover highlighting

## Implementation Strategy

### Phase 1: Foundation - Traffic Utility Functions
Create utility functions for traffic comparison logic and calculations.

### Phase 2: State Management Extension  
Extend the routing hook to support dual requests and traffic comparison state.

### Phase 3: UI Enhancement
Update the route display to show traffic comparison with proper highlighting.

### Phase 4: Integration
Wire traffic comparison to existing controls and handle edge cases.

### Phase 5: Testing & Polish
Add comprehensive tests and handle error scenarios.

---

## TDD Implementation Prompts

### Prompt 1: Create Traffic Comparison Utilities

```
Create utility functions for traffic comparison in a new file `lib/route-utils.ts`.

Background: The existing codebase has a routing system that can switch between OSM and TOMTOM engines. We need utilities to support comparing routes from both engines to show traffic impact.

Requirements:
1. Function `calculateTrafficDifference(regularRoute, trafficRoute)` that returns duration difference in seconds
2. Function `formatTrafficDifference(seconds)` that formats like "+3 min", "+1h 15m", or "No delay" 
3. Function `shouldEnableTrafficComparison(routeConfig)` that returns true when traffic control is enabled
4. Function `createTrafficRouteConfig(baseConfig)` that creates a TOMTOM version of route config
5. Proper TypeScript types for all functions
6. Handle edge cases: undefined routes, same duration, negative differences

Follow TDD approach:
1. Write comprehensive tests first in `src/test/route-utils.test.ts`
2. Test all edge cases and formatting scenarios
3. Import and use existing types from `lib/solvice-api.ts` and `components/route-control-panel.tsx`
4. Implement the utilities to pass all tests

Use the existing `RouteResponse` and `RouteConfig` types from the codebase.
```

### Prompt 2: Extend Route State for Traffic Comparison

```
Extend the `useRoute` hook in `hooks/use-route.ts` to support dual route requests for traffic comparison.

Background: The current hook manages a single route request. We need to extend it to optionally make two concurrent requests when traffic comparison is enabled, while maintaining backward compatibility.

Requirements:
1. Add `trafficRoute: RouteResponse | null` to state interface
2. Add `trafficCalculationTime: number | null` to track traffic request timing
3. Add `trafficLoading: boolean` to track traffic request state separately 
4. Modify `calculateRoute` function to accept `compareTraffic?: boolean` parameter
5. When `compareTraffic` is true, make two concurrent requests:
   - Regular request with original parameters
   - Traffic request with `routingEngine: 'TOMTOM'` and `departureTime: new Date().toISOString()`
6. Update both regular and traffic state appropriately
7. Preserve existing behavior when `compareTraffic` is false or undefined
8. Handle request cancellation for both requests when new ones are made
9. Use existing debouncing logic for both requests

Follow TDD approach:
1. Write tests for the extended hook functionality first in `src/test/use-route.test.tsx`
2. Test dual request scenarios, individual failures, and state updates
3. Ensure existing functionality remains unchanged (backward compatibility)
4. Mock API calls using existing patterns from current tests
5. Test debouncing and request cancellation for dual requests

Import `CreateRouteOptions` from `lib/solvice-api.ts` and use existing patterns.
```

### Prompt 3: Update Route Display for Traffic Comparison

```
Modify the route display in `RouteControlPanel` component to show traffic comparison when available.

Background: The current route display (lines 219-249 in `components/route-control-panel.tsx`) shows basic route information. We need to enhance it to display traffic comparison when both regular and traffic routes are available.

Requirements:
1. When both `route` and `trafficRoute` are available, show comparison view
2. Display regular duration, traffic duration, and difference with highlighting
3. Use green styling for "No delay" or traffic savings, yellow/red for delays
4. Format difference using utility functions from Prompt 1
5. Handle loading states: show partial results when one request completes first
6. Show separate loading indicators for regular and traffic requests  
7. Maintain existing single-route display when no traffic comparison
8. Add proper `data-testid` attributes for testing
9. Use existing `formatDuration` function and UI patterns

UI Requirements:
- Regular route: "Duration: 23 min" 
- Traffic route: "With traffic: 26 min (+3 min)" with colored highlighting
- Loading states: "Calculating..." and "Checking traffic..." 
- Use existing Lucide icons and shadcn/ui components

Follow TDD approach:
1. Write component tests first in `src/test/route-control-panel.test.tsx`
2. Test various scenarios: no traffic, traffic delay, traffic savings, loading states
3. Test accessibility and proper ARIA labels
4. Use existing testing patterns from the codebase
5. Implement UI changes to pass all tests

Use the existing `RouteControlPanelProps` interface and add optional traffic-related props.
```

### Prompt 4: Create Traffic Comparison Integration Logic

```
Create the integration logic to wire traffic comparison to the existing traffic control and route calculation.

Background: The traffic control button exists in `components/map-controls.tsx` and the main routing logic is in the page component. We need to connect these to enable traffic comparison when the traffic button is toggled.

Requirements:
1. Detect when traffic comparison should be enabled based on:
   - Traffic control button is enabled (`routingEngine === 'TOMTOM'`)
   - Both origin and destination coordinates are set
2. Pass `compareTraffic` flag to `calculateRoute` hook when conditions are met
3. Handle transition when traffic control is toggled on/off
4. Update route calculation triggers to use traffic comparison appropriately
5. Ensure proper cleanup when switching between modes
6. Maintain existing route calculation behavior for other interactions

Integration points:
- `app/page.tsx`: Main component that coordinates traffic control and routing
- `components/map-controls.tsx`: Traffic button that sets routing engine
- Hook integration: Connect traffic state to `useRoute` hook calls

Follow TDD approach:
1. Write integration tests first (can be added to existing test files)
2. Test traffic toggle interaction with route calculation
3. Test mode switching with existing routes
4. Test edge cases: rapid toggling, incomplete routes
5. Implement integration logic to pass all tests

Use existing patterns for prop drilling and state management in the main page component.
```

### Prompt 5: Handle Error States and Edge Cases

```
Implement comprehensive error handling for traffic comparison scenarios.

Background: The current system has basic error handling for single route requests. We need to extend this to handle partial failures in dual request scenarios while maintaining good user experience.

Requirements:
1. Handle scenario: regular request succeeds, traffic request fails
2. Handle scenario: traffic request succeeds, regular request fails  
3. Handle scenario: both requests fail
4. Display appropriate error messages for each scenario
5. Allow users to retry failed requests
6. Ensure partial results are still useful (show what succeeded)
7. Add specific error types for traffic comparison failures
8. Handle network timeouts and rate limiting for dual requests
9. Proper cleanup when switching modes during errors

Error UX Requirements:
- "Route calculated (traffic info unavailable)" for partial success
- "Could not calculate route" for complete failure
- Clear retry mechanisms
- Toast notifications for errors using existing Sonner setup

Follow TDD approach:
1. Write error scenario tests first
2. Test all combinations of success/failure for dual requests
3. Test error message display and user interactions
4. Test error recovery and retry mechanisms
5. Implement error handling to pass all tests

Extend existing error handling patterns and use the current `error` state management approach.
```

### Prompt 6: Performance Optimization and Debouncing

```
Optimize the traffic comparison feature for performance and user experience with proper debouncing and request management.

Background: The current system has debouncing for single requests. We need to ensure dual requests are properly debounced, cancelled, and optimized for good performance.

Requirements:
1. Ensure dual requests share the same debounce timing (don't double the delay)
2. Cancel both previous requests when new ones are initiated
3. Handle race conditions between regular and traffic requests
4. Optimize for mobile performance and slower connections
5. Add request prioritization if needed (regular route first, then traffic)
6. Ensure proper request cleanup on component unmount
7. Add loading state management for dual requests
8. Consider request caching for traffic comparisons with same parameters

Performance Requirements:
- Total debounce delay should remain 300ms (not 600ms for dual requests)
- Concurrent requests should not block each other
- Proper memory cleanup and request cancellation
- Smooth UI updates during dual loading states

Follow TDD approach:
1. Write performance and timing tests first
2. Test debouncing behavior with rapid changes
3. Test request cancellation and cleanup scenarios
4. Test race condition handling
5. Implement optimizations to pass all tests

Extend the existing debouncing patterns in `useRoute` hook and maintain the current performance characteristics.
```

### Prompt 7: Final Integration and E2E Testing

```
Complete the integration and add comprehensive end-to-end tests for the traffic comparison feature.

Background: All individual components have been implemented. Now we need to ensure they work together seamlessly and add E2E tests for the complete user workflow.

Requirements:
1. Verify all components integrate correctly end-to-end
2. Add E2E tests for complete traffic comparison workflow
3. Test user journey: place markers → enable traffic → see comparison
4. Test edge cases: toggling traffic on/off, route changes, errors
5. Verify performance requirements are met
6. Test mobile responsiveness for traffic comparison UI
7. Ensure accessibility compliance for new UI elements
8. Add proper documentation for the feature

E2E Test Scenarios:
- User places route, enables traffic, sees comparison
- User toggles traffic on/off multiple times
- User changes route while traffic comparison is enabled
- Network errors during traffic comparison
- Mobile device traffic comparison workflow

Follow TDD approach:
1. Write E2E test scenarios first in `tests/e2e/`
2. Test complete user workflows with traffic comparison
3. Test error scenarios and recovery in E2E context
4. Test cross-browser compatibility for new features
5. Implement any remaining integration fixes to pass tests

Add tests to existing E2E test suite and follow current testing patterns. Focus on real user workflows and realistic scenarios.
```

## Implementation Guidelines

### Code Quality Standards
- Follow existing TypeScript patterns and interfaces
- Maintain consistent error handling approaches  
- Use existing UI components and styling (shadcn/ui, Lucide icons)
- Preserve backward compatibility with all existing functionality
- Add comprehensive test coverage for all new code

### Testing Requirements
- Unit tests for all new utility functions
- Component tests for UI changes and loading states
- Hook tests for extended route management
- Integration tests for traffic control interaction
- E2E tests for complete user workflows
- Performance tests for dual request scenarios

### Performance Considerations
- Maintain existing debounce timing (300ms total, not per request)
- Ensure efficient request cancellation and cleanup
- Optimize for mobile devices and slower connections
- Consider request caching for repeated traffic comparisons
- Maintain responsive UI during all loading states

### Error Handling Philosophy
- Graceful degradation when one request fails (show partial results)
- Clear, actionable error messages for users
- Proper cleanup of state on all error conditions
- Recovery mechanisms that don't break existing workflows
- Toast notifications following existing Sonner patterns

### UI/UX Requirements
- Traffic difference highlighting: green for no delay/savings, yellow/red for delays
- Format: "With traffic: 26 min (+3 min)" with appropriate coloring
- Loading states: "Calculating..." and "Checking traffic..." when appropriate
- Maintain existing route display when traffic comparison is disabled
- Ensure accessibility and proper ARIA labels for new elements