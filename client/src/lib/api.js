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

export function clearApiCache() {
  cache.clear();
}

// -----------------------------------------------------------------
// SUPABASE MIGRATION: DATA LAYER
// -----------------------------------------------------------------

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

  const { data, error } = await query;
  
  if (error) {
    console.error('Supabase getProducts error:', error);
    return { products: [], total: 0 };
  }

  let list = [...data];
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

export const createProduct = async (data) => {
  clearApiCache();
  const newProduct = {
    id: `custom-${Date.now()}`,
    ...data,
    created_at: new Date().toISOString()
  };
  
  const { data: insertedData, error } = await supabase.from('products').insert([newProduct]).select().single();
  if (error) {
    console.error('Supabase createProduct error:', error);
    throw error;
  }
  return insertedData;
};

export const updateProduct = async (id, data) => {
  clearApiCache();
  const { data: updatedData, error } = await supabase.from('products').update(data).eq('id', id).select().single();
  if (error) {
    console.error(`Supabase updateProduct ${id} error:`, error);
    throw error;
  }
  return updatedData;
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
  const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
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

export const getOrderStats = async () => {
  const { data: orders, error: ordersError } = await supabase.from('orders').select('total, status');
  const { count: totalCust, error: custError } = await supabase.from('customers').select('*', { count: 'exact', head: true });
  
  if (ordersError || custError) {
    console.error('Supabase getOrderStats error:', ordersError || custError);
    return { totalRevenue: 0, totalOrders: 0, activeOrders: 0, totalCustomers: 0, avgOrderValue: 0 };
  }
  
  const totalRev = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalCount = orders.length;
  const activeCount = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;
  const avgVal = totalCount > 0 ? Math.round(totalRev / totalCount) : 0;

  return {
    totalRevenue: totalRev,
    totalOrders: totalCount,
    activeOrders: activeCount,
    totalCustomers: totalCust || 0,
    avgOrderValue: avgVal,
  };
};

// Auth & Profiles (Leaving stubbed since Firebase handles auth, just connecting to Supabase customers table)
export const getUserProfile = async () => {
  if (auth?.currentUser?.email) {
    const { data } = await supabase.from('customers').select('*').eq('email', auth.currentUser.email).single();
    if (data) return data;
  }
  return { name: 'Customer' };
};

export const updateUserProfile = async (data) => {
  if (data.email) {
    const { data: updated, error } = await supabase.from('customers').upsert([
      { id: `cust-${Date.now()}`, uid: data.uid || `u-${Date.now()}`, name: data.name, email: data.email, phone: data.phone, created_at: new Date().toISOString() }
    ], { onConflict: 'email' }).select().single();
    
    if (!error) return updated;
  }
  return data;
};

export default api;
