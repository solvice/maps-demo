# Table Page Testing Todo

## Phase 1: Foundation Testing Infrastructure ⏳

### Step 1.1: Test Utilities and Mocks
- [ ] Create enhanced MapLibre mock with marker/layer management
- [ ] Build API response fixtures for table scenarios
- [ ] Set up toast notification mocking
- [ ] Create test utilities for table-specific functionality

### Step 1.2: Basic Unit Test Structure
- [ ] Establish test setup files with proper mocking
- [ ] Create basic rendering tests for each component
- [ ] Add prop validation tests
- [ ] Implement error boundary tests

## Phase 2: Core Component Testing ⏳

### Step 2.1: TableDemoControls Component Tests
- [ ] Test JSON textarea input validation
- [ ] Test loading and error state display
- [ ] Test help system and documentation links
- [ ] Test calculation time display
- [ ] Test user input handling

### Step 2.2: Table API Layer Tests
- [ ] Test `lib/solvice-table-api.ts` client functions
- [ ] Test `/api/table/sync` endpoint with validation
- [ ] Test error handling and response formatting
- [ ] Test input sanitization and security

### Step 2.3: useTable Hook Tests
- [ ] Test dual API call management (baseline + traffic)
- [ ] Test traffic impact calculations
- [ ] Test debounced execution logic
- [ ] Test state management and error recovery
- [ ] Test request cancellation and race conditions

## Phase 3: Interactive Component Testing ⏳

### Step 3.1: TableMarker Component Tests
- [ ] Test MapLibre marker integration
- [ ] Test positioning and anchor accuracy
- [ ] Test hover effects and animations
- [ ] Test tooltip display and content
- [ ] Test event handler management

### Step 3.2: TableConnections Component Tests
- [ ] Test background connection line rendering
- [ ] Test traffic impact color calculations
- [ ] Test hover interaction and popup display
- [ ] Test layer management and cleanup
- [ ] Test GeoJSON data handling

## Phase 4: Integration Testing ⏳

### Step 4.1: Component Communication Tests
- [ ] Test parent-child state synchronization
- [ ] Test event propagation and handling
- [ ] Test map context integration
- [ ] Test error boundary behavior

### Step 4.2: Table Page Integration Tests
- [ ] Test JSON parsing and coordinate extraction
- [ ] Test click-to-place marker workflow
- [ ] Test debounced calculation triggers
- [ ] Test map fitting and animation
- [ ] Test toast notification integration

## Phase 5: End-to-End Testing ⏳

### Step 5.1: Core User Workflows
- [ ] Test JSON paste workflow with validation
- [ ] Test click-to-place marker progression
- [ ] Test mixed input method usage
- [ ] Test error recovery scenarios

### Step 5.2: Advanced E2E Scenarios
- [ ] Test large coordinate datasets (performance)
- [ ] Test network failure and recovery
- [ ] Test browser compatibility
- [ ] Test mobile responsiveness
- [ ] Test accessibility navigation

## Phase 6: Performance and Edge Case Testing ⏳

### Step 6.1: Performance Testing
- [ ] Test large matrix calculations
- [ ] Test rapid user interactions
- [ ] Test memory leak prevention
- [ ] Test animation performance
- [ ] Test API rate limiting

### Step 6.2: Edge Case and Error Testing
- [ ] Test invalid JSON formats
- [ ] Test coordinate boundary cases
- [ ] Test API timeout scenarios
- [ ] Test network connectivity issues
- [ ] Test concurrent request handling

## Current Status
- **Phase:** Not Started
- **Next Step:** Phase 1.1 - Create test utilities and mocks
- **Priority:** High - Foundation testing infrastructure needed first
- **Blockers:** None currently identified

## Notes
- Focus on TDD approach: write failing tests first
- Maintain >95% coverage for unit tests
- Ensure all user workflows have E2E coverage
- Document testing patterns as they're established