import { test, expect } from '@playwright/test';
import { seedCustomerAuth, seedAdminAuth, clearAuth, DEMO_CUSTOMER } from './helpers.js';

test.describe('1. Authentication, Session Persistence & Security Suite', () => {

  test('1.1 Registration form validation: mismatched passwords and short password', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible({ timeout: 15000 });

    // Fill form with mismatched passwords
    await page.fill('input[placeholder="Your name"]', 'Test User');
    await page.fill('input[type="email"]', 'testmismatch@example.com');
    await page.fill('input[placeholder="Min. 6 characters"]', 'password123');
    await page.fill('input[placeholder="Repeat password"]', 'different123');
    await page.locator('button[type="submit"]').click({ force: true });

    // Should show error toast
    await expect(page.getByText('Passwords do not match.')).toBeVisible({ timeout: 5000 });

    // Fill with short password (< 6 chars)
    await page.fill('input[placeholder="Min. 6 characters"]', '12345');
    await page.fill('input[placeholder="Repeat password"]', '12345');
    await page.locator('button[type="submit"]').click({ force: true });

    // Browser HTML5 minLength prevents submit or toast indicates error
    const isValid = await page.locator('input[placeholder="Min. 6 characters"]').evaluate((el) => el.checkValidity());
    expect(isValid).toBe(false);
  });

  test('1.2 Login form validation: invalid credentials displays error toast', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible({ timeout: 15000 });

    // Fill with invalid credentials
    await page.fill('input[type="email"]', 'invalid_user_99999@example.com');
    await page.fill('input[type="password"]', 'wrongpassword999');
    await page.locator('button[type="submit"]').click({ force: true });

    // Wait for error response or toast
    await expect(page.locator('.toaster, [role="status"], div').filter({ hasText: /invalid|failed|error/i }).first()).toBeVisible({ timeout: 15000 });
  });

  test('1.3 Admin login redirects to admin dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible({ timeout: 15000 });

    await page.fill('input[type="email"]', 'admin@maxywalk.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.locator('button[type="submit"]').click({ force: true });

    // Verify redirected to /admin
    await expect(page).toHaveURL(/.*\/admin/, { timeout: 15000 });
    await expect(page.getByText(/Business Overview/i)).toBeVisible({ timeout: 15000 });
  });

  test('1.4 Customer session persistence: user remains logged in across navigation and page refresh', async ({ page }) => {
    await seedCustomerAuth(page);

    // Navigate to protected /account page
    await page.goto('/account');
    await expect(page.getByRole('heading', { name: /My Account/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(`Welcome back, ${DEMO_CUSTOMER.name.split(' ')[0]}!`)).toBeVisible();

    // Refresh the browser
    await page.reload();

    // Verify user is NOT logged out and remains on /account
    await expect(page).toHaveURL(/.*\/account/);
    await expect(page.getByRole('heading', { name: /My Account/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(`Welcome back, ${DEMO_CUSTOMER.name.split(' ')[0]}!`)).toBeVisible();

    // Navigate to /shop and return
    await page.goto('/shop');
    await expect(page.getByRole('heading', { name: /All Products/i }).or(page.getByText(/Catalogue/i)).first()).toBeVisible({ timeout: 15000 });

    await page.goto('/account');
    await expect(page).toHaveURL(/.*\/account/);
    await expect(page.getByText(`Welcome back, ${DEMO_CUSTOMER.name.split(' ')[0]}!`)).toBeVisible();
  });

  test('1.5 Explicit logout clears session and protects account page', async ({ page }) => {
    await seedCustomerAuth(page);

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: /My Account/i })).toBeVisible({ timeout: 15000 });

    // Click Sign Out button
    const signOutBtn = page.getByRole('button', { name: /Sign Out/i }).first();
    await expect(signOutBtn).toBeVisible();
    await signOutBtn.click();

    // Verify redirected to /login
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });

    // Mark auth cleared so init script does not re-add it
    await clearAuth(page);

    // Try navigating back to /account directly
    await page.goto('/account');

    // Protected route must redirect unauthenticated user to /login
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
  });

  test('1.6 Security & Role Boundaries: Customers and guests cannot access admin routes', async ({ page }) => {
    // 1. Guest visits /admin
    await page.goto('/admin');
    await expect(page).toHaveURL(/.*\/login/, { timeout: 15000 });

    // 2. Customer visits /admin
    await seedCustomerAuth(page);
    await page.goto('/admin');
    // AdminRoute redirects non-admin users to '/'
    await expect(page).toHaveURL(/^(?!.*\/admin).*$/, { timeout: 15000 });

    // 3. Customer visits /admin/products directly
    await page.goto('/admin/products');
    await expect(page).toHaveURL(/^(?!.*\/admin).*$/, { timeout: 15000 });

    // 4. Customer visits /admin/orders directly
    await page.goto('/admin/orders');
    await expect(page).toHaveURL(/^(?!.*\/admin).*$/, { timeout: 15000 });
  });

});
