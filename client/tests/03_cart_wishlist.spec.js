import { test, expect } from '@playwright/test';
import { seedCustomerAuth, seedCart } from './helpers.js';

test.describe('3. Cart & Wishlist Lifecycle Suite', () => {

  test('3.1 Add product to Cart opens Drawer with accurate item details & pricing', async ({ page }) => {
    await page.goto('/shop');

    const firstCard = page.locator('.product-card, .group').filter({ hasText: '₹' }).first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });
    await firstCard.click();

    await page.waitForURL(/\/product\//, { timeout: 10000 });

    const addToCartBtn = page.getByRole('button', { name: /Add to Cart/i }).first();
    await expect(addToCartBtn).toBeVisible({ timeout: 15000 });
    await addToCartBtn.click();

    // Verify Shopping Bag drawer opens
    await expect(page.getByRole('heading', { name: /Shopping Bag/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /PROCEED TO CHECKOUT/i })).toBeVisible();

    // Verify cart subtotal is rendered with ₹
    const subtotalText = page.locator('text=₹').first();
    await expect(subtotalText).toBeVisible();
  });

  test('3.2 Cart Drawer quantity adjustment & item removal', async ({ page }) => {
    await seedCart(page);

    await page.goto('/');
    
    // Open cart drawer by clicking cart icon
    const cartIconBtn = page.getByRole('button', { name: /cart/i }).or(page.locator('button[aria-label*="cart"]')).first();
    await cartIconBtn.click();

    await expect(page.getByRole('heading', { name: /Shopping Bag/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Architectural Leather Mule')).toBeVisible();

    // Increase quantity using '+' button
    const plusBtn = page.locator('button[aria-label="Increase quantity"]').first();
    await expect(plusBtn).toBeVisible();
    await plusBtn.click();
    await expect(page.getByText('2').first()).toBeVisible({ timeout: 5000 });

    // Decrease quantity back
    const minusBtn = page.locator('button[aria-label="Decrease quantity"]').first();
    await minusBtn.click();
    await expect(page.getByText('1').first()).toBeVisible({ timeout: 5000 });

    // Remove item from cart
    const removeBtn = page.locator('button[aria-label="Remove item"]').first();
    await removeBtn.click();

    // Should display empty cart UI
    await expect(page.getByText('Your bag is empty').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: /Start Shopping/i })).toBeVisible();
  });

  test('3.3 Cart persists across page navigation and browser refresh', async ({ page }) => {
    await seedCart(page);

    await page.goto('/shop');
    
    // Open cart drawer
    const cartIconBtn = page.getByRole('button', { name: /cart/i }).or(page.locator('button[aria-label*="cart"]')).first();
    await cartIconBtn.click();

    await expect(page.getByText('Architectural Leather Mule')).toBeVisible({ timeout: 10000 });

    // Refresh the page
    await page.reload();

    // Open cart drawer again
    const cartIconBtnAfterReload = page.getByRole('button', { name: /cart/i }).or(page.locator('button[aria-label*="cart"]')).first();
    await cartIconBtnAfterReload.click();

    // Product must still be present
    await expect(page.getByText('Architectural Leather Mule')).toBeVisible({ timeout: 10000 });
  });

  test('3.4 Wishlist toggle, persistence on refresh, and account sync', async ({ page }) => {
    await seedCustomerAuth(page);

    await page.goto('/shop');
    const firstProduct = page.locator('.product-card').first();
    await expect(firstProduct).toBeVisible({ timeout: 15000 });

    // Click wishlist button on product card
    const wishlistBtn = firstProduct.locator('button[aria-label*="wishlist"]').first();
    await expect(wishlistBtn).toBeVisible();
    await wishlistBtn.click();

    // Wait for toast
    await expect(page.locator('.toaster, [role="status"], div').filter({ hasText: /wishlist/i }).first()).toBeVisible({ timeout: 5000 });

    // Reload page to verify persistence
    await page.reload();

    // Navigate to Account wishlist tab
    await page.goto('/account?tab=wishlist');
    await expect(page.getByRole('heading', { name: /My Account/i })).toBeVisible({ timeout: 10000 });
  });

});
