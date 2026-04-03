import type { Request, Response, NextFunction } from 'express';

interface WindowEntry {
  count: number;
  windowStart: number;
}

/**
 * Returns an Express middleware that enforces a sliding-window rate limit
 * keyed on req.ip. Pruning of stale entries happens on each request.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const windows = new Map<string, WindowEntry>();

  return function rateLimiter(req: Request, res: Response, next: NextFunction): void {
    const ip = req.ip ?? 'unknown';
    const now = Date.now();

    // Prune stale entries to avoid unbounded memory growth
    for (const [key, entry] of windows.entries()) {
      if (now - entry.windowStart > windowMs) {
        windows.delete(key);
      }
    }

    const entry = windows.get(ip);
    if (!entry || now - entry.windowStart > windowMs) {
      windows.set(ip, { count: 1, windowStart: now });
      next();
      return;
    }

    if (entry.count >= limit) {
      res.status(429).set('Retry-After', String(Math.ceil(windowMs / 1000))).json({ error: 'Too many requests' });
      return;
    }

    entry.count += 1;
    next();
  };
}
