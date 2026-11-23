import axios from 'axios';
import { sortSizes } from './utils.js';
import { FALLBACK_PRODUCTS } from '../data/fallbackProducts.js';

// Express API configuration backed exclusively by Neon PostgreSQL
// Relative '/api' works seamlessly through Vite proxy in dev and Vercel serverless in prod
let API_URL = import.meta.env?.VITE_API_URL || '/api';
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  if (API_URL.includes('localhost') || API_URL.includes('127.0.0.1')) {
    API_URL = '/api';
  }
}
export const api = axios.create({ baseURL: API_URL, timeout: 8000, withCredentials: true });

// Attach Bearer token from localStorage for seamless session transport across domains/browsers
api.interceptors.request.use((config) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const authRaw = window.localStorage.getItem('maxywalk-auth');
      if (authRaw) {
        const parsed = JSON.parse(authRaw);
        const token = parsed?.state?.token;
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
  } catch {}
  return config;
});

// Lightweight in-memory cache for speed
const cache = new Map();
const CACHE_TTL_MS = 60 * 1000;

function getCached(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.time > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCached(key, data) {
  cache.set(key, { data, time: Date.now() });
}

export function clearApiCache() {
  cache.clear();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('maxywalk-cache-sync', Date.now().toString());
    }
  } catch {}
}

export const DEFAULT_EXCLUSIVE_PRODUCT = {
  id: 'urbanedge-pro',
  name: 'UrbanEdge Pro',
  tagline: 'STEP INTO EXCLUSIVITY',
  description: 'A refined blend of style, comfort and durability — made for those who choose more.',
  price: 4999,
  original_price: 6499,
  category: 'slippers',
  stock: 50,
  featured: true,
  is_exclusive: true,
  material: 'Full-Grain Leather',
  badge: 'Exclusive',
  rating: 5.0,
  review_count: 48,
  created_at: '2026-01-01T00:00:00Z',
  sizes: ['6', '7', '8', '9', '10', '11'],
  colors: ['Black', 'Maroon', 'Sandal / Wood', 'Light Blue', 'Grey', 'Olive Green', 'Rose', 'Light Pink'],
  images: [
    '/products/exclusive/black.png',
    '/products/exclusive/maroon.png'
  ],
  variants: [
    {
      id: 'black',
      name: 'Black',
      label: 'Black',
      image: '/products/exclusive/black.png',
      colorHex: '#1F1E1D',
      hex: '#1F1E1D',
    },
    {
      id: 'maroon',
      name: 'Maroon',
      label: 'Maroon',
      image: '/products/exclusive/maroon.png',
      colorHex: '#5A2328',
      hex: '#5A2328',
    },
    {
      id: 'sandal-wood',
      name: 'Sandal / Wood',
      label: 'Sandal / Wood',
      image: '/products/exclusive/sandal_wood.png',
      colorHex: '#C28B53',
      hex: '#C28B53',
    },
    {
      id: 'lightblue',
      name: 'Light Blue',
      label: 'Light Blue',
      image: '/products/exclusive/lightblue.png',
      colorHex: '#88A0B5',
      hex: '#88A0B5',
    },
    {
      id: 'grey',
      name: 'Grey',
      label: 'Grey',
      image: '/products/exclusive/gray.png',
      colorHex: '#6E6C6B',
      hex: '#6E6C6B',
    },
    {
      id: 'olivegreen',
      name: 'Olive Green',
      label: 'Olive Green',
      image: '/products/exclusive/olivegreen.png',
      colorHex: '#535D4A',
      hex: '#535D4A',
    },
    {
      id: 'rose',
      name: 'Rose',
      label: 'Rose',
      image: '/products/exclusive/rose.png',
      colorHex: '#B85B64',
      hex: '#B85B64',
    },
    {
      id: 'lightpink',
      name: 'Light Pink',
      label: 'Light Pink',
      image: '/products/exclusive/lightpink.png',
      colorHex: '#D8A0A6',
      hex: '#D8A0A6',
    }
  ]
};

export function naturalCompare(aStr = '', bStr = '') {
  const cleanA = String(aStr || '').trim().replace(/\s+/g, ' ');
  const cleanB = String(bStr || '').trim().replace(/\s+/g, ' ');

  const ax = [];
  const bx = [];

  cleanA.replace(/(\d+)|(\D+)/g, (_, $1, $2) => {
    ax.push([$1 ? Number($1) : Infinity, $2 ? $2.toLowerCase() : '']);
  });

  cleanB.replace(/(\d+)|(\D+)/g, (_, $1, $2) => {
    bx.push([$1 ? Number($1) : Infinity, $2 ? $2.toLowerCase() : '']);
  });

  while (ax.length && bx.length) {
    const an = ax.shift();
    const bn = bx.shift();
    if (an[0] !== Infinity || bn[0] !== Infinity) {
      if (an[0] !== bn[0]) {
        return an[0] - bn[0];
      }
    }
    const strDiff = an[1].localeCompare(bn[1], undefined, { sensitivity: 'base' });
    if (strDiff !== 0) return strDiff;
  }

  return ax.length - bx.length;
}

export function compareProducts(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  // 1. Exclusive product priority (UrbanEdge Pro / is_exclusive)
  const aEx = a.id === 'urbanedge-pro' || a.is_exclusive || a.isExclusive ? 1 : 0;
  const bEx = b.id === 'urbanedge-pro' || b.is_exclusive || b.isExclusive ? 1 : 0;
  if (aEx !== bEx) return bEx - aEx;

  // 2. Featured priority
  const aFeat = a.featured ? 1 : 0;
  const bFeat = b.featured ? 1 : 0;
  if (aFeat !== bFeat) return bFeat - aFeat;

  // 3. Natural alphanumeric sort by product name / code
  const nameDiff = naturalCompare(a.name || '', b.name || '');
  if (nameDiff !== 0) return nameDiff;

  // 4. Stable tie-breaker by created_at (older first)
  const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
  if (aTime !== bTime) return aTime - bTime;

  // 5. Final fallback to ID
  return String(a.id || '').localeCompare(String(b.id || ''));
}

export const getProducts = async (params = {}) => {
  const cacheKey = `products_${JSON.stringify(params)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await api.get('/products', { params });
    const list = (res.data?.products || []).map((p) => ({
      ...p,
      sizes: sortSizes(p.sizes)
    }));

    const result = { products: list, total: res.data?.total || list.length };
    setCached(cacheKey, result);
    return result;
  } catch (err) {
    console.warn('Backend unavailable, using local fallback products catalog:', err.message);
    let list = [...FALLBACK_PRODUCTS];

    if (params.category && params.category !== 'all') {
      list = list.filter((p) => p.category === params.category);
    }
    if (params.featured === 'true' || params.featured === true) {
      list = list.filter((p) => p.featured);
    }

    list = list.map((p) => ({ ...p, sizes: sortSizes(p.sizes) }));
    list.sort(compareProducts);

    const result = { products: list, total: list.length };
    setCached(cacheKey, result);
    return result;
  }
};

export const getProduct = async (id) => {
  if (id === 'urbanedge-pro') {
    return { ...DEFAULT_EXCLUSIVE_PRODUCT, sizes: sortSizes(DEFAULT_EXCLUSIVE_PRODUCT.sizes) };
  }

  const cacheKey = `product_${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await api.get(`/products/${id}`);
    if (res.data) {
      const formatted = { ...res.data, sizes: sortSizes(res.data.sizes) };
      setCached(cacheKey, formatted);
      return formatted;
    }
  } catch (err) {
    console.warn(`Backend unavailable for product ${id}, using fallback:`, err.message);
    const fallback = FALLBACK_PRODUCTS.find((p) => p.id === id);
    if (fallback) {
      const formatted = { ...fallback, sizes: sortSizes(fallback.sizes) };
      setCached(cacheKey, formatted);
      return formatted;
    }
  }

  return null;
};

export const createProduct = async (data) => {
  clearApiCache();
  const res = await api.post('/products', data);
  return res.data;
};

export const updateProduct = async (id, data) => {
  clearApiCache();
  const res = await api.put(`/products/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id) => {
  clearApiCache();
  const res = await api.delete(`/products/${id}`);
  return res.data;
};

// Orders API
export const createOrder = async (orderData) => {
  const shippingAddr = orderData.shipping_address || orderData.shippingAddress || {};
  const payload = {
    ...orderData,
    shipping_address: shippingAddr,
    shippingAddress: shippingAddr,
    user_email: orderData.user_email || orderData.userEmail || shippingAddr.email,
    userEmail: orderData.user_email || orderData.userEmail || shippingAddr.email,
    payment_method: orderData.payment_method || orderData.paymentMethod || 'razorpay',
    paymentMethod: orderData.payment_method || orderData.paymentMethod || 'razorpay'
  };
  const res = await api.post('/orders', payload);
  return res.data;
};

export const placeOrder = createOrder;

export const createRazorpayOrder = async (orderData) => {
  const res = await api.post('/orders/razorpay/create-order', orderData);
  return res.data;
};

export const createStandardRazorpayOrder = async (amountInPaise, currency = 'INR', receipt = null) => {
  const res = await api.post('/create-order', { amount: amountInPaise, currency, receipt });
  return res.data;
};

export const verifyRazorpayPayment = async (paymentData) => {
  const res = await api.post('/verify-payment', paymentData);
  return res.data;
};

export const getOrder = async (id) => {
  const res = await api.get(`/orders/${id}`);
  return res.data;
};

export const getMyOrders = async (emailOrUser) => {
  const email = typeof emailOrUser === 'string' ? emailOrUser : (emailOrUser?.email || '');
  if (!email) return [];
  const res = await api.get('/orders/my-orders', { params: { email } });
  return Array.isArray(res.data) ? res.data : (res.data?.orders || []);
};

export const getAllOrders = async (params = {}) => {
  const res = await api.get('/orders', {
    params,
    headers: { 'x-admin-request': 'true' }
  });
  if (Array.isArray(res.data)) {
    return { orders: res.data, total: res.data.length };
  }
  return {
    orders: res.data?.orders || [],
    total: res.data?.total || 0,
    page: res.data?.page || 1,
    totalPages: res.data?.totalPages || 1
  };
};

export const updateOrderStatus = async (id, status) => {
  clearApiCache();
  const res = await api.put(`/orders/${id}`, { status }, {
    headers: { 'x-admin-request': 'true' }
  });
  return res.data;
};

export const getAllCustomers = async (params = {}) => {
  const res = await api.get('/customers', {
    params,
    headers: { 'x-admin-request': 'true' }
  });
  if (Array.isArray(res.data)) {
    return { customers: res.data, total: res.data.length };
  }
  return {
    customers: res.data?.customers || [],
    total: res.data?.total || 0,
    page: res.data?.page || 1,
    totalPages: res.data?.totalPages || 1
  };
};

export const getOrderStats = async (dateRange = null) => {
  const res = await api.get('/orders/stats', {
    params: { dateRange },
    headers: { 'x-admin-request': 'true' }
  });
  return res.data;
};

export const getUserProfile = async (email) => {
  try {
    if (email) {
      const res = await api.get('/customers/profile', { params: { email } });
      if (res.data && res.data.email) return res.data;
    }
    const res = await api.get('/auth/me');
    return res.data?.user || null;
  } catch {
    return null;
  }
};

export const updateUserProfile = async (data) => {
  const res = await api.put('/customers/profile', data);
  return res.data;
};

// Authentication helpers
export const signIn = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const signUp = async (email, password, name, phone) => {
  const res = await api.post('/auth/register', { email, password, name, phone });
  return res.data;
};

export const signInWithGoogle = async (credential) => {
  const res = await api.post('/auth/google', { credential });
  return res.data;
};

export const signOut = async () => {
  const res = await api.post('/auth/logout');
  return res.data;
};


// Email Management API (Admin only)
export const getEmailOverview = async () => {
  const res = await api.get('/admin/emails/overview', {
    headers: { 'x-admin-request': 'true' }
  });
  return res.data;
};

export const getEmailCampaigns = async () => {
  const res = await api.get('/admin/emails/campaigns', {
    headers: { 'x-admin-request': 'true' }
  });
  return res.data?.campaigns || [];
};

export const getEmailHistory = async (params = {}) => {
  const res = await api.get('/admin/emails/history', {
    params,
    headers: { 'x-admin-request': 'true' }
  });
  return res.data;
};

export const retryFailedEmail = async (id) => {
  const res = await api.post(`/admin/emails/retry/${id}`, {}, {
    headers: { 'x-admin-request': 'true' }
  });
  return res.data;
};

export const processEmailQueueNow = async (batchSize = 25) => {
  const res = await api.post('/admin/emails/process-queue', { batch_size: batchSize }, {
    headers: { 'x-admin-request': 'true' }
  });
  return res.data;
};

export const testEmailConnection = async (toEmail = null) => {
  const res = await api.post('/admin/emails/test-smtp', { to: toEmail }, {
    headers: { 'x-admin-request': 'true' }
  });
  return res.data;
};

export default api;
