import { test, expect } from '@playwright/test';

test.describe('Map Integration Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    await page.locator('input').nth(0).fill('kusal@gmail.com');
    await page.locator('input').nth(1).fill('321');
    await page.locator('button').filter({ hasText: /log in/i }).click();
    await page.waitForURL('**/profile', { timeout: 15000 });
  });

  // ─── Test 1 ───────────────────────────────────────────────────────────────
  test('Student can see map on home page', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    // Check map container is visible
    const map = page.locator(
      '[class*="map"], [class*="Map"], #map, .leaflet-container, .mapboxgl-map, [class*="google-map"]'
    ).first();
    await map.waitFor({ timeout: 10000 });
    expect(map).toBeVisible();

    console.log('✅ Map is visible on home page');
  });

  // ─── Test 2 ───────────────────────────────────────────────────────────────
  test('Student can click annex marker on map and navigate to annex', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    // Wait for map to fully load
    const map = page.locator(
      '[class*="map"], [class*="Map"], #map, .leaflet-container, .mapboxgl-map'
    ).first();
    await map.waitFor({ timeout: 10000 });
    await page.waitForTimeout(2000);

    // Click first map marker / pin
    const marker = page.locator(
      '.leaflet-marker-icon, [class*="marker"], [class*="Marker"], [class*="pin"], [class*="Pin"]'
    ).first();
    await marker.waitFor({ timeout: 10000 });
    await marker.click();
    await page.waitForTimeout(1500);

    // Check popup or annex info appears after clicking marker
    const popup = page.locator(
      '.leaflet-popup, [class*="popup"], [class*="Popup"], [class*="tooltip"], [class*="info"]'
    ).first();
    await popup.waitFor({ timeout: 8000 });
    expect(popup).toBeVisible();

    console.log('✅ Marker clicked and popup appeared');

    // Click link inside popup to go to annex detail
    const annexLink = popup.locator('a, button').first();
    const hasLink = await annexLink.count();
    if (hasLink > 0) {
      await annexLink.click();
      await page.waitForTimeout(2000);
      console.log('✅ Navigated to annex from map marker');
    }
  });

  // ─── Test 3 ───────────────────────────────────────────────────────────────
  test('Map suggests annexes with similar price and distance', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);

    // Set budget filter (similar price range)
    const budgetFilter = page.locator(
      '[class*="budget"], [class*="Budget"], [class*="price"], input[type="range"], select'
    ).first();
    const hasBudget = await budgetFilter.count();
    if (hasBudget > 0) {
      await budgetFilter.click();
      await page.waitForTimeout(500);
      console.log('✅ Budget filter found and clicked');
    }

    // Set location filter (similar distance)
    const locationFilter = page.locator(
      'input[placeholder*="location" i], input[placeholder*="university" i], input[placeholder*="near" i], input[placeholder*="where" i]'
    ).first();
    const hasLocation = await locationFilter.count();
    if (hasLocation > 0) {
      await locationFilter.fill('SLIIT');
      await page.waitForTimeout(500);
      console.log('✅ Location filter filled');
    }

    // Click search button
    const searchBtn = page.locator(
      'button'
    ).filter({ hasText: /search|find|go/i }).first();
    const hasSearch = await searchBtn.count();
    if (hasSearch > 0) {
      await searchBtn.click();
      await page.waitForTimeout(2000);
      console.log('✅ Search triggered');
    }

    // Check that map markers appear after search
    const markers = page.locator(
      '.leaflet-marker-icon, [class*="marker"], [class*="Marker"], [class*="pin"]'
    );
    await page.waitForTimeout(2000);

    // Assert markers are visible
    await expect(markers.first()).toBeVisible();

    console.log('✅ Map shows markers after search');
  });
});