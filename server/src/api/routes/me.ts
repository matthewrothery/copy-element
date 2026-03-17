import { Router, type Request, type Response } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../loaders/auth.js';
import { getDb } from '../../db/connection.js';
import { getInstallFromToken } from '../../services/extension-session.js';

export const meRouter = Router();

meRouter.get('/', async (req: Request, res: Response) => {
  // Support extension Bearer token in addition to cookie-based sessions
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const install = getInstallFromToken(token);
    if (install) {
      const db = getDb();
      const user = db
        .prepare('SELECT id, email, name FROM "user" WHERE id = ?')
        .get(install.user_id) as { id: string; email: string; name: string } | undefined;
      if (user) {
        res.status(200).json({ user: { id: user.id, email: user.email, name: user.name } });
        return;
      }
    }
    res.status(401).json({ user: null });
    return;
  }

  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    res.status(401).json({ user: null });
    return;
  }
  res.status(200).json({ user: session.user });
});
