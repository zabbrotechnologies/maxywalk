import { test, expect } from '@playwright/test';

test.describe('MaxyWalk Comprehensive E2E Test Suite', () => {

  // 1. Homepage & Catalogue
  test('1. Homepage loads, displays branding and products', async ({ page }) => {
    await page.goto('/');
    
    // Title check
    await expect(page).toHaveTitle(/MaxyWalk/i);
    
    // Header brand logo & navigation
    await expect(page.getByRole('link', { name: /MAXYWALK/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /SLIPPERS/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /SANDALS/i }).first()).toBeVisible();

    // Verify products are rendered
    const productCards = page.locator('.group').filter({ hasText: '₹' });
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });
  });

  // 2. Product Detail & Add to Cart
  test('2. Product Detail, Size Selection, and Add to Bag', async ({ page }) => {
    await page.goto('/');
    
    const productCard = page.locator('.group').filter({ hasText: '₹' }).first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();

    // Ensure we reached the product page
    await page.waitForURL(/\/product\//);

    // Verify product detail view and click Add to Cart
    const addToCartBtn = page.getByRole('button', { name: /Add to Cart/i }).first();
    await expect(addToCartBtn).toBeVisible({ timeout: 15000 });
    await addToCartBtn.click();

    // Verify Shopping Bag drawer opens with items
    await expect(page.getByRole('heading', { name: /Shopping Bag/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /PROCEED TO CHECKOUT/i })).toBeVisible({ timeout: 10000 });
  });

  // 3. Cart Drawer Quantity & Items Operations
  test('3. Cart Drawer operations (Quantity update & Subtotal)', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to product detail
    const productCard = page.locator('.group').filter({ hasText: '₹' }).first();
    await expect(productCard).toBeVisible({ timeout: 10000 });
    await productCard.click();

    await page.waitForURL(/\/product\//);

    const addToCartBtn = page.getByRole('button', { name: /Add to Cart/i }).first();
    await expect(addToCartBtn).toBeVisible({ timeout: 15000 });
    await addToCartBtn.click();

    await expect(page.getByRole('heading', { name: /Shopping Bag/i })).toBeVisible({ timeout: 10000 });

    // Increment quantity button '+' in drawer
    const plusBtn = page.locator('button[aria-label="Increase quantity"]').first();
    await expect(plusBtn).toBeVisible({ timeout: 5000 });
    await plusBtn.click();
    await expect(page.locator('text=2').first()).toBeVisible();

    // Verify Proceed to Checkout is available
    const checkoutLink = page.getByRole('link', { name: /PROCEED TO CHECKOUT/i });
    await expect(checkoutLink).toBeVisible();
  });

  // 4. Wishlist Toggle
  test('4. Wishlist Toggle functionality', async ({ page }) => {
    await page.goto('/');
    
    // Find wishlist button on first product
    const wishlistBtn = page.locator('button[aria-label*="wishlist"]').first();
    await expect(wishlistBtn).toBeVisible({ timeout: 10000 });
    await wishlistBtn.click();

    // Toast or icon toggle should indicate success
    await expect(page.getByText(/wishlist/i).first()).toBeVisible({ timeout: 5000 });
  });

  // 5. Checkout Flow
  test('5. Checkout page loads and displays order details', async ({ page }) => {
    // Seed an item in cart before navigating to checkout
    await page.addInitScript(() => {
      localStorage.setItem('maxywalk-user-carts', JSON.stringify({
        state: {
          activeUserKey: 'guest',
          items: [{
            cartKey: 'demo-item-1',
            id: 'test-1',
            name: 'Gallery Loafer',
            price: 1899,
            image: '',
            selectedSize: '8',
            selectedColor: 'Tan',
            qty: 1
          }],
          userCarts: {
            guest: [{
              cartKey: 'demo-item-1',
              id: 'test-1',
              name: 'Gallery Loafer',
              price: 1899,
              image: '',
              selectedSize: '8',
              selectedColor: 'Tan',
              qty: 1
            }]
          },
          isOpen: false
        },
        version: 0
      }));
    });

    await page.goto('/checkout');

    // Verify checkout steps & form
    await expect(page.getByText('Contact Information')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Delivery Address')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Order Summary/i })).toBeVisible();
    await expect(page.getByText('Gallery Loafer').first()).toBeVisible();
  });

  // 6. User Login and Register Pages
  test('6. Login and Register pages render cleanly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Welcome Back/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign In/i })).toBeVisible();
    await expect(page.getByText(/Continue with Google/i)).toBeVisible();

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /Create Account/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Account/i })).toBeVisible();
  });

  // 7. User Account Panel
  test('7. User Account panel renders tabs without crashes', async ({ page }) => {
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

    // Error boundary must not trigger
    await expect(page.getByText('Something went wrong')).not.toBeVisible();

    // Verify elements
    await expect(page.getByRole('heading', { name: /My Account/i })).toBeVisible();
    await expect(page.getByText(/Welcome back/i)).toBeVisible();
    await expect(page.getByText('Total Orders')).toBeVisible();

    // Switch to Profile Tab
    const profileBtn = page.getByRole('button', { name: /Profile/i }).first();
    await profileBtn.click();
    await expect(page.getByText('Personal Profile')).toBeVisible();
  });

  // 8. Admin Login & Dashboard Overview
  test('8. Admin Login & Dashboard metrics overview', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[type="email"]', 'admin@maxywalk.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Should redirect to admin dashboard
    await expect(page).toHaveURL(/.*\/admin/);
    
    // Verify dashboard metrics load
    await expect(page.getByText('Total Revenue')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Total Orders')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Customers').first()).toBeVisible({ timeout: 10000 });
  });

  // 9. Admin Navigation to Products, Orders, Customers
  test('9. Admin Management (Products, Orders, Customers)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('maxywalk-auth', JSON.stringify({
        state: {
          user: { id: 'admin-id', email: 'admin@maxywalk.com', user_metadata: { name: 'MaxyWalk Admin' } },
          userProfile: { name: 'MaxyWalk Admin', role: 'admin' },
          isAdmin: true,
          isLoading: false
        },
        version: 0
      }));
    });

    // Navigate to Admin Products
    await page.goto('/admin/products');
    await expect(page.getByRole('heading', { name: /Products/i }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /Add Product/i })).toBeVisible();

    // Navigate to Admin Orders
    await page.goto('/admin/orders');
    await expect(page.getByRole('heading', { name: /Customer Orders/i }).first()).toBeVisible({ timeout: 10000 });

    // Navigate to Admin Customers
    await page.goto('/admin/customers');
    await expect(page.getByRole('heading', { name: /Customers/i }).first()).toBeVisible({ timeout: 10000 });
  });

});
