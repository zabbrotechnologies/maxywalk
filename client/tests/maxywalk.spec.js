import { test, expect } from '@playwright/test';

test.describe('MaxyWalk E2E Tests', () => {

  test('Homepage loads and displays products', async ({ page }) => {
    await page.goto('/');
    
    // Check title
    await expect(page).toHaveTitle(/MaxyWalk/i);
    
    // Verify hero section is visible
    const heroTitle = page.locator('h1').first();
    await expect(heroTitle).toBeVisible();

    // Verify products load (assumes at least one product is seeded)
    const productCards = page.locator('.group').filter({ hasText: '₹' });
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
  });

  test('Add to Cart functionality', async ({ page }) => {
    await page.goto('/');
    
    // Wait for products to load
    const productCard = page.locator('.group').filter({ hasText: '₹' }).first();
    await expect(productCard).toBeVisible({ timeout: 10000 });

    // Click on the first product to view details
    await productCard.click();

    // Verify Product Detail page loaded
    await expect(page.getByRole('button', { name: /Add to Cart/i }).first()).toBeVisible();

    // Click Add to Cart
    await page.getByRole('button', { name: /Add to Cart/i }).first().click();

    // Verify Cart opens/updates (Assuming there's a cart indicator or toast)
    // The cart sheet should slide in
    await expect(page.getByText('Your Cart')).toBeVisible();
    await expect(page.getByRole('button', { name: /Checkout/i })).toBeVisible();
  });

  test('Admin Login and Dashboard rendering', async ({ page }) => {
    // Note: This relies on the "loginAsDemoAdmin" shortcut we left in Login.jsx for admin123
    await page.goto('/login');
    
    // Fill in admin credentials
    await page.fill('input[type="email"]', 'admin@maxywalk.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Submit login
    await page.click('button[type="submit"]');

    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/.*\/admin/);
    
    // Verify dashboard metrics load
    await expect(page.getByText('Total Revenue')).toBeVisible();
    await expect(page.getByText('Total Orders')).toBeVisible();
    await expect(page.getByText('Products').first()).toBeVisible();
  });

});
