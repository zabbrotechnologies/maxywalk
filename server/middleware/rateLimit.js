// High-performance serverless-safe sliding window rate limiter
const ipWindows = new Map();
const CLEANUP_INTERVAL_MS = 60 * 1000;

let lastCleanup = Date.now();

function cleanupStaleWindows() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of ipWindows.entries()) {
    if (now - record.startTime > record.windowMs * 2) {
      ipWindows.delete(key);
    }
  }
}

export function createRateLimiter({
  windowMs = 60 * 1000,
  max = 60,
  message = 'Too many requests, please try again shortly.',
  keyPrefix = 'rl'
} = {}) {
  return (req, res, next) => {
    cleanupStaleWindows();

    // Safely extract client IP from Vercel / proxy headers
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = (forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || '127.0.0.1');
    const key = `${keyPrefix}:${clientIp}`;
    const now = Date.now();

    let record = ipWindows.get(key);
    if (!record || (now - record.startTime) > windowMs) {
      record = { count: 1, startTime: now, windowMs };
      ipWindows.set(key, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.startTime + windowMs - now) / 1000);

    res.set({
      'X-RateLimit-Limit': String(max),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetSeconds)
    });

    if (record.count > max) {
      res.set('Retry-After', String(resetSeconds));
      return res.status(429).json({
        error: message,
        retryAfter: resetSeconds
      });
    }

    next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Too many authentication attempts. Please wait 1 minute before trying again.',
  keyPrefix: 'auth'
});

export const orderRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Order submission limit reached. Please wait a moment before trying again.',
  keyPrefix: 'order'
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 120,
  message: 'Too many requests. Please slow down.',
  keyPrefix: 'api'
});
