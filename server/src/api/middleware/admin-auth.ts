import type { Response, NextFunction } from 'express';
import { getDb } from '../../db/connection.js';
import type { RequestWithSession } from './session.js';

/**
 * Must be placed after requireSession.
 * Checks admin_users table for the current session user.
 * Returns 403 if the user is not an admin.
 */
export function requireAdmin(req: RequestWithSession, res: Response, next: NextFunction): void {
  const userId = req.session?.user?.id;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const db = getDb();
  const row = db.prepare('SELECT id FROM admin_users WHERE user_id = ?').get(userId);
  if (!row) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  next();
}

