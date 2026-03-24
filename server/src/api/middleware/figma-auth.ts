import type { Request, Response, NextFunction } from 'express';
import { getFigmaSessionUser } from '../../services/figma-session.js';

export interface RequestWithFigmaUser extends Request {
  figmaUserId?: string;
}

/** Authenticate Figma plugin requests via Bearer token issued by the device-code flow. */
export function requireFigmaAuth(req: RequestWithFigmaUser, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    res.status(401).json({ error: 'Figma Bearer token required' });
    return;
  }
  const userId = getFigmaSessionUser(token);
  if (!userId) {
    res.status(401).json({ error: 'Invalid or expired Figma token' });
    return;
  }
  req.figmaUserId = userId;
  next();
}
