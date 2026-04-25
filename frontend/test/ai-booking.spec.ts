import { test, expect } from '@playwright/test';

test.describe('Student Annex Booking Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    await page.locator('input').nth(0).fill('kusal@gmail.com');
    await page.locator('input').nth(1).fill('321');
    await page.locator('button').filter({ hasText: /log in/i }).click();
    await page.waitForURL('**/profile', { timeout: 15000 });
  });

  // ─── Test 1 ───────────────────────────────────────────────────────────────
  test('Student can fill booking form with name email and date', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1500);

    // Click first annex listing
    await page.locator(
      '[class*="annex"], [class*="listing"], [class*="property"], [class*="card"]'
    ).first().click();
    await page.waitForTimeout(1500);

    // Click Book Now / Request Booking button
    const bookBtn = page.locator('button').filter({
      hasText: /book|reserve|request/i
    }).first();
    await bookBtn.waitFor({ timeout: 8000 });
    await bookBtn.click();
    await page.waitForTimeout(1000);

    // Fill student name
    const nameInput = page.locator(
      'input[placeholder*="name" i], input[name*="name" i], [class*="name"] input'
    ).first();
    await nameInput.waitFor({ timeout: 8000 });
    await nameInput.fill('Kusal Perera');
    console.log('✅ Name filled');

    // Fill student email
    const emailInput = page.locator(
      'input[type="email"], input[placeholder*="email" i], input[name*="email" i]'
    ).first();
    await emailInput.waitFor({ timeout: 5000 });
    await emailInput.fill('kusal@gmail.com');
    console.log('✅ Email filled');

    // Fill preferred move-in date
    const dateInput = page.locator(
      'input[type="date"], input[placeholder*="date" i], input[name*="date" i]'
    ).first();
    await dateInput.waitFor({ timeout: 5000 });
    await dateInput.fill('2026-05-01');
    console.log('✅ Date filled');

    // Check all fields are filled
    expect(await nameInput.inputValue()).toBe('Kusal Perera');
    expect(await emailInput.inputValue()).toBe('kusal@gmail.com');
    expect(await dateInput.inputValue()).toBe('2026-05-01');

    console.log('✅ Booking form filled successfully');
  });

  // ─── Test 2 ───────────────────────────────────────────────────────────────
  test('Student can send booking request to annex owner', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1500);

    // Click first annex listing
    await page.locator(
      '[class*="annex"], [class*="listing"], [class*="property"], [class*="card"]'
    ).first().click();
    await page.waitForTimeout(1500);

    // Click Book Now button
    const bookBtn = page.locator('button').filter({
      hasText: /book|reserve|request/i
    }).first();
    await bookBtn.waitFor({ timeout: 8000 });
    await bookBtn.click();
    await page.waitForTimeout(1000);

    // Fill name
    const nameInput = page.locator(
      'input[placeholder*="name" i], input[name*="name" i], [class*="name"] input'
    ).first();
    await nameInput.waitFor({ timeout: 8000 });
    await nameInput.fill('Kusal Perera');

    // Fill email
    const emailInput = page.locator(
      'input[type="email"], input[placeholder*="email" i], input[name*="email" i]'
    ).first();
    await emailInput.fill('kusal@gmail.com');

    // Fill date
    const dateInput = page.locator(
      'input[type="date"], input[placeholder*="date" i], input[name*="date" i]'
    ).first();
    await dateInput.fill('2026-05-01');

    await page.waitForTimeout(500);

    // Submit booking request
    const submitBtn = page.locator('button').filter({
      hasText: /submit|send|confirm|request/i
    }).first();
    await submitBtn.waitFor({ timeout: 5000 });
    await submitBtn.click();
    await page.waitForTimeout(2000);

    // Check success message
    const success = page.locator(
      '[class*="success"], [class*="toast"], [class*="alert"], [class*="confirm"]'
    ).first();
    await expect(success).toBeVisible({ timeout: 8000 });

    console.log('✅ Booking request sent to annex owner');
  });

  // ─── Test 3 ───────────────────────────────────────────────────────────────
  test('Booking request appears in student bookings tab', async ({ page }) => {
    // Go to profile bookings tab
    await page.goto('http://localhost:5173/profile');
    await page.waitForTimeout(1500);

    // Click Bookings tab
    const bookingsTab = page.locator(
      '[class*="tab"], button, a'
    ).filter({ hasText: /booking/i }).first();
    await bookingsTab.waitFor({ timeout: 8000 });
    await bookingsTab.click();
    await page.waitForTimeout(1500);

    // Check booking list is visible
    const bookingList = page.locator(
      '[class*="booking"], [class*="Booking"], [class*="reservation"]'
    );
    const bookingCount = await bookingList.count();
    expect(bookingCount).toBeGreaterThan(0);
    console.log(`✅ Found ${bookingCount} bookings in profile`);

    // Check booking has pending or accepted status
    const status = page.locator(
      '[class*="status"], [class*="Status"], [class*="badge"], [class*="pending"], [class*="accepted"]'
    ).first();
    await status.waitFor({ timeout: 5000 });
    const statusText = await status.textContent();
    console.log(`✅ Booking status: ${statusText}`);
    expect(statusText).not.toBe('');
  });

  // ─── Test 4 ───────────────────────────────────────────────────────────────
  test('Annex owner can accept the booking request', async ({ page }) => {
    // Logout student first
    await page.goto('http://localhost:5173/profile');
    await page.waitForTimeout(1000);

    const logoutBtn = page.locator('button').filter({
      hasText: /logout|log out|sign out/i
    }).first();
    await logoutBtn.waitFor({ timeout: 5000 });
    await logoutBtn.click();
    await page.waitForTimeout(1000);

    // Login as annex owner
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    await page.locator('input').nth(0).fill('owner@gmail.com');
    await page.locator('input').nth(1).fill('owner123');
    await page.locator('button').filter({ hasText: /log in/i }).click();
    await page.waitForURL('**/', { timeout: 15000 });
    await page.waitForTimeout(1500);

    // Navigate to owner bookings / requests
    const bookingsLink = page.locator('a, button').filter({
      hasText: /booking|request|reservation/i
    }).first();
    await bookingsLink.waitFor({ timeout: 8000 });
    await bookingsLink.click();
    await page.waitForTimeout(1500);

    // Click Accept on first booking request
    const acceptBtn = page.locator('button').filter({
      hasText: /accept|approve|confirm/i
    }).first();
    await acceptBtn.waitFor({ timeout: 8000 });
    await acceptBtn.click();
    await page.waitForTimeout(2000);

    // Check success confirmation
    const success = page.locator(
      '[class*="success"], [class*="toast"], [class*="alert"]'
    ).first();
    await expect(success).toBeVisible({ timeout: 8000 });

    console.log('✅ Annex owner accepted the booking request');
  });

});