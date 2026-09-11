import { test, expect } from '@playwright/test';
import { seedCustomerAuth, seedCart, seedAdminAuth, DEMO_CUSTOMER } from './helpers.js';

test.describe('4. Order Placement, Sync & Admin Fulfillment Lifecycle', () => {

  test('4.1 Checkout form validation catches missing and invalid contact / address inputs', async ({ page }) => {
    await seedCart(page);
    await page.goto('/checkout');

    await expect(page.getByText('Contact Information')).toBeVisible({ timeout: 15000 });

    // Try clicking Continue without filling required inputs
    const continueBtn = page.getByRole('button', { name: /Continue to Delivery/i });
    await continueBtn.click();

    // Verify validation toast appears
    await expect(page.locator('.toaster, [role="status"], div').filter({ hasText: /valid email|first name|address|mobile/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('4.2 Customer completes order → Admin inspects & updates status → Customer sees updated status', async ({ page }) => {
    test.setTimeout(90000);
    const testCustomerEmail = `e2e_buyer_${Date.now()}@maxywalk.com`;
    const testCustomerName = 'Karthik Raja';

    // ── STEP 1: Customer Places Order ──────────────────────────────────────────
    await seedCart(page);
    await page.goto('/checkout');

    await expect(page.getByText('Contact Information')).toBeVisible({ timeout: 15000 });

    // Fill contact information
    await page.fill('input[type="email"]', testCustomerEmail);
    await page.fill('input[type="tel"]', '9444743465');

    // Fill delivery address
    await page.locator('div:has(> label:has-text("First Name")) input').fill('Karthik');
    await page.locator('div:has(> label:has-text("Last Name")) input').fill('Raja');
    await page.locator('div:has(> label:has-text("House / Street / Landmark")) input').fill('124, M.T.H. Road, Avadi');
    await page.locator('div:has(> label:has-text("City")) input').fill('Chennai');
    await page.locator('div:has(> label:has-text("Pincode")) input').fill('600054');

    // Step 1 -> Step 2
    await page.getByRole('button', { name: /Continue to Delivery/i }).click();

    // Step 2 -> Step 3
    await expect(page.getByText('Choose Shipping Method')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Continue to Payment/i }).click();

    // Step 3: Cash on Delivery payment
    await expect(page.getByText(/Cash on Delivery/i).first()).toBeVisible({ timeout: 5000 });
    const placeOrderBtn = page.getByRole('button', { name: /Confirm COD Order/i });
    await expect(placeOrderBtn).toBeVisible({ timeout: 10000 });
    await placeOrderBtn.click();

    // Verify Order Confirmed screen
    await expect(page.getByRole('heading', { name: /Order Confirmed!/i })).toBeVisible({ timeout: 20000 });

    // Capture the generated Order ID
    const orderIdLocator = page.locator('text=MW-').first();
    await expect(orderIdLocator).toBeVisible({ timeout: 10000 });
    const fullOrderText = await orderIdLocator.innerText();
    const placedOrderId = fullOrderText.trim();
    console.log('Placed Order ID:', placedOrderId);
    expect(placedOrderId).toContain('MW-');

    // ── STEP 2: Customer Account Order History ──────────────────────────────────
    // Seed auth session for this buyer email
    await page.addInitScript(({ email, name }) => {
      localStorage.setItem('maxywalk-auth', JSON.stringify({
        state: {
          user: { id: `user-${Date.now()}`, email, user_metadata: { name } },
          userProfile: { name, role: 'customer' },
          isAdmin: false,
          isLoading: false
        },
        version: 0
      }));
    }, { email: testCustomerEmail, name: testCustomerName });

    await page.goto('/account?tab=orders');
    await expect(page.getByRole('heading', { name: /My Account/i })).toBeVisible({ timeout: 15000 });
    // Verify the placed order appears in orders tab
    await expect(page.getByText(placedOrderId).first()).toBeVisible({ timeout: 20000 });

    // ── STEP 3: Admin inspects order & updates status ───────────────────────────
    await seedAdminAuth(page);
    await page.goto('/admin/orders');

    await expect(page.getByRole('heading', { name: /Customer Orders/i })).toBeVisible({ timeout: 15000 });

    // Locate the order card in Admin
    const adminOrderCard = page.locator('.bg-white').filter({ hasText: placedOrderId }).first();
    await expect(adminOrderCard).toBeVisible({ timeout: 20000 });

    // Expand details
    const expandBtn = adminOrderCard.locator('button').filter({ hasText: /Manage|Close/i }).first();
    await expandBtn.click();

    // Verify customer contact & items are visible
    await expect(adminOrderCard.getByText(/Customer & Contact/i)).toBeVisible();
    await expect(adminOrderCard.getByText('Karthik Raja').first()).toBeVisible();

    // Update order status to 'confirmed'
    const confirmStatusBtn = adminOrderCard.getByRole('button', { name: 'confirmed' }).first();
    await expect(confirmStatusBtn).toBeVisible();
    await confirmStatusBtn.click();

    // Toast notification confirmation
    await expect(page.locator('.toaster, [role="status"], div').filter({ hasText: /status set to: confirmed/i }).first()).toBeVisible({ timeout: 10000 });

    // ── STEP 4: Customer sees updated status ───────────────────────────────────
    await page.addInitScript(({ email, name }) => {
      localStorage.setItem('maxywalk-auth', JSON.stringify({
        state: {
          user: { id: `user-${Date.now()}`, email, user_metadata: { name } },
          userProfile: { name, role: 'customer' },
          isAdmin: false,
          isLoading: false
        },
        version: 0
      }));
    }, { email: testCustomerEmail, name: testCustomerName });

    await page.goto('/account?tab=orders');
    await expect(page.getByRole('heading', { name: /My Account/i })).toBeVisible({ timeout: 15000 });
    
    // Status in customer order card must now show 'confirmed'
    const customerOrderCard = page.locator('.border').filter({ hasText: placedOrderId }).first();
    await expect(customerOrderCard).toBeVisible({ timeout: 20000 });
    await expect(customerOrderCard.getByText(/confirmed/i).first()).toBeVisible({ timeout: 10000 });
  });

});
