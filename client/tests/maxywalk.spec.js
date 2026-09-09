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

  test('User Account panel renders correctly without error', async ({ page }) => {
    // Seed authenticated customer user in localStorage
    await page.addInitScript(() => {
      localStorage.setItem('maxywalk-auth', JSON.stringify({
        state: {
          user: { id: 'cust-123', email: 'customer@test.com', user_metadata: { name: 'Gowshigan' } },
          userProfile: { name: 'Gowshigan', role: 'customer', phone: '+91 98765 43210' },
          isAdmin: false,
          isLoading: false
        },
        version: 0
      }));
    });

    await page.goto('/account');

    // Verify Error Boundary was NOT triggered
    await expect(page.getByText('Something went wrong')).not.toBeVisible();

    // Verify Account page loaded
    await expect(page.getByRole('heading', { name: /My Account/i })).toBeVisible();
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expect(page.getByText('Total Orders')).toBeVisible();
    await expect(page.getByText('Active Orders')).toBeVisible();
  });

});
