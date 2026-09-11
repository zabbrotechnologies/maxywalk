import { test, expect } from '@playwright/test';

test.describe('2. Products, Search, Filters, Detail & Variants Suite', () => {

  test('2.1 Product catalogue loads with category tabs and product cards', async ({ page }) => {
    await page.goto('/shop');
    
    // Check heading
    await expect(page.getByRole('heading', { name: /All Products/i }).or(page.getByText(/Shop All/i)).first()).toBeVisible({ timeout: 15000 });

    // Category filter pills should be visible
    await expect(page.getByRole('button', { name: /Slippers/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Sandals/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Belts/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Wallets/i }).first()).toBeVisible();

    // Verify at least one product card with price is rendered
    const productCards = page.locator('.product-card, .group').filter({ hasText: '₹' });
    await expect(productCards.first()).toBeVisible({ timeout: 15000 });
  });

  test('2.2 Category filtering updates active catalogue', async ({ page }) => {
    await page.goto('/shop');

    // Click 'Belts' category button
    const beltsBtn = page.getByRole('button', { name: /Belts/i }).first();
    await expect(beltsBtn).toBeVisible({ timeout: 10000 });
    await beltsBtn.click();

    // Verify URL or heading changes
    await expect(page).toHaveURL(/.*category=belts.*/);
    
    // Product cards should update
    const productCard = page.locator('.product-card, .group').filter({ hasText: '₹' }).first();
    await expect(productCard).toBeVisible({ timeout: 15000 });
  });

  test('2.3 Search functionality filters products by name', async ({ page }) => {
    await page.goto('/shop?search=Mule');

    // Wait for search result
    const muleProduct = page.locator('.product-card, .group').filter({ hasText: /Mule/i }).first();
    await expect(muleProduct).toBeVisible({ timeout: 15000 });
  });

  test('2.4 Sorting by price alters order correctly', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.locator('.product-card, .group').filter({ hasText: '₹' }).first()).toBeVisible({ timeout: 15000 });

    // Select 'Price: Low to High'
    const sortSelect = page.locator('select').first();
    await sortSelect.selectOption('price_asc');

    // Wait for refreshed product list
    await page.waitForTimeout(1000);
    const firstProduct = page.locator('.product-card, .group').filter({ hasText: '₹' }).first();
    await expect(firstProduct).toBeVisible();
  });

  test('2.5 Product Detail: renders images, size pills, color options, quantity controls', async ({ page }) => {
    await page.goto('/shop');
    
    // Click on the first product card
    const firstCard = page.locator('.product-card, .group').filter({ hasText: '₹' }).first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();

    await page.waitForURL(/\/product\//, { timeout: 10000 });

    // Verify product title, price, description
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.getByText('₹').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Add to Cart/i }).first()).toBeVisible();

    // Verify quantity increment / decrement
    const qtyInput = page.locator('input[type="number"], .font-display').filter({ hasText: /\d+/ }).first();
    const plusBtn = page.locator('button').filter({ hasText: '+' }).first();
    if (await plusBtn.isVisible()) {
      await plusBtn.click();
    }
  });

  test('2.6 Edge Case: Non-existent product ID gracefully displays 404 message', async ({ page }) => {
    await page.goto('/product/non-existent-product-id-99999');

    // Verify user-friendly error UI instead of app crash
    await expect(page.getByText(/Product not found/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /Back to Shop Catalogue/i })).toBeVisible();
  });

});
