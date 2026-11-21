import express from 'express';
import { query } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page, limit } = req.query;

    const countRows = await query('SELECT COUNT(*)::int AS count FROM public.customers;');
    const total = Number(countRows[0]?.count || 0);

    if (page || limit) {
      const pageNum = Math.max(Number(page) || 1, 1);
      const pageSize = Math.min(Math.max(Number(limit) || 25, 1), 100);
      const offset = (pageNum - 1) * pageSize;

      const rows = await query(
        'SELECT * FROM public.customers ORDER BY created_at DESC LIMIT $1 OFFSET $2;',
        [pageSize, offset]
      );

      return res.json({
        customers: rows,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / pageSize)
      });
    }

    const rows = await query('SELECT * FROM public.customers ORDER BY created_at DESC;');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/profile?email=...
router.get('/profile', async (req, res) => {
  try {
    const email = (req.query.email || req.user?.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ error: 'Email parameter or active session is required' });
    }

    const users = await query(
      'SELECT id, email, name, phone, addresses, role FROM public.users WHERE LOWER(email) = $1 LIMIT 1;',
      [email]
    );

    if (users.length > 0) {
      const u = users[0];
      return res.json({
        id: u.id,
        email: u.email,
        name: u.name || '',
        phone: u.phone || '',
        addresses: Array.isArray(u.addresses) ? u.addresses : (typeof u.addresses === 'string' ? JSON.parse(u.addresses || '[]') : []),
        role: u.role
      });
    }

    const custs = await query(
      'SELECT id, uid, email, name, phone, addresses FROM public.customers WHERE LOWER(email) = $1 LIMIT 1;',
      [email]
    );

    if (custs.length > 0) {
      const c = custs[0];
      return res.json({
        id: c.id,
        email: c.email,
        name: c.name || '',
        phone: c.phone || '',
        addresses: Array.isArray(c.addresses) ? c.addresses : (typeof c.addresses === 'string' ? JSON.parse(c.addresses || '[]') : [])
      });
    }

    res.status(404).json({ error: 'Customer profile not found' });
  } catch (err) {
    console.error('Error getting profile:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// PUT /api/customers/profile
router.put('/profile', async (req, res) => {
  try {
    const email = (req.body.email || req.user?.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ error: 'Email is required to update profile' });
    }

    const { name, phone, addresses } = req.body;
    const cleanAddresses = addresses !== undefined ? (Array.isArray(addresses) ? addresses : []) : null;

    // Update public.users
    const userUpdates = await query(
      `UPDATE public.users 
       SET name = COALESCE($2, name), 
           phone = COALESCE($3, phone),
           addresses = CASE WHEN $4::text IS NOT NULL THEN $4::jsonb ELSE addresses END,
           updated_at = NOW()
       WHERE LOWER(email) = $1 
       RETURNING id, email, name, phone, addresses, role;`,
      [
        email,
        name !== undefined ? name : null,
        phone !== undefined ? phone : null,
        cleanAddresses !== null ? JSON.stringify(cleanAddresses) : null
      ]
    );

    // Update public.customers
    await query(
      `UPDATE public.customers 
       SET name = COALESCE($2, name), 
           phone = COALESCE($3, phone),
           addresses = CASE WHEN $4::text IS NOT NULL THEN $4::jsonb ELSE addresses END
       WHERE LOWER(email) = $1;`,
      [
        email,
        name !== undefined ? name : null,
        phone !== undefined ? phone : null,
        cleanAddresses !== null ? JSON.stringify(cleanAddresses) : null
      ]
    );

    const result = userUpdates[0] || {
      email,
      name: name || '',
      phone: phone || '',
      addresses: cleanAddresses || []
    };

    if (result && typeof result.addresses === 'string') {
      try { result.addresses = JSON.parse(result.addresses); } catch {}
    }

    res.json(result);
  } catch (err) {
    console.error('Error updating customer profile:', err);
    res.status(500).json({ error: 'Failed to update customer profile' });
  }
});

export default router;
