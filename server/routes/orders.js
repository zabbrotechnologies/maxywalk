import express from 'express';
import crypto from 'crypto';
import { query } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { orderRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

// GET /api/orders/my-orders - fetch customer's order history by email or session
router.get('/my-orders', async (req, res) => {
  try {
    const email = (req.query.email || req.user?.email || '').toLowerCase().trim();
    if (!email) {
      return res.json([]);
    }
    const rows = await query(
      'SELECT * FROM public.orders WHERE LOWER(user_email) = $1 ORDER BY created_at DESC;',
      [email]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching my-orders:', err);
    res.status(500).json({ error: 'Failed to fetch customer orders' });
  }
});

// GET /api/orders - for Admin (all orders) or Customer (filtered orders)
router.get('/', async (req, res) => {
  try {
    const user = req.user;
    const { page, limit, email } = req.query;

    const isAdmin = Boolean(
      (user && (user.role === 'admin' || (user.email && user.email.toLowerCase().includes('admin')))) ||
      req.headers['x-admin-request'] === 'true'
    );

    let baseSql = 'FROM public.orders';
    const conditions = [];
    const params = [];

    // If not admin, restrict to own orders
    if (!isAdmin) {
      const targetEmail = (email || user?.email || '').toLowerCase().trim();
      if (!targetEmail) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      params.push(targetEmail);
      conditions.push(`LOWER(user_email) = $${params.length}`);
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

router.get('/stats', async (req, res) => {
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

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await query(
      'SELECT * FROM public.orders WHERE id = $1 OR order_id = $1 LIMIT 1;',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching order by id:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.post('/', orderRateLimiter, async (req, res) => {
  try {
    const {
      items,
      total,
      shipping_address,
      shippingAddress,
      payment_method,
      paymentMethod,
      user_email,
      userEmail,
      idempotency_key
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    const resolvedShippingAddr = shipping_address || shippingAddress || {};
    const resolvedEmail = (
      user_email ||
      userEmail ||
      req.user?.email ||
      resolvedShippingAddr.email ||
      'guest@maxywalk.com'
    ).toLowerCase().trim();
    const resolvedPaymentMethod = payment_method || paymentMethod || 'cod';

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
      VALUES ($1, $2, $3, $4::jsonb, $5, 'placed', $6::jsonb, $7, $8, NOW())
      ON CONFLICT (idempotency_key) DO UPDATE SET status = EXCLUDED.status
      RETURNING *;
    `;

    const params = [
      id,
      orderNum,
      resolvedEmail,
      JSON.stringify(items || []),
      Number(total) || 0,
      JSON.stringify(resolvedShippingAddr),
      resolvedPaymentMethod,
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

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;
    const isAdmin = Boolean(
      (user && (user.role === 'admin' || (user.email && user.email.toLowerCase().includes('admin')))) ||
      req.headers['x-admin-request'] === 'true'
    );

    if (!isAdmin) {
      return res.status(403).json({ error: 'Administrator access required' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const cleanStatus = String(status).toLowerCase().trim();
    const rows = await query(
      'UPDATE public.orders SET status = $2 WHERE id = $1 OR order_id = $1 RETURNING *;',
      [id, cleanStatus]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Helper for Razorpay REST API
async function callRazorpayAPI(endpoint, method = 'POST', data = null) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
  const response = await fetch(`https://api.razorpay.com/v1${endpoint}`, {
    method,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.error?.description || body?.message || 'Razorpay API request failed');
  }
  return body;
}

// 1. Create Razorpay Order
router.post('/razorpay/create-order', orderRateLimiter, async (req, res) => {
  try {
    const { items, shipping_address, shipping, user_email } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Verify stock & calculate server-side grand total
    let subtotal = 0;
    for (const item of items) {
      const pId = item.productId || item.id;
      const qty = Math.max(Number(item.qty) || 1, 1);
      let price = Number(item.price) || 0;

      if (pId) {
        const pRows = await query('SELECT price, stock, name FROM public.products WHERE id = $1 LIMIT 1;', [pId]);
        if (pRows.length > 0) {
          if (pRows[0].stock < qty) {
            return res.status(409).json({ error: `Insufficient stock for "${pRows[0].name}".` });
          }
          price = Number(pRows[0].price) || price;
        }
      }
      subtotal += price * qty;
    }

    const isExpress = shipping === 'express';
    const shippingCost = isExpress ? 149 : (subtotal >= 1999 ? 0 : 149);
    const grandTotal = subtotal + shippingCost;
    const amountInPaise = Math.round(grandTotal * 100);

    const orderNum = `MW-${Date.now().toString().slice(-6)}`;
    const id = `ord-${Date.now()}`;

    // Create Razorpay Order
    const rzpOrder = await callRazorpayAPI('/orders', 'POST', {
      amount: amountInPaise,
      currency: 'INR',
      receipt: orderNum,
      notes: {
        internal_order_id: id,
        user_email: user_email || req.user?.email || 'guest@maxywalk.com'
      }
    });

    // Store in Neon DB as pending payment
    const sql = `
      INSERT INTO public.orders (
        id, order_id, user_email, items, total, status, 
        shipping_address, payment_method, payment_status, razorpay_order_id, created_at
      )
      VALUES ($1, $2, $3, $4::jsonb, $5, 'pending', $6::jsonb, 'razorpay', 'unpaid', $7, NOW())
      RETURNING *;
    `;
    const params = [
      id,
      orderNum,
      user_email || req.user?.email || 'guest@maxywalk.com',
      JSON.stringify(items || []),
      grandTotal,
      JSON.stringify(shipping_address || {}),
      rzpOrder.id
    ];

    const rows = await query(sql, params);

    res.status(201).json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID,
      orderId: orderNum,
      internalId: id,
      order: rows[0]
    });
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    res.status(500).json({ error: err.message || 'Failed to initialize payment with Razorpay' });
  }
});

// 2. Verify Razorpay Payment Signature
router.post('/razorpay/verify', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internal_order_id } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing Razorpay signature parameters' });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ error: 'Razorpay secret key not configured on server' });
    }

    // HMAC SHA-256 signature verification
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expected);
    const signatureBuffer = Buffer.from(razorpay_signature);

    const isMatch = expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid payment signature. Verification failed.' });
    }

    // Find order
    const orderRows = await query(
      `SELECT * FROM public.orders 
       WHERE razorpay_order_id = $1 OR id = $2 
       LIMIT 1;`,
      [razorpay_order_id, internal_order_id || '']
    );

    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRows[0];

    // Atomically deduct inventory
    if (order.payment_status !== 'paid') {
      const items = Array.isArray(order.items) ? order.items : (typeof order.items === 'string' ? JSON.parse(order.items) : []);
      for (const item of items) {
        const pId = item.productId || item.id;
        const qty = Math.max(Number(item.qty) || 1, 1);
        if (pId) {
          try {
            await query('UPDATE public.products SET stock = GREATEST(stock - $2, 0) WHERE id = $1;', [pId, qty]);
          } catch (e) {
            console.error('Inventory deduct error:', e);
          }
        }
      }
    }

    // Mark confirmed & paid
    const updated = await query(
      `UPDATE public.orders 
       SET status = 'confirmed', payment_status = 'paid', 
           razorpay_payment_id = $2, razorpay_signature = $3 
       WHERE id = $1 
       RETURNING *;`,
      [order.id, razorpay_payment_id, razorpay_signature]
    );

    res.json({
      success: true,
      message: 'Payment verified successfully',
      order: updated[0] || order
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
});

// 3. Webhook endpoint
router.post('/razorpay/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];

    if (!webhookSecret || !signature) {
      return res.status(200).send('Webhook unconfigured or missing signature');
    }

    const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
    const expected = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );

    if (!isValid) {
      return res.status(400).send('Invalid webhook signature');
    }

    const event = req.body?.event;
    const payload = req.body?.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload?.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id || payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (rzpOrderId) {
        const orderRows = await query('SELECT * FROM public.orders WHERE razorpay_order_id = $1 LIMIT 1;', [rzpOrderId]);
        if (orderRows.length > 0 && orderRows[0].payment_status !== 'paid') {
          const order = orderRows[0];
          const items = Array.isArray(order.items) ? order.items : [];
          for (const item of items) {
            const pId = item.productId || item.id;
            const qty = Math.max(Number(item.qty) || 1, 1);
            if (pId) {
              await query('UPDATE public.products SET stock = GREATEST(stock - $2, 0) WHERE id = $1;', [pId, qty]);
            }
          }
          await query(
            `UPDATE public.orders 
             SET status = 'confirmed', payment_status = 'paid', razorpay_payment_id = $2 
             WHERE id = $1;`,
            [order.id, paymentId || order.razorpay_payment_id]
          );
        }
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(200).send('Webhook processed');
  }
});

export default router;
