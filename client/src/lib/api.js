import axios from 'axios';
import { supabase } from './supabaseClient.js';

// Legacy Axios configuration (kept for backwards compatibility if needed)
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001/api' : '/api');
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

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

function getDateCutoff(filterName) {
  if (!filterName || filterName === 'all' || filterName === 'All') return null;
  const now = new Date();
  if (filterName === 'Today') {
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  }
  if (filterName === '7 Days') {
    now.setDate(now.getDate() - 7);
    return now.toISOString();
  }
  if (filterName === '30 Days') {
    now.setDate(now.getDate() - 30);
    return now.toISOString();
  }
  if (filterName === '1 Year') {
    now.setFullYear(now.getFullYear() - 1);
    return now.toISOString();
  }
  return null;
}

export function clearApiCache() {
  cache.clear();
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('maxywalk-cache-sync', Date.now().toString());
    }
  } catch {}
}

// -----------------------------------------------------------------
// SUPABASE MIGRATION: DATA LAYER
// -----------------------------------------------------------------

export const DEFAULT_EXCLUSIVE_PRODUCT = {
  id: 'urbanedge-pro',
  name: 'UrbanEdge Pro',
  tagline: 'STEP INTO EXCLUSIVITY',
  description: 'A refined blend of style, comfort and durability — made for those who choose more.',
  price: 4999,
  original_price: 6499,
  category: 'sandals',
  stock: 8,
  material: 'Full-Grain Leather',
  badge: 'LIMITED EDITION',
  featured: true,
  is_exclusive: true,
  isExclusive: true,
  images: [
    '/products/exclusive/black.png',
    '/products/exclusive/maroon.png',
    '/products/exclusive/sandal_wood.png',
    '/products/exclusive/lightblue.png',
    '/products/exclusive/gray.png',
    '/products/exclusive/olivegreen.png',
    '/products/exclusive/rose.png',
    '/products/exclusive/lightpink.png',
  ],
  sizes: ['6', '7', '8', '9', '10', '11'],
  colors: [
    'Black',
    'Maroon',
    'Sandal / Wood',
    'Light Blue',
    'Grey',
    'Olive Green',
    'Rose',
    'Light Pink'
  ],
  variants: [
    { id: 'black', name: 'Black', image: '/products/exclusive/black.png', colorHex: '#1F1E1D' },
    { id: 'maroon', name: 'Maroon', image: '/products/exclusive/maroon.png', colorHex: '#5A2328' },
    { id: 'sandal-wood', name: 'Sandal / Wood', image: '/products/exclusive/sandal_wood.png', colorHex: '#C28B53' },
    { id: 'lightblue', name: 'Light Blue', image: '/products/exclusive/lightblue.png', colorHex: '#88A0B5' },
    { id: 'grey', name: 'Grey', image: '/products/exclusive/gray.png', colorHex: '#6E6C6B' },
    { id: 'olivegreen', name: 'Olive Green', image: '/products/exclusive/olivegreen.png', colorHex: '#535D4A' },
    { id: 'rose', name: 'Rose', image: '/products/exclusive/rose.png', colorHex: '#B85B64' },
    { id: 'lightpink', name: 'Light Pink', image: '/products/exclusive/lightpink.png', colorHex: '#D6A29C' }
  ]
};

export const getProducts = async (params = {}) => {
  const cacheKey = `products_${JSON.stringify(params)}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  let query = supabase.from('products').select('*');
  
  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category);
  }
  if (params.featured === true || params.featured === 'true') {
    query = query.eq('featured', true);
  }
  if (params.exclusive === true || params.exclusive === 'true') {
    query = query.eq('is_exclusive', true);
  }

  const { data, error } = await query;
  
  let list = Array.isArray(data) ? [...data] : [];

  if (error) {
    console.warn('Supabase getProducts error/fallback:', error);
  }

  // Ensure urbanedge-pro exclusive product exists in list if not returned by database
  const hasExclusive = list.some((p) => p.id === 'urbanedge-pro' || p.is_exclusive || p.isExclusive);
  if (!hasExclusive) {
    if (!params.category || params.category === 'all' || params.category === 'sandals') {
      list.unshift(DEFAULT_EXCLUSIVE_PRODUCT);
    }
  }

  if (params.exclusive === true || params.exclusive === 'true') {
    list = list.filter((p) => p.is_exclusive || p.isExclusive || p.id === 'urbanedge-pro');
  }

  if (params.sort === 'price_asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (params.sort === 'price_desc') {
    list.sort((a, b) => b.price - a.price);
  }

  const result = { products: list, total: list.length };
  setCached(cacheKey, result);
  return result;
};

export const getProduct = async (id) => {
  if (id === 'urbanedge-pro') {
    const { data } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (data) return { ...DEFAULT_EXCLUSIVE_PRODUCT, ...data };
    return DEFAULT_EXCLUSIVE_PRODUCT;
  }

  const cacheKey = `product_${id}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) {
    console.error(`Supabase getProduct ${id} error:`, error);
    return null;
  }
  
  setCached(cacheKey, data);
  return data;
};

const ALLOWED_PRODUCT_KEYS = [
  'id', 'name', 'description', 'category', 'price', 'original_price',
  'sizes', 'colors', 'images', 'stock', 'featured', 'material',
  'badge', 'rating', 'review_count', 'created_at'
];

function sanitizeProductData(data) {
  const clean = {};
  for (const key of ALLOWED_PRODUCT_KEYS) {
    if (data[key] !== undefined && data[key] !== null) {
      clean[key] = data[key];
    }
  }
  return clean;
}

export const createProduct = async (data) => {
  clearApiCache();
  const cleanData = sanitizeProductData(data);
  const newProduct = {
    id: cleanData.id || `custom-${Date.now()}`,
    ...cleanData,
    created_at: new Date().toISOString()
  };
  
  const { data: insertedData, error } = await supabase.from('products').insert([newProduct]).select().single();
  if (error) {
    console.error('Supabase createProduct error:', error);
    throw error;
  }
  return { ...data, ...insertedData };
};

export const updateProduct = async (id, data) => {
  clearApiCache();
  const cleanData = sanitizeProductData(data);
  
  const { data: updatedData, error } = await supabase
    .from('products')
    .update(cleanData)
    .eq('id', id)
    .select();

  if (error) {
    console.error(`Supabase updateProduct ${id} error:`, error);
    throw error;
  }

  if (!updatedData || updatedData.length === 0) {
    const upsertPayload = { id, ...cleanData };
    const { data: upsertedData, error: upsertErr } = await supabase
      .from('products')
      .upsert([upsertPayload])
      .select()
      .single();
      
    if (upsertErr) {
      console.error(`Supabase updateProduct (upsert) ${id} error:`, upsertErr);
      throw upsertErr;
    }
    return { ...data, ...upsertedData };
  }

  return { ...data, ...updatedData[0] };
};

export const deleteProduct = async (id) => {
  clearApiCache();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    console.error(`Supabase deleteProduct ${id} error:`, error);
    throw error;
  }
  return { message: 'Product deleted' };
};

export const placeOrder = async (data) => {
  clearApiCache();
  const orderId = `MW-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
  const newOrder = {
    id: `order-${Date.now()}`,
    order_id: orderId,
    user_email: data.shippingAddress?.email?.toLowerCase().trim() || 'guest',
    items: data.items || [],
    total: data.total || 0,
    shipping_address: data.shippingAddress || {},
    payment_method: data.paymentMethod || 'cod',
    status: 'pending',
    created_at: new Date().toISOString()
  };

  const { data: insertedOrder, error } = await supabase.from('orders').insert([newOrder]).select().single();
  if (error) {
    console.error('Supabase placeOrder error:', error);
    throw error;
  }

  // Silently decrement stock for ordered items
  if (Array.isArray(data.items) && data.items.length > 0) {
    Promise.all(data.items.map(async (item) => {
      try {
        const prodId = item.productId || item.id;
        const qty = Number(item.qty) || 1;
        if (!prodId) return;
        const { data: prod } = await supabase.from('products').select('stock').eq('id', prodId).single();
        if (prod && typeof prod.stock === 'number') {
          const newStock = Math.max(0, prod.stock - qty);
          await supabase.from('products').update({ stock: newStock }).eq('id', prodId);
        }
      } catch (err) {
        console.warn('Stock decrement notice:', err);
      }
    })).catch((e) => console.warn('Stock batch notice:', e));
  }

  return insertedOrder;
};

export const getMyOrders = async (user = null) => {
  if (!user || !user.email) return { orders: [] };
  
  const userEmail = user.email.toLowerCase().trim();
  const { data, error } = await supabase.from('orders').select('*').eq('user_email', userEmail).order('created_at', { ascending: false });
  
  if (error) {
    console.error('Supabase getMyOrders error:', error);
    return { orders: [] };
  }
  
  return { orders: data };
};

export const getAllOrders = async (params = {}) => {
  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
  const cutoff = getDateCutoff(params.dateFilter);
  if (cutoff) {
    query = query.gte('created_at', cutoff);
  }
  if (params.limit && typeof params.limit === 'number') {
    query = query.limit(params.limit);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Supabase getAllOrders error:', error);
    return { orders: [] };
  }
  return { orders: data };
};

export const updateOrderStatus = async (id, status) => {
  clearApiCache();
  // Using both id or order_id to be safe since previous architecture used order_id interchangeably
  const { data, error } = await supabase.from('orders').update({ status }).or(`id.eq.${id},order_id.eq.${id}`).select();
  if (error) {
    console.error(`Supabase updateOrderStatus ${id} error:`, error);
    throw error;
  }
  return { id, status, message: 'Status updated successfully' };
};

export const getAllCustomers = async () => {
  const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase getAllCustomers error:', error);
    return { customers: [] };
  }
  return { customers: data };
};

export const getOrderStats = async (dateRange = null) => {
  try {
    let ordersQuery = supabase.from('orders').select('total, status, items, created_at');
    const cutoff = getDateCutoff(dateRange);
    if (cutoff) {
      ordersQuery = ordersQuery.gte('created_at', cutoff);
    }
    const { data: orders, error: ordersError } = await ordersQuery;
    const { count: totalCust, error: custError } = await supabase.from('customers').select('*', { count: 'exact', head: true });
    
    if (ordersError || custError) {
      console.warn('Supabase getOrderStats warning:', ordersError || custError);
    }
    
    const orderList = Array.isArray(orders) ? orders : [];
    const totalRev = orderList.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const totalCount = orderList.length;
    const activeCount = orderList.filter((o) => !['delivered', 'cancelled'].includes(o?.status)).length;
    const avgVal = totalCount > 0 ? Math.round(totalRev / totalCount) : 0;

    return {
      totalRevenue: totalRev,
      totalOrders: totalCount,
      activeOrders: activeCount,
      totalCustomers: totalCust || 0,
      avgOrderValue: avgVal,
      orders: orderList,
    };
  } catch (err) {
    console.error('getOrderStats error:', err);
    return { totalRevenue: 0, totalOrders: 0, activeOrders: 0, totalCustomers: 0, avgOrderValue: 0, orders: [] };
  }
};

// Auth & Profiles
export const getUserProfile = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const email = user.email.toLowerCase().trim();
      const { data } = await supabase.from('customers').select('*').eq('email', email).maybeSingle();
      if (data) {
        return {
          id: data.id,
          uid: data.uid || user.id,
          name: data.name || user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0],
          email: email,
          phone: data.phone || '',
          role: email.includes('admin') ? 'admin' : 'customer'
        };
      }
    }
  } catch (err) {
    console.warn('getUserProfile error:', err);
  }
  return null;
};

export const updateUserProfile = async (data) => {
  if (data?.email) {
    const email = data.email.toLowerCase().trim();
    try {
      const { data: existing } = await supabase.from('customers').select('*').eq('email', email).maybeSingle();

      const payload = {
        id: existing?.id || data.id || `cust-${Date.now()}`,
        uid: data.uid || existing?.uid || `u-${Date.now()}`,
        name: data.name || existing?.name || 'Customer',
        email: email,
        phone: data.phone !== undefined ? data.phone : (existing?.phone || ''),
        created_at: existing?.created_at || new Date().toISOString()
      };

      const { data: updated, error } = await supabase.from('customers').upsert([payload], { onConflict: 'email' }).select().single();
      
      if (!error && updated) {
        return {
          ...updated,
          role: email.includes('admin') ? 'admin' : 'customer'
        };
      }
    } catch (err) {
      console.warn('updateUserProfile error:', err);
    }
  }
  return data;
};

export default api;
