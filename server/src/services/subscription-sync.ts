import type Stripe from 'stripe';
import { getDb } from '../db/connection.js';
import { priceIdToPlanCode, type SubscriptionStatus } from './billing-plan-map.js';

const now = (): string => new Date().toISOString();

function normalizeStatus(stripeStatus: string): SubscriptionStatus {
  const s = stripeStatus?.toLowerCase();
  if (s === 'active' || s === 'trialing' || s === 'past_due' || s === 'canceled') return s as SubscriptionStatus;
  if (s === 'incomplete' || s === 'incomplete_expired' || s === 'unpaid') return 'inactive';
  return 'inactive';
}

function upsertSubscription(
  userId: string,
  stripeCustomerId: string,
  stripeSubscription: Stripe.Subscription
): void {
  const db = getDb();
  const priceId = stripeSubscription.items?.data?.[0]?.price?.id ?? null;
  const planCode = priceIdToPlanCode(priceId);
  const status = normalizeStatus(stripeSubscription.status);
  const periodStart = stripeSubscription.current_period_start
    ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
    : null;
  const periodEnd = stripeSubscription.current_period_end
    ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
    : null;
  const cancelAtPeriodEnd = stripeSubscription.cancel_at_period_end ? 1 : 0;

  const existing = db
    .prepare('SELECT id FROM subscriptions WHERE stripe_subscription_id = ?')
    .get(stripeSubscription.id) as { id: number } | undefined;

  const updatedAt = now();
  if (existing) {
    db.prepare(
      `UPDATE subscriptions SET user_id = ?, stripe_customer_id = ?, plan_code = ?, status = ?,
       current_period_start = ?, current_period_end = ?, cancel_at_period_end = ?, updated_at = ?
       WHERE stripe_subscription_id = ?`
    ).run(
      userId,
      stripeCustomerId,
      planCode,
      status,
      periodStart,
      periodEnd,
      cancelAtPeriodEnd,
      updatedAt,
      stripeSubscription.id
    );
  } else {
    db.prepare(
      `INSERT INTO subscriptions (user_id, stripe_customer_id, stripe_subscription_id, plan_code, status,
       current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      userId,
      stripeCustomerId,
      stripeSubscription.id,
      planCode,
      status,
      periodStart,
      periodEnd,
      cancelAtPeriodEnd,
      updatedAt,
      updatedAt
    );
  }
}

function recordEvent(
  stripeEventId: string,
  stripeEventType: string,
  payloadJson: string,
  processingStatus: 'processed' | 'ignored' | 'failed',
  errorMessage: string | null = null
): void {
  const db = getDb();
  const processedAt = now();
  db.prepare(
    `INSERT INTO subscription_events (stripe_event_id, stripe_event_type, payload_json, processed_at, processing_status, error_message)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(stripeEventId, stripeEventType, payloadJson, processedAt, processingStatus, errorMessage);
}

/**
 * Idempotent: if stripe_event_id already in subscription_events, skip processing and return.
 */
function alreadyProcessed(stripeEventId: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT 1 FROM subscription_events WHERE stripe_event_id = ?')
    .get(stripeEventId) as { '1': number } | undefined;
  return !!row;
}

function getUserIdByStripeCustomerId(stripeCustomerId: string): string | null {
  const db = getDb();
  const row = db
    .prepare('SELECT user_id FROM stripe_customers WHERE stripe_customer_id = ?')
    .get(stripeCustomerId) as { user_id: string } | undefined;
  return row?.user_id ?? null;
}

/**
 * Sync application state from a Stripe webhook event. Idempotent by stripe_event_id.
 * Writes to subscription_events for audit and deduplication.
 */
export async function syncFromStripeEvent(event: Stripe.Event): Promise<void> {
  const eventId = event.id;
  const eventType = event.type;
  const payloadJson = JSON.stringify(event.data?.object ?? {});

  if (alreadyProcessed(eventId)) return;

  try {
    const { getStripe } = await import('../loaders/stripe.js');
    const stripe = getStripe();

    switch (eventType) {
      case 'checkout.session.completed': {
        const session = event.data?.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription' || !session.subscription) break;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const userId = session.client_reference_id ?? (customerId ? getUserIdByStripeCustomerId(customerId) : null);
        if (!userId || !customerId) break;
        const sub = await stripe.subscriptions.retrieve(session.subscription as string);
        upsertSubscription(userId, customerId, sub);
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data?.object as Stripe.Subscription;
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
        const userId = customerId ? getUserIdByStripeCustomerId(customerId) : null;
        if (userId && customerId) upsertSubscription(userId, customerId, sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data?.object as Stripe.Subscription;
        const db = getDb();
        db.prepare('UPDATE subscriptions SET status = ? WHERE stripe_subscription_id = ?').run('canceled', sub.id);
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const invoice = event.data?.object as Stripe.Invoice;
        const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
        if (!subId) break;
        const sub = await stripe.subscriptions.retrieve(subId);
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
        const userId = customerId ? getUserIdByStripeCustomerId(customerId) : null;
        if (userId && customerId) {
          if (eventType === 'invoice.payment_failed') {
            upsertSubscription(userId, customerId, { ...sub, status: 'past_due' as Stripe.Subscription.Status });
          } else {
            upsertSubscription(userId, customerId, sub);
          }
        }
        break;
      }
      default:
        break;
    }
    recordEvent(eventId, eventType, payloadJson, 'processed');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    recordEvent(eventId, eventType, payloadJson, 'failed', message);
    throw err;
  }
}
