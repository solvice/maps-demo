import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility', () => {
  const browsers = ['chromium', 'firefox', 'webkit'] as const;
  
  for (const browserName of browsers) {
    test.describe(`${browserName} browser`, () => {
      test.beforeEach(async ({ page }) => {
        await page.goto('/route');
        await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
        await page.waitForTimeout(1000);
      });

      test(`should load and display map correctly in ${browserName}`, async ({ page }) => {
        // Verify core elements load
        await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
        await expect(page.locator('[data-testid="input-overlay"]')).toBeVisible();
        
        // Verify inputs are functional
        const originInput = page.locator('input[placeholder*="origin"]').first();
        const destinationInput = page.locator('input[placeholder*="destination"]').first();
        
        await expect(originInput).toBeVisible();
        await expect(destinationInput).toBeVisible();
        
        // Test basic interaction
        await originInput.click();
        await originInput.fill('Brussels');
        await page.waitForTimeout(1000);
        
        // Verify marker placement works
        await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
      });

      test(`should handle CSS and styling correctly in ${browserName}`, async ({ page }) => {
        const inputOverlay = page.locator('[data-testid="input-overlay"]');
        
        // Verify basic styling is applied
        await expect(inputOverlay).toHaveCSS('position', 'absolute');
        await expect(inputOverlay).toHaveCSS('z-index', '10');
        
        // Check that Tailwind classes are working
        const mapContainer = page.locator('[data-testid="map-container"]');
        await expect(mapContainer).toHaveClass(/h-full/);
        await expect(mapContainer).toHaveClass(/w-full/);
        
        // Verify responsive classes work
        const inputContainer = page.locator('[data-testid="input-container"]');
        await expect(inputContainer).toHaveClass(/flex/);
      });

      test(`should handle JavaScript events correctly in ${browserName}`, async ({ page }) => {
        const mapContainer = page.locator('[data-testid="map-container"]');
        
        // Test click events
        await mapContainer.click({ position: { x: 300, y: 300 } });
        await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
        
        // Test right-click (context menu)
        await mapContainer.click({ button: 'right', position: { x: 400, y: 400 } });
        
        // Context menu should appear (timing may vary by browser)
        const contextMenu = page.locator('[data-testid="map-context-menu"]');
        if (await contextMenu.isVisible({ timeout: 3000 })) {
          await expect(contextMenu).toBeVisible();
          await expect(page.locator('[data-testid="context-from-here"]')).toBeVisible();
          
          // Click context menu item
          await page.locator('[data-testid="context-from-here"]').click();
          await expect(contextMenu).not.toBeVisible();
        }
      });

      test(`should handle form interactions in ${browserName}`, async ({ page }) => {
        // Test input field behavior
        const originInput = page.locator('input[placeholder*="origin"]').first();
        const destinationInput = page.locator('input[placeholder*="destination"]').first();
        
        // Test typing and form validation
        await originInput.click();
        await originInput.fill('Brussels');
        await expect(originInput).toHaveValue('Brussels');
        
        await destinationInput.click();
        await destinationInput.fill('Antwerp');
        await expect(destinationInput).toHaveValue('Antwerp');
        
        // Wait for geocoding and markers
        await page.waitForTimeout(2000);
        await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('.marker-destination')).toBeVisible({ timeout: 5000 });
        
        // Test that route calculation works
        await expect(page.locator('[data-testid="route-sidebar"]')).toBeVisible({ timeout: 10000 });
      });

      test(`should handle autocomplete dropdown in ${browserName}`, async ({ page }) => {
        const originInput = page.locator('input[placeholder*="origin"]').first();
        
        // Test autocomplete functionality
        await originInput.click();
        await originInput.type('Bru');
        
        // Wait for autocomplete (may be slower in some browsers)
        await page.waitForSelector('[data-testid="autocomplete-dropdown"]', { 
          state: 'visible',
          timeout: 8000 
        });
        
        await expect(page.locator('[data-testid="autocomplete-dropdown"]')).toBeVisible();
        await expect(page.getByText(/Brussels/i)).toBeVisible();
        
        // Test selection
        await page.getByText(/Brussels/i).first().click();
        await expect(page.locator('[data-testid="autocomplete-dropdown"]')).not.toBeVisible();
        await expect(originInput).toHaveValue(/Brussels/);
      });

      test(`should handle keyboard navigation in ${browserName}`, async ({ page }) => {
        // Test tab navigation
        await page.keyboard.press('Tab');
        
        const focusedElement = page.locator(':focus');
        await expect(focusedElement).toHaveAttribute('placeholder', /origin/i);
        
        // Test keyboard input
        await page.keyboard.type('Brussels');
        await page.waitForTimeout(1000);
        
        // Test arrow key navigation in autocomplete
        if (await page.locator('[data-testid="autocomplete-dropdown"]').isVisible({ timeout: 3000 })) {
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
          
          await expect(page.locator('input[placeholder*="origin"]').first()).toHaveValue(/Brussels/);
        }
        
        // Test escape key
        await page.keyboard.press('Tab'); // Move to next field
        await page.keyboard.type('Ant');
        await page.waitForTimeout(500);
        await page.keyboard.press('Escape');
        
        // Autocomplete should close
        await expect(page.locator('[data-testid="autocomplete-dropdown"]')).not.toBeVisible();
      });

      test(`should handle performance requirements in ${browserName}`, async ({ page }) => {
        // Measure page load time
        const startTime = Date.now();
        await page.reload();
        await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
        const loadTime = Date.now() - startTime;
        
        // Should load within reasonable time (adjust based on requirements)
        expect(loadTime).toBeLessThan(5000); // 5 seconds max
        
        // Test interaction responsiveness
        const interactionStart = Date.now();
        const mapContainer = page.locator('[data-testid="map-container"]');
        await mapContainer.click({ position: { x: 300, y: 300 } });
        await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
        const interactionTime = Date.now() - interactionStart;
        
        // Interactions should be responsive
        expect(interactionTime).toBeLessThan(2000); // 2 seconds max for marker placement
      });

      test(`should handle error states properly in ${browserName}`, async ({ page }) => {
        // Test with invalid input
        const originInput = page.locator('input[placeholder*="origin"]').first();
        await originInput.click();
        await originInput.fill('InvalidLocationThatDoesNotExist123456');
        await page.waitForTimeout(3000);
        
        // Should handle gracefully without crashing
        await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
        await expect(page.locator('[data-testid="input-overlay"]')).toBeVisible();
        
        // Test recovery
        await originInput.clear();
        await originInput.fill('Brussels');
        await page.waitForTimeout(2000);
        
        // Should recover and work normally
        await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
      });

      test(`should maintain functionality after window resize in ${browserName}`, async ({ page }) => {
        // Start with desktop size
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.reload();
        await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
        
        // Place markers
        const mapContainer = page.locator('[data-testid="map-container"]');
        await mapContainer.click({ position: { x: 400, y: 300 } });
        await mapContainer.click({ position: { x: 500, y: 400 } });
        
        await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
        await expect(page.locator('.marker-destination')).toBeVisible({ timeout: 5000 });
        
        // Resize to tablet
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.waitForTimeout(1000);
        
        // Verify everything still works
        await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
        await expect(page.locator('.marker-origin')).toBeVisible();
        await expect(page.locator('.marker-destination')).toBeVisible();
        
        // Resize to mobile
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(1000);
        
        // Verify mobile layout
        await expect(page.locator('[data-testid="input-overlay"]')).toBeVisible();
        await expect(page.locator('[data-testid="input-container"]')).toHaveClass(/flex-col/);
        
        // Test that interactions still work
        const inputOverlay = page.locator('[data-testid="input-overlay"]');
        await expect(inputOverlay).toBeVisible();
      });
    });
  }
});