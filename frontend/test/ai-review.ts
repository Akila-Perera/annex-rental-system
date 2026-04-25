import { test, expect } from '@playwright/test';

test.describe('Student Annex Review Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    await page.locator('input').nth(0).fill('kusal@gmail.com');
    await page.locator('input').nth(1).fill('321');
    await page.locator('button').filter({ hasText: /log in/i }).click();
    await page.waitForURL('**/profile', { timeout: 15000 });
  });

  test('Student can see review form on annex page', async ({ page }) => {
    // Go to home and open first annex
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1500);

    // Click first annex listing
    await page.locator('[class*="annex"], [class*="listing"], [class*="property"], [class*="card"]')
      .first()
      .click();
    await page.waitForTimeout(1500);

    // Check review section is visible
    const reviewSection = page.locator(
      '[class*="review"], [class*="Review"], textarea, input[placeholder*="review" i]'
    ).first();
    await reviewSection.waitFor({ timeout: 10000 });
    expect(reviewSection).toBeVisible();

    console.log('✅ Review form is visible on annex page');
  });

  test('Student can submit a review with rating and comment', async ({ page }) => {
    // Go to home and open first annex
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1500);

    // Click first annex listing
    await page.locator('[class*="annex"], [class*="listing"], [class*="property"], [class*="card"]')
      .first()
      .click();
    await page.waitForTimeout(1500);

    // Click star rating
    const stars = page.locator('[class*="star"], [class*="Star"]');
    const starCount = await stars.count();
    if (starCount > 0) {
      await stars.last().click();
      await page.waitForTimeout(500);
      console.log(`✅ Clicked star rating, found ${starCount} stars`);
    }

    // Fill review comment
    const reviewInput = page.locator(
      'textarea, input[placeholder*="review" i], input[placeholder*="comment" i]'
    ).first();
    await reviewInput.waitFor({ timeout: 8000 });
    await reviewInput.fill('Great place to stay! Clean and close to university.');
    await page.waitForTimeout(500);

    // Submit review
    await page.locator('button').filter({ hasText: /submit|post|send|review/i }).click();
    await page.waitForTimeout(2000);

    // Check success message appears
    const success = page.locator(
      '[class*="success"], [class*="toast"], [class*="alert"]'
    ).first();
    await expect(success).toBeVisible({ timeout: 8000 });

    console.log('✅ Review submitted successfully');
  });

  test('Submitted review appears on annex page', async ({ page }) => {
    // Go to home and open first annex
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(1500);

    // Click first annex listing
    await page.locator('[class*="annex"], [class*="listing"], [class*="property"], [class*="card"]')
      .first()
      .click();
    await page.waitForTimeout(1500);

    // Check reviews list is visible
    const reviewsList = page.locator(
      '[class*="review"], [class*="Review"], [class*="comment"]'
    );
    const reviewCount = await reviewsList.count();
    expect(reviewCount).toBeGreaterThan(0);

    // Check first review has content
    const firstReview = reviewsList.first();
    const reviewText = await firstReview.textContent();
    expect(reviewText).not.toBe('');
    expect(reviewText!.length).toBeGreaterThan(0);

    console.log(`✅ Found ${reviewCount} reviews`);
    console.log('✅ Review content:', reviewText?.substring(0, 100));
  });

});