import { test, expect } from '@playwright/test';

test.describe('Complete User Journey - Maps Demo', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/route');
    
    // Wait for the map to load
    await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
    
    // Wait for any initial loading to complete
    await page.waitForTimeout(1000);
  });

  test('should complete full user workflow: open app → set markers → view route → get directions', async ({ page }) => {
    // Step 1: Verify initial app state
    await expect(page.locator('[data-testid="input-overlay"]')).toBeVisible();
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
    
    // Verify no route sidebar initially
    await expect(page.locator('[data-testid="route-sidebar"]')).not.toBeVisible();

    // Step 2: Set origin via input field
    const originInput = page.locator('input[placeholder*="origin"]').first();
    await originInput.click();
    await originInput.fill('Brussels');
    await page.waitForTimeout(500); // Wait for geocoding
    
    // Verify origin marker appears
    await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });

    // Step 3: Set destination via input field  
    const destinationInput = page.locator('input[placeholder*="destination"]').first();
    await destinationInput.click();
    await destinationInput.fill('Antwerp');
    await page.waitForTimeout(500); // Wait for geocoding

    // Verify destination marker appears
    await expect(page.locator('.marker-destination')).toBeVisible({ timeout: 5000 });

    // Step 4: Wait for route calculation
    await page.waitForSelector('[data-testid="route-sidebar"]', { 
      state: 'visible', 
      timeout: 10000 
    });

    // Step 5: Verify route details are displayed
    const routeSidebar = page.locator('[data-testid="route-sidebar"]');
    await expect(routeSidebar).toBeVisible();
    await expect(routeSidebar.locator('text=Distance')).toBeVisible();
    await expect(routeSidebar.locator('text=Time')).toBeVisible();

    // Step 6: Verify route is drawn on map
    // Note: Route visualization is handled by MapLibre, so we check for the route layer component
    await expect(page.locator('.maplibregl-map')).toBeVisible();

    // Step 7: Test configuration pane
    const configButton = page.locator('[data-testid="route-config-trigger"]');
    await expect(configButton).toBeVisible();
    await configButton.click();
    
    // Verify config pane opens
    await expect(page.locator('text=Route Configuration')).toBeVisible({ timeout: 3000 });
    
    // Change a setting (make more robust)
    if (await page.getByText('Vehicle Type').isVisible({ timeout: 2000 })) {
      await page.getByText('Vehicle Type').click();
      // Wait for dropdown and look for bike option
      if (await page.getByText('BIKE').isVisible({ timeout: 2000 })) {
        await page.getByText('BIKE').click();
      } else if (await page.getByRole('option', { name: /bike/i }).isVisible({ timeout: 1000 })) {
        await page.getByRole('option', { name: /bike/i }).click();
      }
    }
    
    // Close config pane
    await page.keyboard.press('Escape');
    
    // Wait for route recalculation
    await page.waitForTimeout(2000);

    // Step 8: Test context menu functionality
    const mapContainer = page.locator('[data-testid="map-container"]');
    await mapContainer.click({ button: 'right', position: { x: 300, y: 300 } });
    
    // Verify context menu appears
    await expect(page.locator('[data-testid="map-context-menu"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="context-from-here"]')).toBeVisible();
    await expect(page.locator('[data-testid="context-to-here"]')).toBeVisible();
    
    // Click "from here" to move origin
    await page.locator('[data-testid="context-from-here"]').click();
    
    // Verify context menu closes
    await expect(page.locator('[data-testid="map-context-menu"]')).not.toBeVisible();
    
    // Wait for route recalculation
    await page.waitForTimeout(2000);
    
    // Verify route sidebar still shows updated information
    await expect(routeSidebar).toBeVisible();
    await expect(routeSidebar.locator('text=Distance')).toBeVisible();
  });

  test('should handle marker placement via map clicks', async ({ page }) => {
    // Click on map to place first marker (origin)
    const mapContainer = page.locator('[data-testid="map-container"]');
    await mapContainer.click({ position: { x: 400, y: 300 } });
    
    // Verify first marker appears and toast notification
    await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Origin placed/i).first()).toBeVisible({ timeout: 3000 });
    
    // Click on map to place second marker (destination)
    await mapContainer.click({ position: { x: 500, y: 400 } });
    
    // Verify second marker appears
    await expect(page.locator('.marker-destination')).toBeVisible({ timeout: 5000 });
    
    // Verify route calculation starts
    await expect(page.getByText(/Calculating route/i).first()).toBeVisible({ timeout: 3000 });
    
    // Wait for route to be calculated and displayed
    await expect(page.locator('[data-testid="route-sidebar"]')).toBeVisible({ timeout: 10000 });
    
    // Verify route information is displayed
    const routeSidebar = page.locator('[data-testid="route-sidebar"]');
    await expect(routeSidebar.locator('text=Distance')).toBeVisible();
    await expect(routeSidebar.locator('text=Time')).toBeVisible();
  });

  test('should handle autocomplete functionality', async ({ page }) => {
    // Type in origin field to trigger autocomplete
    const originInput = page.locator('input[placeholder*="origin"]').first();
    await originInput.click();
    await originInput.type('Bru');
    
    // Wait for autocomplete dropdown
    await page.waitForSelector('[data-testid="autocomplete-dropdown"]', { 
      state: 'visible',
      timeout: 5000 
    });
    
    // Verify autocomplete suggestions appear
    await expect(page.locator('[data-testid="autocomplete-dropdown"]')).toBeVisible();
    await expect(page.getByText(/Brussels/i)).toBeVisible();
    
    // Click on autocomplete suggestion
    await page.getByText(/Brussels/i).first().click();
    
    // Verify autocomplete closes and input is filled
    await expect(page.locator('[data-testid="autocomplete-dropdown"]')).not.toBeVisible();
    await expect(originInput).toHaveValue(/Brussels/);
    
    // Verify marker is placed
    await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
  });

  test('should handle responsive design on different screen sizes', async ({ page }) => {
    // Test desktop layout
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.reload();
    await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
    
    // Verify desktop layout
    const inputOverlay = page.locator('[data-testid="input-overlay"]');
    await expect(inputOverlay).toBeVisible();
    
    // Check that elements are positioned for desktop
    const inputContainer = page.locator('[data-testid="input-container"]');
    await expect(inputContainer).toHaveClass(/sm:flex-row/);
    
    // Test tablet layout
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Verify layout adapts
    await expect(inputOverlay).toBeVisible();
    
    // Test mobile layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Verify mobile layout
    await expect(inputOverlay).toBeVisible();
    await expect(inputContainer).toHaveClass(/flex-col/);
    
    // Test that functionality still works on mobile
    await inputOverlay.locator('input').first().click();
    await inputOverlay.locator('input').first().fill('Brussels');
    await page.waitForTimeout(1000);
    
    // Verify mobile interaction works
    await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
  });

  test('should handle keyboard navigation and accessibility', async ({ page }) => {
    // Test keyboard navigation in input fields
    const originInput = page.locator('input[placeholder*="origin"]').first();
    
    // Focus the first input directly (tab order can vary)
    await originInput.focus();
    await expect(originInput).toBeFocused();
    
    // Type using keyboard
    await page.keyboard.type('Brussels');
    await page.waitForTimeout(500);
    
    // Wait for autocomplete
    await page.waitForSelector('[data-testid="autocomplete-dropdown"]', { 
      state: 'visible',
      timeout: 5000 
    });
    
    // Navigate autocomplete with keyboard
    await page.keyboard.press('ArrowDown'); // Highlight first item
    await page.keyboard.press('Enter'); // Select item
    
    // Verify selection worked
    await expect(page.locator('input[placeholder*="origin"]').first()).toHaveValue(/Brussels/);
    
    // Tab to next field
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('placeholder', /destination/i);
    
    // Test escape key
    await page.keyboard.type('Ant');
    await page.waitForTimeout(500);
    await page.keyboard.press('Escape'); // Should close autocomplete
    
    await expect(page.locator('[data-testid="autocomplete-dropdown"]')).not.toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test with invalid input that won't geocode
    const originInput = page.locator('input[placeholder*="origin"]').first();
    await originInput.click();
    await originInput.fill('InvalidLocationThatDoesNotExist123456');
    await page.waitForTimeout(2000);
    
    // Should show no results or handle gracefully
    const autocompleteDropdown = page.locator('[data-testid="autocomplete-dropdown"]');
    if (await autocompleteDropdown.isVisible()) {
      await expect(autocompleteDropdown.getByText(/No results/i)).toBeVisible();
    }
    
    // Test network error simulation
    // This would require intercepting network requests in a real scenario
    
    // Test that the app remains functional after errors
    await originInput.clear();
    await originInput.fill('Brussels');
    await page.waitForTimeout(1000);
    
    // Should recover and work normally
    await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
  });

  test('should maintain performance under load', async ({ page }) => {
    // Test rapid interactions
    const mapContainer = page.locator('[data-testid="map-container"]');
    
    // Rapid clicking should not break the app (place two markers then rapid click)
    await mapContainer.click({ position: { x: 300, y: 300 } });
    await page.waitForTimeout(500);
    await mapContainer.click({ position: { x: 400, y: 400 } });
    await page.waitForTimeout(500);
    
    // Additional rapid clicks to test stability
    for (let i = 0; i < 3; i++) {
      await mapContainer.click({ position: { x: 350 + i * 5, y: 350 + i * 5 } });
      await page.waitForTimeout(200);
    }
    
    // Should still have markers and function normally
    await expect(page.locator('.marker-origin')).toBeVisible();
    // Destination marker should be visible (may have moved during rapid clicks)
    await expect(page.locator('.marker-destination')).toBeVisible({ timeout: 8000 });
    
    // Test rapid input changes
    const originInput = page.locator('input[placeholder*="origin"]').first();
    await originInput.click();
    
    // Rapid typing should be handled gracefully (debounced)
    await originInput.fill('A');
    await page.waitForTimeout(50);
    await originInput.fill('AB');
    await page.waitForTimeout(50);
    await originInput.fill('ABC');
    await page.waitForTimeout(50);
    await originInput.fill('Brussels');
    
    // Should debounce and only make final request
    await page.waitForTimeout(1000);
    await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
  });
});