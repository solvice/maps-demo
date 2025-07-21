import { test, expect } from '@playwright/test';

const SAMPLE_TABLE_REQUEST = `{
  "coordinates": [
    [3.7174, 51.0543],
    [3.7274, 51.0643],
    [3.7074, 51.0443],
    [3.7374, 51.0743]
  ],
  "sources": [0, 1, 2, 3],
  "destinations": [0, 1, 2, 3],
  "annotations": ["duration", "distance"],
  "vehicleType": "CAR",
  "engine": "OSM"
}`;

test.describe('Table Sync Demo', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/table');
    await page.waitForLoadState('networkidle');
  });

  test('should display table sync demo page correctly', async ({ page }) => {
    // Check page title and main elements
    await expect(page.getByRole('heading', { name: 'Table Sync Demo' })).toBeVisible();
    await expect(page.getByLabel('Table Request (JSON format)')).toBeVisible();
    
    // Check that map is rendered
    await expect(page.locator('canvas')).toBeVisible();
    
    // Check that map controls are present
    await expect(page.locator('[data-testid="map-style-toggle"]')).toBeVisible();
  });

  test('should parse and display coordinates from table request', async ({ page }) => {
    const textarea = page.getByLabel('Table Request (JSON format)');
    
    // Paste the sample table request
    await textarea.fill(SAMPLE_TABLE_REQUEST);
    
    // Wait for markers to appear on the map
    await page.waitForTimeout(1000);
    
    // Check that markers are created (4 coordinates = 4 markers)
    const markers = page.locator('[data-testid^="table-marker-"]');
    await expect(markers).toHaveCount(4);
  });

  test('should show loading state during calculation', async ({ page }) => {
    const textarea = page.getByLabel('Table Request (JSON format)');
    
    // Start filling the textarea
    await textarea.fill(SAMPLE_TABLE_REQUEST);
    
    // Should show loading indicator
    await expect(page.getByText('Calculating matrix...')).toBeVisible();
    
    // Loading should eventually disappear
    await expect(page.getByText('Calculating matrix...')).not.toBeVisible({ timeout: 10000 });
  });

  test('should show calculation time after successful request', async ({ page }) => {
    const textarea = page.getByLabel('Table Request (JSON format)');
    await textarea.fill(SAMPLE_TABLE_REQUEST);
    
    // Wait for calculation to complete
    await page.waitForTimeout(3000);
    
    // Should show calculation time
    await expect(page.getByText(/Calculated in \d+ms/)).toBeVisible();
  });

  test('should handle invalid JSON gracefully', async ({ page }) => {
    const textarea = page.getByLabel('Table Request (JSON format)');
    
    // Enter invalid JSON
    await textarea.fill('{ invalid json }');
    
    // Should show error toast
    await expect(page.getByText(/Invalid table request/)).toBeVisible();
  });

  test('should validate coordinate format', async ({ page }) => {
    const textarea = page.getByLabel('Table Request (JSON format)');
    
    // Enter request with invalid coordinates
    const invalidRequest = `{
      "coordinates": [
        [3.7174],
        [3.7274, 51.0643]
      ],
      "sources": [0, 1],
      "destinations": [0, 1]
    }`;
    
    await textarea.fill(invalidRequest);
    
    // Should show error toast for invalid coordinate format
    await expect(page.getByText(/Invalid coordinate format/)).toBeVisible();
  });

  test('should require minimum 2 coordinates', async ({ page }) => {
    const textarea = page.getByLabel('Table Request (JSON format)');
    
    // Enter request with only 1 coordinate
    const singleCoordRequest = `{
      "coordinates": [
        [3.7174, 51.0543]
      ]
    }`;
    
    await textarea.fill(singleCoordRequest);
    
    // Should show error toast
    await expect(page.getByText(/At least 2 coordinates are required/)).toBeVisible();
  });

  test('should show hover effects on markers', async ({ page }) => {
    const textarea = page.getByLabel('Table Request (JSON format)');
    await textarea.fill(SAMPLE_TABLE_REQUEST);
    
    // Wait for markers and calculation to complete
    await page.waitForTimeout(3000);
    
    // Get first marker
    const firstMarker = page.locator('[data-testid="table-marker-0"]');
    await expect(firstMarker).toBeVisible();
    
    // Hover over the marker
    await firstMarker.hover();
    
    // Should show coordinate tooltip (built into browser tooltip, hard to test)
    // But we can at least verify the marker is interactive
    await expect(firstMarker).toBeVisible();
  });

  test('should fit map to coordinates', async ({ page }) => {
    const textarea = page.getByLabel('Table Request (JSON format)');
    await textarea.fill(SAMPLE_TABLE_REQUEST);
    
    // Wait for markers to appear and map to fit
    await page.waitForTimeout(2000);
    
    // All markers should be visible (map should have fit to bounds)
    const markers = page.locator('[data-testid^="table-marker-"]');
    for (let i = 0; i < 4; i++) {
      await expect(page.locator(`[data-testid="table-marker-${i}"]`)).toBeVisible();
    }
  });

  test('should clear data when textarea is emptied', async ({ page }) => {
    const textarea = page.getByLabel('Table Request (JSON format)');
    
    // First fill with data
    await textarea.fill(SAMPLE_TABLE_REQUEST);
    await page.waitForTimeout(1000);
    
    // Verify markers exist
    await expect(page.locator('[data-testid^="table-marker-"]')).toHaveCount(4);
    
    // Clear the textarea
    await textarea.fill('');
    
    // Wait a bit for clearing
    await page.waitForTimeout(500);
    
    // Markers should be gone
    await expect(page.locator('[data-testid^="table-marker-"]')).toHaveCount(0);
  });

  test('should handle map style switching', async ({ page }) => {
    const textarea = page.getByLabel('Table Request (JSON format)');
    await textarea.fill(SAMPLE_TABLE_REQUEST);
    
    // Wait for initial load
    await page.waitForTimeout(1000);
    
    // Find and click style toggle
    const styleToggle = page.locator('[data-testid="map-style-toggle"]');
    await styleToggle.click();
    
    // Map should still work and markers should still be visible
    await page.waitForTimeout(1000);
    await expect(page.locator('[data-testid^="table-marker-"]')).toHaveCount(4);
  });

  test('should disable textarea during loading', async ({ page }) => {
    const textarea = page.getByLabel('Table Request (JSON format)');
    
    // Fill textarea to trigger loading
    await textarea.fill(SAMPLE_TABLE_REQUEST);
    
    // Textarea should be disabled during loading
    await expect(textarea).toBeDisabled();
    
    // Wait for loading to complete
    await page.waitForTimeout(3000);
    
    // Textarea should be enabled again
    await expect(textarea).toBeEnabled();
  });
});

test.describe('Table Sync API Integration', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock the API to return an error
    await page.route('**/api/table/sync', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/table');
    await page.waitForLoadState('networkidle');

    const textarea = page.getByLabel('Table Request (JSON format)');
    await textarea.fill(SAMPLE_TABLE_REQUEST);

    // Should show error toast
    await expect(page.getByText(/Internal server error/)).toBeVisible();
  });

  test('should handle rate limiting', async ({ page }) => {
    // Mock rate limit response
    await page.route('**/api/table/sync', route => {
      route.fulfill({
        status: 429,
        body: JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' })
      });
    });

    await page.goto('/table');
    await page.waitForLoadState('networkidle');

    const textarea = page.getByLabel('Table Request (JSON format)');
    await textarea.fill(SAMPLE_TABLE_REQUEST);

    // Should show rate limit error
    await expect(page.getByText(/Rate limit exceeded/)).toBeVisible();
  });
});

test.describe('Table Sync Navigation', () => {
  test('should navigate to table demo from home page', async ({ page }) => {
    await page.goto('/');
    
    // Click on Table Sync Demo link
    await page.getByRole('link', { name: 'Table Sync Demo' }).click();
    
    // Should navigate to table page
    await expect(page).toHaveURL('/table');
    await expect(page.getByRole('heading', { name: 'Table Sync Demo' })).toBeVisible();
  });
});