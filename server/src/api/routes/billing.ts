import { Router, type Request, type Response } from 'express';
import Stripe from 'stripe';
import { config } from '../../config/index.js';
import { getOrCreateStripeCustomerForUser } from '../../services/billing-customer.js';
import {
  getUserEntitlement,
  FREE_MONTHLY_CAPTURE_LIMIT,
} from '../../services/entitlements.js';
import { countCapturesByUserThisMonth } from '../../services/capture.js';
import { syncFromStripeEvent } from '../../services/subscription-sync.js';
import { getStripe } from '../../loaders/stripe.js';
import { requireSession, type RequestWithSession } from '../middleware/session.js';
import { getInstallFromToken } from '../../services/extension-session.js';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../loaders/auth.js';

export const billingRouter = Router();

/** GET /api/billing/entitlement — session or extension Bearer token required. Returns current user entitlement. */
billingRouter.get('/entitlement', async (req: Request, res: Response) => {
  function withQuota(entitlement: ReturnType<typeof getUserEntitlement>, userId: string) {
    const isPaid = entitlement.active && entitlement.plan_code !== 'free';
    const quota_used = isPaid ? 0 : countCapturesByUserThisMonth(userId);
    const quota_limit = isPaid ? null : FREE_MONTHLY_CAPTURE_LIMIT;
    return { ...entitlement, quota_used, quota_limit };
  }

  // Support extension Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const install = getInstallFromToken(token);
    if (install) {
      const entitlement = getUserEntitlement(install.user_id);
      res.status(200).json(withQuota(entitlement, install.user_id));
      return;
    }
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Fall back to cookie-based session
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const entitlement = getUserEntitlement(session.user.id);
  res.status(200).json(withQuota(entitlement, session.user.id));
});

/** POST /api/billing/checkout-session — session required. Returns { url } to redirect to Stripe Checkout. */
billingRouter.post(
  '/checkout-session',
  requireSession,
  async (req: RequestWithSession, res: Response<{ url: string } | { error: string }>) => {
    try {
      const stripe = getStripe();
      const userId = req.session!.user.id;
      const email = req.session!.user.email ?? '';
      const name = req.session!.user.name ?? null;
      const customerId = await getOrCreateStripeCustomerForUser(userId, email, name);

      const body = req.body as { interval?: string };
      const interval = body?.interval === 'yearly' ? 'yearly' : 'monthly';
      const priceId = interval === 'yearly' ? config.STRIPE_PRICE_PRO_YEARLY : config.STRIPE_PRICE_PRO_MONTHLY;

      if (!priceId) {
        res.status(500).json({ error: 'Billing is not configured for this interval.' });
        return;
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        client_reference_id: userId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: config.STRIPE_SUCCESS_URL,
        cancel_url: config.STRIPE_CANCEL_URL,
      });

      if (!session.url) {
        res.status(500).json({ error: 'Failed to create checkout session' });
        return;
      }
      res.status(200).json({ url: session.url });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      res.status(500).json({ error: message });
    }
  }
);

/** POST /api/billing/portal-session — session or extension Bearer token required. Returns { url } to redirect to Stripe Customer Portal. */
billingRouter.post(
  '/portal-session',
  async (req: Request, res: Response<{ url: string } | { error: string }>) => {
    try {
      const stripe = getStripe();

      let userId: string;
      let email: string;
      let name: string | null;

      // Support extension Bearer token
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        const install = getInstallFromToken(token);
        if (!install) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        const db = (await import('../../db/connection.js')).getDb();
        const row = db
          .prepare<[string], { email: string; name: string | null }>(
            'SELECT email, name FROM "user" WHERE id = ?'
          )
          .get(install.user_id);
        if (!row) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        userId = install.user_id;
        email = row.email;
        name = row.name;
      } else {
        // Fall back to cookie-based session
        const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
        if (!session) {
          res.status(401).json({ error: 'Unauthorized' });
          return;
        }
        userId = session.user.id;
        email = session.user.email ?? '';
        name = session.user.name ?? null;
      }

      const customerId = await getOrCreateStripeCustomerForUser(userId, email, name);
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: config.STRIPE_PORTAL_RETURN_URL,
      });

      res.status(200).json({ url: portalSession.url });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Portal session failed';
      res.status(500).json({ error: message });
    }
  }
);

/**
 * POST /api/billing/webhook — no session. Must be mounted with express.raw({ type: 'application/json' }).
 * Verifies Stripe signature and calls subscription sync. Returns 2xx quickly.
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const rawBody = req.body;
  if (!Buffer.isBuffer(rawBody)) {
    console.error('Invalid body');
    res.status(400).send('Invalid body');
    return;
  }
  const sig = req.headers['stripe-signature'];
  if (typeof sig !== 'string' || !config.STRIPE_WEBHOOK_SECRET) {
    console.error('Missing signature or webhook secret');
    res.status(400).send('Missing signature or webhook secret');
    return;
  }
  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, config.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Invalid signature');
    res.status(400).send('Invalid signature');
    return;
  }
  try {
    await syncFromStripeEvent(event);
    res.status(200).json({ received: true });
  } catch {
    console.error('Failed to sync from Stripe event');
    res.status(500).json({ received: false });
  }
}
