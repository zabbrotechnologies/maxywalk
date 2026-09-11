/**
 * Reusable Playwright Test Helpers for MAXYWALK / Prabhu Traders
 */

export const BASE_URL = 'http://localhost:3000';

export const DEMO_ADMIN = {
  email: 'admin@maxywalk.com',
  password: 'admin123',
  name: 'MaxyWalk Admin',
};

export const DEMO_CUSTOMER = {
  id: 'cust-e2e-test',
  email: 'testcustomer@maxywalk.com',
  name: 'Rajesh Kumar',
  phone: '+91 98765 43210',
};

/**
 * Seed logged-in customer session directly into localStorage for fast, deterministic testing
 */
export async function seedCustomerAuth(page, customer = DEMO_CUSTOMER) {
  await page.addInitScript((cust) => {
    if (sessionStorage.getItem('__auth_cleared') === 'true') return;
    localStorage.setItem(
      'maxywalk-auth',
      JSON.stringify({
        state: {
          user: {
            id: cust.id,
            email: cust.email,
            user_metadata: { name: cust.name, phone: cust.phone },
          },
          userProfile: {
            name: cust.name,
            role: 'customer',
            phone: cust.phone,
          },
          isAdmin: false,
          isLoading: false,
        },
        version: 0,
      })
    );
  }, customer);
}

export async function clearAuth(page) {
  await page.evaluate(() => {
    sessionStorage.setItem('__auth_cleared', 'true');
    localStorage.removeItem('maxywalk-auth');
  });
}

/**
 * Seed logged-in admin session directly into localStorage
 */
export async function seedAdminAuth(page) {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__auth_cleared') === 'true') return;
    localStorage.setItem(
      'maxywalk-auth',
      JSON.stringify({
        state: {
          user: {
            id: 'admin-demo-id',
            email: 'admin@maxywalk.com',
            user_metadata: { name: 'MaxyWalk Admin' },
          },
          userProfile: {
            name: 'MaxyWalk Admin',
            role: 'admin',
            phone: '+91 94447 43465',
          },
          isAdmin: true,
          isLoading: false,
        },
        version: 0,
      })
    );
  });
}

/**
 * Seed cart items directly for checkout or cart testing
 */
export async function seedCart(page, items = []) {
  const defaultItems = [
    {
      cartKey: 'demo-cart-item-1',
      id: '2',
      name: 'Architectural Leather Mule',
      price: 1450,
      image: '/products/mule.png',
      selectedSize: '8',
      selectedColor: 'Onyx Black',
      qty: 1,
    },
  ];
  const activeItems = items.length ? items : defaultItems;

  await page.addInitScript((cartItems) => {
    localStorage.setItem(
      'maxywalk-user-carts',
      JSON.stringify({
        state: {
          activeUserKey: 'guest',
          items: cartItems,
          userCarts: {
            guest: cartItems,
          },
          isOpen: false,
        },
        version: 0,
      })
    );
  }, activeItems);
}
