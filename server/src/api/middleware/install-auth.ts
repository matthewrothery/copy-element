import type { Request, Response, NextFunction } from 'express';
import { getDb } from '../../db/connection.js';
import { getInstallByInstallId } from '../../services/install.js';
import { getInstallFromToken } from '../../services/extension-session.js';

export interface RequestWithInstall extends Request {
  installId?: string;
  installUserId?: string | null;
}

/**
 * Authenticate by extension Bearer token or by install_id + install_secret in body.
 * Attaches installId (and installUserId when token is used) to the request.
 */
export function requireInstallAuth(req: RequestWithInstall, res: Response, next: NextFunction): void {
  const token = (req.body as { token?: string })?.token ?? req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  if (token) {
    const install = getInstallFromToken(token);
    if (install) {
      req.installId = install.install_id;
      req.installUserId = install.user_id;
      next();
      return;
    }
  }

  const install_id =
    (req.body as { install_id?: string })?.install_id ??
    (req.query as { install_id?: string })?.install_id ??
    (req.params as { installId?: string })?.installId;
  const install_secret = (req.body as { install_secret?: string })?.install_secret ?? (req.query as { install_secret?: string })?.install_secret;
  if (typeof install_id === 'string' && typeof install_secret === 'string') {
    const install = getInstallByInstallId(install_id.trim());
    if (!install) {
      res.status(401).json({ error: 'Install not found' });
      return;
    }
    const db = getDb();
    const row = db.prepare('SELECT install_secret FROM installs WHERE install_id = ?').get(install_id.trim()) as { install_secret: string } | undefined;
    if (!row || row.install_secret !== install_secret) {
      res.status(401).json({ error: 'Invalid install secret' });
      return;
    }
    req.installId = install_id.trim();
    req.installUserId = install.user_id;
    next();
    return;
  }

  res.status(401).json({ error: 'Extension token or install_id + install_secret required' });
}
