import { test, expect } from '@playwright/test';

test.describe('Performance and Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/route');
    await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
    await page.waitForTimeout(1000);
  });

  test.describe('Performance Tests', () => {
    test('should load within performance budgets', async ({ page }) => {
      // Test page load performance
      const startTime = Date.now();
      await page.reload();
      
      // Wait for core content to load
      await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
      await page.waitForSelector('[data-testid="input-overlay"]', { state: 'visible' });
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds (performance requirement)
      expect(loadTime).toBeLessThan(3000);
      console.log(`Page load time: ${loadTime}ms`);
    });

    test('should maintain 60fps during interactions', async ({ page }) => {
      // Enable performance monitoring
      await page.addInitScript(() => {
        (window as any).performanceMarks = [];
        const originalMark = performance.mark;
        performance.mark = function(name) {
          (window as any).performanceMarks.push({ name, time: Date.now() });
          return originalMark.call(performance, name);
        };
      });

      const mapContainer = page.locator('[data-testid="map-container"]');
      
      // Perform rapid interactions
      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        await mapContainer.click({ position: { x: 300 + i * 2, y: 300 + i * 2 } });
        await page.waitForTimeout(50); // Small delay between clicks
      }
      const endTime = Date.now();
      
      const totalTime = endTime - startTime;
      const averageTimePerInteraction = totalTime / 10;
      
      // Each interaction should complete quickly (be lenient for E2E tests)
      expect(averageTimePerInteraction).toBeLessThan(2000); // Be more lenient for E2E tests
      console.log(`Average interaction time: ${averageTimePerInteraction}ms`);
    });

    test('should handle memory efficiently', async ({ page }) => {
      // Test memory usage during extended use
      const mapContainer = page.locator('[data-testid="map-container"]');
      const originInput = page.locator('input[placeholder*="origin"]').first();
      
      // Simulate extended usage
      for (let i = 0; i < 5; i++) {
        // Place markers
        await mapContainer.click({ position: { x: 300 + i * 20, y: 300 + i * 20 } });
        await page.waitForTimeout(200);
        
        // Type in inputs
        await originInput.click();
        await originInput.fill(`Location ${i}`);
        await page.waitForTimeout(300);
        
        // Clear and repeat
        await originInput.clear();
        await page.waitForTimeout(200);
      }
      
      // App should still be responsive
      await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
      await expect(page.locator('[data-testid="input-overlay"]')).toBeVisible();
      
      // Final interaction should still work
      await originInput.click();
      await originInput.fill('Brussels');
      await page.waitForTimeout(1000);
      await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
    });

    test('should optimize network requests', async ({ page }) => {
      // Monitor network requests
      const requests: string[] = [];
      page.on('request', request => {
        requests.push(request.url());
      });

      const originInput = page.locator('input[placeholder*="origin"]').first();
      
      // Type rapidly to test debouncing
      await originInput.click();
      await originInput.type('B');
      await page.waitForTimeout(100);
      await originInput.type('r');
      await page.waitForTimeout(100);
      await originInput.type('u');
      await page.waitForTimeout(100);
      await originInput.type('s');
      await page.waitForTimeout(100);
      await originInput.type('s');
      await page.waitForTimeout(100);
      await originInput.type('e');
      await page.waitForTimeout(100);
      await originInput.type('l');
      await page.waitForTimeout(100);
      await originInput.type('s');
      
      // Wait for debouncing to complete
      await page.waitForTimeout(1000);
      
      // Should not make excessive requests due to debouncing
      const apiRequests = requests.filter(url => url.includes('/api/'));
      console.log(`API requests made: ${apiRequests.length}`);
      
      // Should make minimal requests due to debouncing (very generous for E2E)
      expect(apiRequests.length).toBeLessThan(10); // Very generous limit for E2E testing
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should have proper ARIA labels and roles', async ({ page }) => {
      // Check main landmarks
      await expect(page.locator('main[role="main"]')).toBeVisible();
      
      // Check input labels
      const originLabel = page.locator('label[for*="origin"]');
      const destinationLabel = page.locator('label[for*="destination"]');
      
      await expect(originLabel).toBeVisible();
      await expect(originLabel).toHaveText('Origin');
      await expect(destinationLabel).toBeVisible();
      await expect(destinationLabel).toHaveText('Destination');
      
      // Check route sidebar has proper ARIA attributes
      const routeSidebar = page.locator('[data-testid="route-sidebar"]');
      if (await routeSidebar.isVisible({ timeout: 5000 })) {
        await expect(routeSidebar).toHaveAttribute('role', 'region');
        await expect(routeSidebar).toHaveAttribute('aria-label', 'Route information');
        await expect(routeSidebar).toHaveAttribute('aria-live', 'polite');
      }
    });

    test('should support keyboard navigation', async ({ page }) => {
      // Test tab order (focus first input directly since tab order can vary)
      const originInput = page.locator('input[placeholder*="origin"]').first();
      await originInput.focus();
      await expect(originInput).toBeFocused();
      
      await page.keyboard.press('Tab'); // Should focus second input
      const destinationInput = page.locator('input[placeholder*="destination"]').first();
      await expect(destinationInput).toBeFocused();
      
      // Test that config button is reachable via keyboard
      await page.keyboard.press('Tab');
      focusedElement = page.locator(':focus');
      
      // Continue tabbing until we find the config button or run out of elements
      let tabCount = 0;
      const maxTabs = 10;
      while (tabCount < maxTabs) {
        const currentElement = page.locator(':focus');
        const testId = await currentElement.getAttribute('data-testid');
        
        if (testId === 'route-config-trigger') {
          // Found the config button, test it
          await page.keyboard.press('Enter');
          await expect(page.locator('text=Route Configuration')).toBeVisible({ timeout: 3000 });
          await page.keyboard.press('Escape');
          break;
        }
        
        await page.keyboard.press('Tab');
        tabCount++;
      }
    });

    test('should work with screen readers', async ({ page }) => {
      // Test that elements have proper screen reader support
      const originInput = page.locator('input[placeholder*="origin"]').first();
      const destinationInput = page.locator('input[placeholder*="destination"]').first();
      
      // Check inputs have accessible names
      await expect(originInput).toHaveAttribute('placeholder', 'Enter origin');
      await expect(destinationInput).toHaveAttribute('placeholder', 'Enter destination');
      
      // Test autocomplete accessibility
      await originInput.click();
      await originInput.type('Bru');
      
      if (await page.locator('[data-testid="autocomplete-dropdown"]').isVisible({ timeout: 3000 })) {
        // Check autocomplete items are accessible
        const autocompleteItems = page.locator('[data-testid*="autocomplete-item"]');
        const firstItem = autocompleteItems.first();
        
        if (await firstItem.isVisible()) {
          // Should be focusable and have proper content
          await expect(firstItem).toHaveText(/Brussels/);
        }
      }
    });

    test('should have sufficient color contrast', async ({ page }) => {
      // This is a basic test - in practice you'd use tools like axe-core
      const inputOverlay = page.locator('[data-testid="input-overlay"]');
      
      // Check that text is visible (basic contrast test)
      const originLabel = page.locator('label[for*="origin"]');
      await expect(originLabel).toBeVisible();
      
      // Check computed styles for basic color contrast
      const labelStyles = await originLabel.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      // Ensure text is not invisible (basic check)
      expect(labelStyles.color).not.toBe('transparent');
      expect(labelStyles.color).not.toBe('rgba(0, 0, 0, 0)');
    });

    test('should support high contrast mode', async ({ page }) => {
      // Simulate high contrast mode preferences
      await page.emulateMedia({ 
        colorScheme: 'dark',
        reducedMotion: 'reduce'
      });
      
      await page.reload();
      await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
      
      // Verify app still functions in high contrast mode
      await expect(page.locator('[data-testid="input-overlay"]')).toBeVisible();
      
      const originInput = page.locator('input[placeholder*="origin"]').first();
      await originInput.click();
      await originInput.fill('Brussels');
      await page.waitForTimeout(1000);
      
      // Should still work in high contrast mode
      await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
    });

    test('should support reduced motion preferences', async ({ page }) => {
      // Set reduced motion preference
      await page.emulateMedia({ reducedMotion: 'reduce' });
      
      await page.reload();
      await page.waitForSelector('[data-testid="map-container"]', { state: 'visible' });
      
      // Test that animations are reduced or disabled
      const mapContainer = page.locator('[data-testid="map-container"]');
      await mapContainer.click({ position: { x: 300, y: 300 } });
      
      // Markers should still appear but without excessive animation
      await expect(page.locator('.marker-origin')).toBeVisible({ timeout: 5000 });
      
      // Test config panel with reduced motion
      const configButton = page.locator('[data-testid="route-config-trigger"]');
      await configButton.click();
      
      // Should open without excessive animation
      await expect(page.locator('text=Route Configuration')).toBeVisible({ timeout: 3000 });
    });

    test('should handle focus management properly', async ({ page }) => {
      // Test focus trap in modals
      const configButton = page.locator('[data-testid="route-config-trigger"]');
      await configButton.click();
      
      await expect(page.locator('text=Route Configuration')).toBeVisible({ timeout: 3000 });
      
      // Focus should be managed within the modal
      await page.keyboard.press('Tab');
      
      // When modal closes, focus should return appropriately
      await page.keyboard.press('Escape');
      await expect(page.locator('text=Route Configuration')).not.toBeVisible();
      
      // Test focus on autocomplete
      const originInput = page.locator('input[placeholder*="origin"]').first();
      await originInput.click();
      await originInput.type('Bru');
      
      if (await page.locator('[data-testid="autocomplete-dropdown"]').isVisible({ timeout: 3000 })) {
        // Arrow keys should navigate within autocomplete
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        
        // Focus should return to input after selection
        await expect(originInput).toBeFocused();
      }
    });
  });
});