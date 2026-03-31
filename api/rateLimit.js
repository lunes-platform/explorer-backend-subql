/**
 * Simple in-memory rate limiter middleware for Express.
 * No external dependencies required.
 *
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 min)
 * @param {number} options.max - Max requests per window per IP (default: 100)
 * @param {string} options.message - Error message when rate limited
 */
export function rateLimit({ windowMs = 60_000, max = 100, message = 'Too many requests, please try again later.' } = {}) {
  const hits = new Map(); // ip -> { count, resetAt }

  // Cleanup expired entries every 5 minutes
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) {
      if (now > entry.resetAt) hits.delete(ip);
    }
  }, 5 * 60_000);
  cleanup.unref?.(); // Don't keep process alive for cleanup

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = hits.get(ip);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(ip, entry);
    }

    entry.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > max) {
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    next();
  };
}

/**
 * Stricter rate limiter for write endpoints (POST/PUT/DELETE).
 */
export const writeRateLimit = rateLimit({
  windowMs: 60_000,
  max: 30,
  message: 'Too many write requests, please slow down.',
});

/**
 * General rate limiter for read endpoints.
 */
export const readRateLimit = rateLimit({
  windowMs: 60_000,
  max: 120,
  message: 'Too many requests, please try again later.',
});
