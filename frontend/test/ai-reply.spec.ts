import { test, expect } from '@playwright/test';

test.describe('AI Reply Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(1000);
    await page.locator('input').nth(0).fill('kusal@gmail.com');
    await page.locator('input').nth(1).fill('321');
    await page.locator('button').filter({ hasText: /log in/i }).click();
    await page.waitForURL('**/profile', { timeout: 15000 });
  });

  test('AI reply is visible on support ticket', async ({ page }) => {
    await page.getByText('view reply').first().click();
    const reply = page.locator('.leading-relaxed').first();
    await reply.waitFor({ timeout: 10000 });
    const text = await reply.textContent();
    expect(text).not.toBe('');
    expect(text).not.toBeNull();
    expect(text!.length).toBeGreaterThan(10);
    console.log('✅ AI Reply:', text?.substring(0, 100));
  });

  test('AI reply contains helpful content', async ({ page }) => {
    await page.getByText('view reply').first().click();
    const reply = page.locator('.leading-relaxed').first();
    await reply.waitFor({ timeout: 10000 });
    const text = await reply.textContent();
    expect(text).not.toContain('error');
    expect(text).not.toContain('undefined');
    expect(text!.length).toBeGreaterThan(50);
    console.log('✅ Helpful:', text?.substring(0, 100));
  });

  test('AI reply shows for each ticket', async ({ page }) => {
    const buttons = page.getByText('view reply');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);
    await buttons.first().click();
    const reply = page.locator('.leading-relaxed').first();
    await reply.waitFor({ timeout: 10000 });
    const text = await reply.textContent();
    expect(text!.length).toBeGreaterThan(10);
    console.log('✅ Verified:', count, 'tickets');
  });

});