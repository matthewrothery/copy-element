/**
 * Map Stripe price IDs to internal plan codes. Entitlements use plan_code, not raw Stripe IDs.
 */

import { config } from '../config/index.js';

export const PLAN_CODES = ['free', 'pro', 'team'] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export const SUBSCRIPTION_STATUSES = ['active', 'inactive', 'trialing', 'past_due', 'canceled'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

/** Stripe subscription statuses we treat as active for entitlement. */
export const ACTIVE_STATUSES: SubscriptionStatus[] = ['active', 'trialing'];

/**
 * Resolve Stripe price ID to plan_code. Unknown prices map to 'free' so we never grant paid access by mistake.
 */
export function priceIdToPlanCode(priceId: string | null | undefined): PlanCode {
  if (!priceId) return 'free';
  if (priceId === config.STRIPE_PRICE_PRO_MONTHLY) return 'pro';
  if (priceId === config.STRIPE_PRICE_PRO_YEARLY) return 'pro';
  return 'free';
}
