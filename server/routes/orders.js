import express from 'express';
import crypto from 'crypto';
import { query } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { orderRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { page, limit } = req.query;

    let baseSql = 'FROM public.orders';
    const conditions = [];
    const params = [];

    // If not admin, restrict to own orders
    if (user.role !== 'admin') {
      params.push(user.email);
      conditions.push(`user_email = $${params.length}`);
    }

    if (conditions.length > 0) {
      baseSql += ' WHERE ' + conditions.join(' AND ');
    }

    // Fast count query
    const countRows = await query(`SELECT COUNT(*)::int AS count ${baseSql};`, params);
    const total = Number(countRows[0]?.count || 0);

    let sql = `SELECT * ${baseSql} ORDER BY created_at DESC`;
    if (page || limit) {
      const pageNum = Math.max(Number(page) || 1, 1);
      const pageSize = Math.min(Math.max(Number(limit) || 25, 1), 100);
      const offset = (pageNum - 1) * pageSize;
      params.push(pageSize, offset);
      sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

      const rows = await query(sql, params);
      return res.json({
        orders: rows,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / pageSize)
      });
    }

    sql += ';';
    const rows = await query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [statsRows, recentOrders, customerCount] = await Promise.all([
      query(`
        SELECT 
          COUNT(*)::int AS total_orders,
          COALESCE(SUM(total), 0)::numeric AS total_revenue,
          COUNT(*) FILTER (WHERE LOWER(status) NOT IN ('delivered', 'cancelled'))::int AS active_orders,
          ROUND(COALESCE(AVG(total), 0))::numeric AS avg_order_value
        FROM public.orders;
      `),
      query('SELECT * FROM public.orders ORDER BY created_at DESC LIMIT 50;'),
      query('SELECT COUNT(*)::int AS count FROM public.customers;')
    ]);

    const stat = statsRows[0] || {};
    res.json({
      totalRevenue: Number(stat.total_revenue) || 0,
      totalOrders: Number(stat.total_orders) || 0,
      activeOrders: Number(stat.active_orders) || 0,
      totalCustomers: Number(customerCount[0]?.count) || 0,
      avgOrderValue: Number(stat.avg_order_value) || 0,
      orders: recentOrders
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch order stats' });
  }
});

router.post('/', orderRateLimiter, async (req, res) => {
  try {
    const { items, total, shipping_address, payment_method, user_email, idempotency_key } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // 1. Idempotency Check: Prevent duplicate orders from network retries or double clicks
    if (idempotency_key) {
      const existing = await query(
        `SELECT * FROM public.orders 
         WHERE idempotency_key = $1 AND created_at > NOW() - INTERVAL '15 minutes' 
         LIMIT 1;`,
        [idempotency_key]
      );
      if (existing.length > 0) {
        return res.status(200).json(existing[0]);
      }
    }

    // 2. Concurrency Protection & Atomic Inventory Deduction
    const deductedItems = [];
    let stockError = null;

    for (const item of items) {
      const pId = item.productId || item.id;
      const qty = Math.max(Number(item.qty) || 1, 1);

      if (pId) {
        // Atomic conditional decrement: only deduct if stock >= requested qty
        const updated = await query(
          `UPDATE public.products 
           SET stock = stock - $2 
           WHERE id = $1 AND stock >= $2 
           RETURNING id, name, stock;`,
          [pId, qty]
        );

        if (updated.length === 0) {
          stockError = item.name || pId;
          break;
        } else {
          deductedItems.push({ pId, qty });
        }
      }
    }

    // If any item lacked stock, rollback previously deducted stock for this attempt
    if (stockError) {
      for (const d of deductedItems) {
        try {
          await query('UPDATE public.products SET stock = stock + $2 WHERE id = $1;', [d.pId, d.qty]);
        } catch {}
      }
      return res.status(409).json({
        error: `Insufficient stock for "${stockError}". Please adjust your quantity.`
      });
    }

    // 3. Insert Verified Order
    const orderNum = `MW-${Date.now().toString().slice(-6)}`;
    const id = `ord-${Date.now()}`;
    const cleanIdempotency = idempotency_key || `idem-${id}`;

    const sql = `
      INSERT INTO public.orders (
        id, order_id, user_email, items, total, status, 
        shipping_address, payment_method, idempotency_key, created_at
      )
      VALUES ($1, $2, $3, $4::jsonb, $5, 'pending', $6::jsonb, $7, $8, NOW())
      ON CONFLICT (idempotency_key) DO UPDATE SET status = EXCLUDED.status
      RETURNING *;
    `;

    const params = [
      id,
      orderNum,
      user_email || req.user?.email || 'guest@maxywalk.com',
      JSON.stringify(items || []),
      Number(total) || 0,
      JSON.stringify(shipping_address || {}),
      payment_method || 'cod',
      cleanIdempotency
    ];

    const rows = await query(sql, params);

    // If an existing order was returned via ON CONFLICT, rollback stock deducted by this duplicate request
    if (rows.length > 0 && rows[0].id !== id) {
      for (const d of deductedItems) {
        try {
          await query('UPDATE public.products SET stock = stock + $2 WHERE id = $1;', [d.pId, d.qty]);
        } catch {}
      }
      return res.status(200).json(rows[0]);
    }

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
