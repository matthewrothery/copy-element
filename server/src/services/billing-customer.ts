import { getDb } from '../db/connection.js';
import { getStripe } from '../loaders/stripe.js';

export interface StripeCustomerRow {
  id: number;
  user_id: string;
  stripe_customer_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Returns the Stripe customer ID for the user, creating a Stripe customer and persisting the mapping if needed.
 * Caller must pass user email/name for creation (e.g. from session or user table).
 */
export async function getOrCreateStripeCustomerForUser(
  userId: string,
  email: string,
  name?: string | null
): Promise<string> {
  const db = getDb();
  const existing = db
    .prepare('SELECT stripe_customer_id FROM stripe_customers WHERE user_id = ?')
    .get(userId) as { stripe_customer_id: string } | undefined;

  if (existing) return existing.stripe_customer_id;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: email || undefined,
    name: name ?? undefined,
    metadata: { user_id: userId },
  });

  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO stripe_customers (user_id, stripe_customer_id, created_at, updated_at) VALUES (?, ?, ?, ?)'
  ).run(userId, customer.id, now, now);

  return customer.id;
}

export function getStripeCustomerIdByUserId(userId: string): string | null {
  const db = getDb();
  const row = db
    .prepare('SELECT stripe_customer_id FROM stripe_customers WHERE user_id = ?')
    .get(userId) as { stripe_customer_id: string } | undefined;
  return row?.stripe_customer_id ?? null;
}
