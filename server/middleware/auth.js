import { query } from '../db.js';

export async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.maxywalk_session || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      req.user = null;
      return next();
    }

    const sessions = await query(
      `SELECT s.token, s.expires_at, u.id, u.email, u.name, u.phone, u.role
       FROM public.sessions s
       JOIN public.users u ON s.user_id = u.id
       WHERE s.token = $1 AND s.expires_at > NOW()
       LIMIT 1;`,
      [token]
    );

    if (sessions.length > 0) {
      req.user = sessions[0];
    } else {
      req.user = null;
    }
  } catch (err) {
    console.error('Auth middleware error:', err);
    req.user = null;
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
}
