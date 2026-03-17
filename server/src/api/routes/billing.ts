import { Router, type Request, type Response } from 'express';
import Stripe from 'stripe';
import { config } from '../../config/index.js';
import { getOrCreateStripeCustomerForUser } from '../../services/billing-customer.js';
import { getUserEntitlement } from '../../services/entitlements.js';
import { syncFromStripeEvent } from '../../services/subscription-sync.js';
import { getStripe } from '../../loaders/stripe.js';
import { requireSession, type RequestWithSession } from '../middleware/session.js';
import { getInstallFromToken } from '../../services/extension-session.js';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from '../../loaders/auth.js';

export const billingRouter = Router();

/** GET /api/billing/entitlement — session or extension Bearer token required. Returns current user entitlement. */
billingRouter.get('/entitlement', async (req: Request, res: Response) => {
  // Support extension Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const install = getInstallFromToken(token);
    if (install?.user_id) {
      const entitlement = getUserEntitlement(install.user_id);
      res.status(200).json(entitlement);
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
  res.status(200).json(entitlement);
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

      const body = req.body as { plan?: string };
      const priceId = body?.plan === 'team' ? config.STRIPE_PRICE_PRO_MONTHLY : config.STRIPE_PRICE_PRO_MONTHLY;

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

/** POST /api/billing/portal-session — session required. Returns { url } to redirect to Stripe Customer Portal. */
billingRouter.post(
  '/portal-session',
  requireSession,
  async (req: RequestWithSession, res: Response<{ url: string } | { error: string }>) => {
    try {
      const stripe = getStripe();
      const userId = req.session!.user.id;
      const email = req.session!.user.email ?? '';
      const name = req.session!.user.name ?? null;
      const customerId = await getOrCreateStripeCustomerForUser(userId, email, name);

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: config.STRIPE_PORTAL_RETURN_URL,
      });

      res.status(200).json({ url: session.url });
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
    res.status(400).send('Invalid body');
    return;
  }
  const sig = req.headers['stripe-signature'];
  if (typeof sig !== 'string' || !config.STRIPE_WEBHOOK_SECRET) {
    res.status(400).send('Missing signature or webhook secret');
    return;
  }
  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, sig, config.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).send('Invalid signature');
    return;
  }
  try {
    await syncFromStripeEvent(event);
    res.status(200).json({ received: true });
  } catch {
    res.status(500).json({ received: false });
  }
}
