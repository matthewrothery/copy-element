import { Router, type Request, type Response } from 'express';
import {
  createExtensionCode,
  exchangeCodeForToken,
  refreshExtensionToken,
  revokeExtensionToken,
} from '../../services/extension-session.js';
import { requireSession, type RequestWithSession } from '../middleware/session.js';

export const extensionSessionRouter = Router();

extensionSessionRouter.post('/code', requireSession, (req: RequestWithSession, res: Response) => {
  const install_id = (req.body as { install_id?: string })?.install_id;
  if (typeof install_id !== 'string' || !install_id.trim()) {
    res.status(400).json({ error: 'install_id is required' });
    return;
  }
  const code = createExtensionCode(req.session!.user.id, install_id.trim());
  res.status(200).json({ code });
});

extensionSessionRouter.post('/', (req: Request, res: Response) => {
  const body = req.body as { install_id?: string; install_secret?: string; code?: string };
  const { install_id, install_secret, code } = body;
  if (typeof install_id !== 'string' || typeof install_secret !== 'string' || typeof code !== 'string') {
    res.status(400).json({ error: 'install_id, install_secret, and code are required' });
    return;
  }
  const result = exchangeCodeForToken(code.trim(), install_id.trim(), install_secret.trim());
  if (!result) {
    res.status(400).json({ error: 'Invalid or expired code' });
    return;
  }
  res.status(200).json(result);
});

extensionSessionRouter.post('/refresh', (req: Request, res: Response) => {
  const token = (req.body as { token?: string })?.token ?? (req.headers.authorization?.replace(/^Bearer\s+/i, ''));
  if (!token) {
    res.status(401).json({ error: 'Token required' });
    return;
  }
  const result = refreshExtensionToken(token);
  if (!result) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
  res.status(200).json(result);
});

extensionSessionRouter.post('/revoke', (req: Request, res: Response) => {
  const token = (req.body as { token?: string })?.token ?? (req.headers.authorization?.replace(/^Bearer\s+/i, ''));
  if (!token) {
    res.status(400).json({ error: 'Token required' });
    return;
  }
  revokeExtensionToken(token);
  res.status(200).json({ ok: true });
});
