import { test, expect } from '@playwright/test';

test.describe('6. Responsive Design, Navigation Resilience & Edge Cases Suite', () => {

  test('6.1 Mobile viewport (390x844): hamburger menu toggle and navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // Verify brand logo
    await expect(page.getByRole('link', { name: /MAXYWALK/i }).first()).toBeVisible({ timeout: 15000 });

    // Open hamburger menu
    const menuToggle = page.locator('#mobile-menu-toggle, button[aria-label*="mobile menu"]').first();
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();

    // Verify mobile drawer items are visible
    await expect(page.getByRole('link', { name: /Shop All/i }).or(page.getByRole('link', { name: /Slippers/i })).first()).toBeVisible({ timeout: 5000 });

    // Take mobile screenshot for visual verification
    await page.screenshot({ path: 'test-results/mobile-390x844-home.png' });
  });

  test('6.2 Tablet viewport (768x1024): grid layout integrity and no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/shop');

    await expect(page.locator('.product-card, .group').filter({ hasText: '₹' }).first()).toBeVisible({ timeout: 15000 });

    // Check no horizontal scrollbar / overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2); // 2px margin of error for fractional pixels

    await page.screenshot({ path: 'test-results/tablet-768x1024-shop.png' });
  });

  test('6.3 Desktop viewport (1440x900): layout and visual rendering', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await expect(page.getByRole('link', { name: /MAXYWALK/i }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('link', { name: /SLIPPERS/i }).first()).toBeVisible();

    await page.screenshot({ path: 'test-results/desktop-1440x900-home.png' });
  });

  test('6.4 Browser back and forward history navigation preserves state', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MaxyWalk/i);

    // Go to Shop
    await page.goto('/shop');
    await expect(page).toHaveURL(/.*\/shop/);

    // Click back
    await page.goBack();
    await expect(page).toHaveURL(/\/$/);

    // Click forward
    await page.goForward();
    await expect(page).toHaveURL(/.*\/shop/);
  });

  test('6.5 404 Route gracefully displays branded not found screen with Home redirect', async ({ page }) => {
    await page.goto('/this-is-an-unknown-url-404');

    await expect(page.getByText('404')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Page Not Found/i })).toBeVisible();

    // Click "Back to Home"
    const backBtn = page.getByRole('link', { name: /Back to Home/i });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    await expect(page).toHaveURL(/\/$/);
  });

});
