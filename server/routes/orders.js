import express from 'express';
import crypto from 'crypto';
import { query } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    let sql = 'SELECT * FROM public.orders';
    const params = [];

    // If not admin, restrict to own orders
    if (user.role !== 'admin') {
      sql += ' WHERE user_email = $1';
      params.push(user.email);
    }
    sql += ' ORDER BY created_at DESC;';

    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const orders = await query('SELECT total, status, created_at, user_email FROM public.orders;');
    const customers = await query('SELECT COUNT(*) as count FROM public.customers;');

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status?.toLowerCase())).length;
    const totalCustomers = Number(customers[0]?.count || 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    res.json({
      totalRevenue,
      totalOrders,
      activeOrders,
      totalCustomers,
      avgOrderValue,
      orders: orders.slice(0, 50)
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch order stats' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { items, total, shipping_address, payment_method, user_email } = req.body;
    const orderNum = `MW-${Date.now().toString().slice(-6)}`;
    const id = `ord-${Date.now()}`;

    const sql = `
      INSERT INTO public.orders (id, order_id, user_email, items, total, status, shipping_address, payment_method, created_at)
      VALUES ($1, $2, $3, $4::jsonb, $5, 'pending', $6::jsonb, $7, NOW())
      RETURNING *;
    `;

    const params = [
      id,
      orderNum,
      user_email || req.user?.email || 'guest@maxywalk.com',
      JSON.stringify(items || []),
      Number(total) || 0,
      JSON.stringify(shipping_address || {}),
      payment_method || 'cod'
    ];

    const rows = await query(sql, params);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const rows = await query('UPDATE public.orders SET status = $2 WHERE id = $1 RETURNING *;', [id, status]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

export default router;
