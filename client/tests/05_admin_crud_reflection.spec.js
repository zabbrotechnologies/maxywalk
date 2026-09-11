import { test, expect } from '@playwright/test';
import { seedAdminAuth } from './helpers.js';

test.describe('5. Admin Management & Customer Reflection Suite', () => {

  test('5.1 Admin Dashboard displays business overview and KPI cards', async ({ page }) => {
    await seedAdminAuth(page);
    await page.goto('/admin');

    await expect(page.getByRole('heading', { name: /Business Overview/i })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Total Revenue')).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Total Orders')).toBeVisible();
    await expect(page.getByText('Customers').first()).toBeVisible();
  });

  test('5.2 Admin Product CRUD & immediate Customer-Facing Reflection', async ({ page }) => {
    test.setTimeout(90000);
    const testProductName = `Playwright Leather Oxford ${Date.now()}`;
    const testProductPrice = '2499';

    // ── STEP 1: Admin Creates Product ──────────────────────────────────────────
    await seedAdminAuth(page);
    await page.goto('/admin/products');

    await expect(page.getByRole('heading', { name: /Products/i }).first()).toBeVisible({ timeout: 15000 });

    // Click 'Add Product'
    const addProductBtn = page.getByRole('button', { name: /Add Product/i });
    await expect(addProductBtn).toBeVisible();
    await addProductBtn.click();

    // Fill Product form
    await page.locator('form div:has(> label:has-text("Product Name")) input').fill(testProductName);
    await page.locator('form textarea').fill('Special handcrafted Oxford leather shoe designed for premium durability.');
    await page.locator('form div:has(> label:has-text("Price")) input').fill(testProductPrice);

    // Save product
    await page.locator('form button[type="submit"]').click();

    // Confirm success toast
    await expect(page.locator('.toaster, [role="status"], div').filter({ hasText: /created|saved|success/i }).first()).toBeVisible({ timeout: 15000 });

    // Verify it appears in Admin list
    await expect(page.getByText(testProductName).first()).toBeVisible({ timeout: 15000 });

    // ── STEP 2: Verify in Customer Catalogue ────────────────────────────────────
    await page.goto('/shop');
    await page.waitForTimeout(1000);
    // Search or look for the newly created product
    await page.goto(`/shop?search=${encodeURIComponent(testProductName)}`);
    await expect(page.getByText(testProductName).first()).toBeVisible({ timeout: 20000 });

    // ── STEP 3: Admin Edits Product ────────────────────────────────────────────
    await seedAdminAuth(page);
    await page.goto('/admin/products');

    const productRow = page.locator('div.bg-white').filter({ hasText: testProductName }).first();
    await expect(productRow).toBeVisible({ timeout: 15000 });

    const editBtn = productRow.locator('button').filter({ hasText: /edit/i }).first();
    await editBtn.click();

    // Change price
    const updatedPrice = '2799';
    await page.locator('form div:has(> label:has-text("Price")) input').fill(updatedPrice);
    await page.locator('form button[type="submit"]').click();

    await expect(page.locator('.toaster, [role="status"], div').filter({ hasText: /updated|saved|success/i }).first()).toBeVisible({ timeout: 15000 });

    // ── STEP 4: Verify Updated Price in Customer Catalogue ─────────────────────
    await page.goto(`/shop?search=${encodeURIComponent(testProductName)}`);
    await expect(page.getByText('₹2,799').or(page.getByText('2799')).first()).toBeVisible({ timeout: 20000 });

    // ── STEP 5: Admin Deletes Product ──────────────────────────────────────────
    await seedAdminAuth(page);
    await page.goto('/admin/products');

    const productRowToDelete = page.locator('div.bg-white').filter({ hasText: testProductName }).first();
    await expect(productRowToDelete).toBeVisible({ timeout: 15000 });

    const deleteBtn = productRowToDelete.locator('button').filter({ hasText: /delete/i }).first();
    await deleteBtn.click();

    // Confirm deletion modal
    const confirmDeleteBtn = page.locator('.fixed button').filter({ hasText: /^Delete$/i });
    await expect(confirmDeleteBtn).toBeVisible({ timeout: 5000 });
    await confirmDeleteBtn.click();

    await expect(page.locator('.toaster, [role="status"], div').filter({ hasText: /deleted|removed/i }).first()).toBeVisible({ timeout: 15000 });
  });

  test('5.3 Admin Customers list renders registered customers with order history metrics', async ({ page }) => {
    await seedAdminAuth(page);
    await page.goto('/admin/customers');

    await expect(page.getByRole('heading', { name: /Customers/i }).first()).toBeVisible({ timeout: 15000 });
    // Verify table headers
    await expect(page.getByText('Name').first()).toBeVisible();
    await expect(page.getByText('Email').first()).toBeVisible();
    await expect(page.getByText('Total Spend').first()).toBeVisible();
  });

});
