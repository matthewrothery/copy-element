import type { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../loaders/auth.js';
import { hasActivePaidPlan } from '../../services/entitlements.js';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface RequestWithSession extends Request {
  session?: { user: SessionUser } | null;
}

export async function requireSession(req: RequestWithSession, res: Response, next: NextFunction): Promise<void> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  req.session = session ?? null;
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

export async function optionalSession(req: RequestWithSession, _res: Response, next: NextFunction): Promise<void> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  req.session = session ?? null;
  next();
}

/**
 * Use after requireSession. Returns 403 if the current user does not have an active paid plan.
 * Downstream APIs should consult entitlements service, not Stripe directly.
 */
export function requirePaidEntitlement(req: RequestWithSession, res: Response, next: NextFunction): void {
  if (!req.session?.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (!hasActivePaidPlan(req.session.user.id)) {
    res.status(403).json({ error: 'Active subscription required' });
    return;
  }
  next();
}
