import { query } from '../db.js';

// Fast in-memory session cache for serverless instance (TTL: 60s)
const sessionCache = new Map();
const SESSION_CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

export function invalidateSession(token) {
  if (token) sessionCache.delete(token);
}

export async function authenticate(req, res, next) {
  try {
    // Fast-path: Skip session lookups for static asset streams and health checks
    if (req.path.startsWith('/api/assets') || req.path === '/api/health') {
      req.user = null;
      return next();
    }

    const token = req.cookies?.maxywalk_session || req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      req.user = null;
      return next();
    }

    // Check fast instance cache first
    const cached = sessionCache.get(token);
    if (cached && (Date.now() - cached.cachedAt) < SESSION_CACHE_TTL_MS) {
      req.user = cached.user;
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
      // Bound cache size
      if (sessionCache.size >= MAX_CACHE_ENTRIES) {
        const oldestKey = sessionCache.keys().next().value;
        sessionCache.delete(oldestKey);
      }
      sessionCache.set(token, { user: sessions[0], cachedAt: Date.now() });
    } else {
      req.user = null;
      sessionCache.delete(token);
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
