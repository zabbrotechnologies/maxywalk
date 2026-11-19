import express from 'express';
import { query } from '../db.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAdmin, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM public.customers ORDER BY created_at DESC;');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const email = req.user.email;

    await query(
      `UPDATE public.users SET name = COALESCE($2, name), phone = COALESCE($3, phone), updated_at = NOW()
       WHERE email = $1;`,
      [email, name, phone]
    );

    const rows = await query(
      `UPDATE public.customers SET name = COALESCE($2, name), phone = COALESCE($3, phone)
       WHERE email = $1 RETURNING *;`,
      [email, name, phone]
    );

    res.json(rows[0] || { name, phone, email });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
