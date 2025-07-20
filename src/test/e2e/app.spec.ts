import { test, expect } from '@playwright/test'

test.describe('Maps Demo App', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')
    
    // Should show loading state or map
    await expect(page.locator('text=Getting your location')).toBeVisible()
    
    // Wait for map to load
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible({ timeout: 10000 })
  })

  test('should handle geolocation permission', async ({ page }) => {
    // Mock geolocation permission denied
    await page.context().grantPermissions([])
    
    await page.goto('/')
    
    // Should still load with fallback location
    await expect(page.locator('[data-testid="map-container"]')).toBeVisible({ timeout: 10000 })
  })
})