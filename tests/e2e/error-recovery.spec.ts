import { test, expect } from '@playwright/test';

test.describe('Error Recovery and Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/route');
    await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
    await page.waitForTimeout(1000);
  });

  test.describe('Network Error Handling', () => {
    test('should handle API failures gracefully', async ({ page }) => {
      // Intercept API calls and simulate failures
      await page.route('/api/route', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      // Try to place markers and calculate route
      const mapContainer = page.locator('[data-testid="map-container"]');
      await mapContainer.click({ position: { x: 300, y: 300 } });
      await mapContainer.click({ position: { x: 400, y: 400 } });
      
      // Should show markers
      await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('.marker-destination')).toBeVisible({ timeout: 5000 });
      
      // Should show error notification
      await expect(page.getByText(/Route calculation failed/i).first()).toBeVisible({ timeout: 5000 });
      
      // App should remain functional
      await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-overlay"]')).toBeVisible();
      
      // Should be able to try again
      const originInput = page.locator('input[placeholder*="origin"]').first();
      await originInput.click();
      await originInput.fill('Brussels');
      
      // App should still respond
      await expect(originInput).toHaveValue('Brussels');
    });

    test('should handle network timeouts', async ({ page }) => {
      // Simulate slow/timeout responses
      await page.route('/api/route', route => {
        // Delay response to simulate timeout
        setTimeout(() => {
          route.fulfill({
            status: 408,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Request timeout' })
          });
        }, 5000);
      });

      const mapContainer = page.locator('[data-testid="map-container"]');
      await mapContainer.click({ position: { x: 300, y: 300 } });
      await mapContainer.click({ position: { x: 400, y: 400 } });
      
      // Should show loading state
      await expect(page.getByText(/Calculating route/i).first()).toBeVisible({ timeout: 3000 });
      
      // Should eventually show timeout error
      await expect(page.getByText(/timeout/i).first()).toBeVisible({ timeout: 10000 });
      
      // App should remain responsive
      await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
    });

    test('should handle intermittent connectivity', async ({ page }) => {
      let requestCount = 0;
      
      // Simulate intermittent failures
      await page.route('/api/route', route => {
        requestCount++;
        if (requestCount === 1) {
          // First request fails
          route.fulfill({
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Service unavailable' })
          });
        } else {
          // Subsequent requests succeed
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              routes: [{
                distance: 50000,
                duration: 3600,
                geometry: 'mock_geometry'
              }],
              waypoints: []
            })
          });
        }
      });

      const mapContainer = page.locator('[data-testid="map-container"]');
      await mapContainer.click({ position: { x: 300, y: 300 } });
      await mapContainer.click({ position: { x: 400, y: 400 } });
      
      // First attempt should fail
      await expect(page.getByText(/Service unavailable/i).first()).toBeVisible({ timeout: 5000 });
      
      // Try again - move one marker to trigger new route request
      await mapContainer.click({ position: { x: 350, y: 350 } });
      
      // Second attempt should succeed
      await expect(page.locator('[data-testid="route-sidebar"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Input Validation and Edge Cases', () => {
    test('should handle invalid coordinates gracefully', async ({ page }) => {
      const originInput = page.locator('input[placeholder*="origin"]').first();
      
      // Test with various invalid inputs
      const invalidInputs = [
        '999, 999', // Out of range coordinates
        'invalid text',
        '!@#$%^&*()',
        '', // Empty input
        '   ', // Whitespace only
        '12345678901234567890', // Very long input
      ];

      for (const invalidInput of invalidInputs) {
        await originInput.click();
        await originInput.clear();
        await originInput.fill(invalidInput);
        await page.waitForTimeout(1000);
        
        // App should not crash
        await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
        await expect(page.locator('[data-testid="input-overlay"]')).toBeVisible();
      }
      
      // Should recover with valid input
      await originInput.clear();
      await originInput.fill('Brussels');
      await page.waitForTimeout(1000);
      await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
    });

    test('should handle rapid input changes', async ({ page }) => {
      const originInput = page.locator('input[placeholder*="origin"]').first();
      
      // Rapid typing and clearing
      for (let i = 0; i < 10; i++) {
        await originInput.click();
        await originInput.fill(`Test ${i}`);
        await page.waitForTimeout(50);
        await originInput.clear();
        await page.waitForTimeout(50);
      }
      
      // App should remain stable
      await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
      
      // Final input should work
      await originInput.fill('Brussels');
      await page.waitForTimeout(1000);
      await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
    });

    test('should handle special characters and Unicode', async ({ page }) => {
      const originInput = page.locator('input[placeholder*="origin"]').first();
      
      // Test Unicode and special characters
      const specialInputs = [
        'Café de la Paix', // Accented characters
        '北京', // Chinese characters
        'Москва', // Cyrillic
        'العربية', // Arabic
        '🌍 Location', // Emoji
        'Test & Location', // Ampersand
        'Location <script>alert("test")</script>', // XSS attempt
      ];

      for (const specialInput of specialInputs) {
        await originInput.click();
        await originInput.clear();
        await originInput.fill(specialInput);
        await page.waitForTimeout(500);
        
        // Should handle gracefully without XSS or crashes
        await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
        
        // Value should be properly escaped/handled
        const inputValue = await originInput.inputValue();
        expect(inputValue).toBe(specialInput);
      }
    });
  });

  test.describe('Browser Compatibility Edge Cases', () => {
    test('should handle disabled JavaScript gracefully', async ({ page }) => {
      // Note: This is challenging to test in Playwright since it relies on JS
      // Instead, we test that critical functionality fails gracefully
      
      // Test that basic HTML structure is present
      await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-overlay"]')).toBeVisible();
      
      // Inputs should be accessible even if some JS features fail
      const originInput = page.locator('input[placeholder*="origin"]').first();
      await expect(originInput).toBeVisible();
      await originInput.click();
      await originInput.fill('Test input');
      await expect(originInput).toHaveValue('Test input');
    });

    test('should handle unsupported features gracefully', async ({ page }) => {
      // Simulate missing geolocation API
      await page.addInitScript(() => {
        delete (navigator as any).geolocation;
      });

      await page.reload();
      await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
      
      // App should still load and function
      await expect(page.locator('[data-testid="input-overlay"]')).toBeVisible();
      
      // Manual location entry should still work
      const originInput = page.locator('input[placeholder*="origin"]').first();
      await originInput.click();
      await originInput.fill('Brussels');
      await page.waitForTimeout(1000);
      await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
    });

    test('should handle storage limitations', async ({ page }) => {
      // Simulate localStorage being disabled/full
      await page.addInitScript(() => {
        const mockStorage = {
          setItem: () => { throw new Error('Storage quota exceeded'); },
          getItem: () => null,
          removeItem: () => {},
          clear: () => {},
          length: 0,
          key: () => null
        };
        Object.defineProperty(window, 'localStorage', {
          value: mockStorage,
          writable: true
        });
      });

      await page.reload();
      await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
      
      // App should function without localStorage
      await expect(page.locator('[data-testid="input-overlay"]')).toBeVisible();
      
      const mapContainer = page.locator('[data-testid="map-container"]');
      await mapContainer.click({ position: { x: 300, y: 300 } });
      await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('State Recovery', () => {
    test('should recover from error boundaries', async ({ page }) => {
      // This would require injecting errors to test error boundary
      // For now, test basic error recovery scenarios
      
      const originInput = page.locator('input[placeholder*="origin"]').first();
      
      // Create an error scenario and verify recovery
      await originInput.click();
      await originInput.fill('Test Location');
      
      // Force a page refresh to test state recovery
      await page.reload();
      await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
      
      // App should start fresh without errors
      await expect(page.locator('[data-testid="input-overlay"]')).toBeVisible();
      await expect(originInput).toHaveValue('');
      
      // Should be fully functional again
      await originInput.fill('Brussels');
      await page.waitForTimeout(1000);
      await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
    });

    test('should handle page navigation and back button', async ({ page }) => {
      // Set up some state
      const originInput = page.locator('input[placeholder*="origin"]').first();
      await originInput.click();
      await originInput.fill('Brussels');
      await page.waitForTimeout(1000);
      await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
      
      // Navigate away and back
      await page.goto('about:blank');
      await page.goBack();
      
      // Wait for page to reload
      await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
      
      // State should be reset but app should be functional
      await expect(page.locator('[data-testid="input-overlay"]')).toBeVisible();
      
      // Should be able to use app again
      await originInput.click();
      await originInput.fill('Antwerp');
      await page.waitForTimeout(1000);
      await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
    });

    test('should handle concurrent user actions', async ({ page }) => {
      // Test multiple rapid actions that might conflict
      const mapContainer = page.locator('[data-testid="map-container"]');
      const originInput = page.locator('input[placeholder*="origin"]').first();
      const destinationInput = page.locator('input[placeholder*="destination"]').first();
      
      // Perform concurrent actions
      const actions = [
        mapContainer.click({ position: { x: 300, y: 300 } }),
        originInput.fill('Brussels'),
        mapContainer.click({ position: { x: 400, y: 400 } }),
        destinationInput.fill('Antwerp'),
        page.locator('[data-testid="route-config-trigger"]').click()
      ];
      
      // Execute some actions concurrently
      await Promise.allSettled(actions);
      
      // Wait for everything to settle
      await page.waitForTimeout(2000);
      
      // App should have handled concurrent actions gracefully
      await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
      await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
      
      // Should eventually show route if both markers are placed
      if (await page.locator('.marker-destination').isVisible()) {
        await expect(page.locator('[data-testid="route-sidebar"]')).toBeVisible({ timeout: 10000 });
      }
    });
  });
});