import express from 'express';
import crypto from 'crypto';
import { query } from '../db.js';
import { hashPassword, verifyPassword } from '../utils.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await query('SELECT id FROM public.users WHERE email = $1 LIMIT 1;', [cleanEmail]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);
    const userId = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const role = cleanEmail.includes('admin') || cleanEmail === 'zabbrotechnologies@gmail.com' ? 'admin' : 'customer';

    await query(
      `INSERT INTO public.users (id, email, password_hash, name, phone, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW());`,
      [userId, cleanEmail, passwordHash, name || cleanEmail.split('@')[0], phone || '', role]
    );

    // Upsert into customers table to maintain backward compatibility
    await query(
      `INSERT INTO public.customers (id, uid, name, email, phone, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone;`,
      [`cust-${Date.now()}`, crypto.randomUUID(), name || cleanEmail.split('@')[0], cleanEmail, phone || '']
    );

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await query(
      `INSERT INTO public.sessions (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, $4);`,
      [`sess-${Date.now()}`, userId, sessionToken, expiresAt.toISOString()]
    );

    res.cookie('maxywalk_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_MS
    });

    res.json({
      user: { id: userId, email: cleanEmail, name: name || cleanEmail.split('@')[0], phone, role },
      token: sessionToken
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const users = await query('SELECT * FROM public.users WHERE email = $1 LIMIT 1;', [cleanEmail]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await query(
      `INSERT INTO public.sessions (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, $4);`,
      [`sess-${Date.now()}`, user.id, sessionToken, expiresAt.toISOString()]
    );

    res.cookie('maxywalk_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_MS
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role },
      token: sessionToken
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    // Verify token with Google's public tokeninfo service
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!googleRes.ok) {
      return res.status(401).json({ error: 'Invalid Google credential' });
    }
    const payload = await googleRes.json();
    const cleanEmail = payload.email?.toLowerCase().trim();
    if (!cleanEmail) {
      return res.status(400).json({ error: 'Email not provided by Google' });
    }

    let users = await query('SELECT * FROM public.users WHERE email = $1 LIMIT 1;', [cleanEmail]);
    let user;
    if (users.length === 0) {
      const userId = `user-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      const role = cleanEmail.includes('admin') || cleanEmail === 'zabbrotechnologies@gmail.com' ? 'admin' : 'customer';
      const name = payload.name || cleanEmail.split('@')[0];

      await query(
        `INSERT INTO public.users (id, email, password_hash, name, phone, role, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW());`,
        [userId, cleanEmail, 'oauth_google', name, '', role]
      );

      await query(
        `INSERT INTO public.customers (id, uid, name, email, phone, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;`,
        [`cust-${Date.now()}`, crypto.randomUUID(), name, cleanEmail, '']
      );

      user = { id: userId, email: cleanEmail, name, phone: '', role };
    } else {
      user = users[0];
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    await query(
      `INSERT INTO public.sessions (id, user_id, token, expires_at)
       VALUES ($1, $2, $3, $4);`,
      [`sess-${Date.now()}`, user.id, sessionToken, expiresAt.toISOString()]
    );

    res.cookie('maxywalk_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_MS
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role },
      token: sessionToken
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const token = req.cookies?.maxywalk_session || req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await query('DELETE FROM public.sessions WHERE token = $1;', [token]);
    }
    res.clearCookie('maxywalk_session');
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});

router.get('/me', (req, res) => {
  if (!req.user) {
    return res.json({ user: null });
  }
  res.json({ user: req.user });
});

export default router;
