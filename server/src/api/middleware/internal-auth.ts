import { timingSafeEqual } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../../config/index.js';

/**
 * Middleware: validate X-Internal-Key header against INTERNAL_API_KEY config.
 * Uses timingSafeEqual to prevent timing attacks.
 * Mount only on /internal/* routes — never expose under /api/.
 */
export function requireInternalAuth(req: Request, res: Response, next: NextFunction): void {
  const provided = req.headers['x-internal-key'];
  const expected = config.INTERNAL_API_KEY;

  if (!expected || typeof provided !== 'string' || !provided) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const providedBuf = Buffer.from(provided, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');

  if (providedBuf.length !== expectedBuf.length) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!timingSafeEqual(providedBuf, expectedBuf)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
}
