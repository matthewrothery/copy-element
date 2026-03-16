import { Router } from 'express';
import { optionalSession, type RequestWithSession } from '../middleware/session.js';

export const meRouter = Router();

meRouter.get('/', optionalSession, (req: RequestWithSession, res) => {
  if (!req.session) {
    res.status(401).json({ user: null });
    return;
  }
  res.status(200).json({ user: req.session.user });
});
