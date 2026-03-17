import { getDb } from '../db/connection.js';
import { ACTIVE_STATUSES, type PlanCode, type SubscriptionStatus } from './billing-plan-map.js';

export interface UserEntitlement {
  plan_code: PlanCode;
  status: SubscriptionStatus;
  active: boolean;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

/**
 * Get the effective entitlement for a user from internal subscription state.
 * Never calls Stripe; use subscription sync (webhooks) to keep state up to date.
 */
export function getUserEntitlement(userId: string): UserEntitlement {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT plan_code, status, current_period_end, cancel_at_period_end
       FROM subscriptions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`
    )
    .get(userId) as
    | { plan_code: PlanCode; status: SubscriptionStatus; current_period_end: string | null; cancel_at_period_end: number }
    | undefined;

  if (!row) {
    return {
      plan_code: 'free',
      status: 'inactive',
      active: false,
      current_period_end: null,
      cancel_at_period_end: false,
    };
  }

  const active = ACTIVE_STATUSES.includes(row.status);
  return {
    plan_code: row.plan_code,
    status: row.status,
    active,
    current_period_end: row.current_period_end,
    cancel_at_period_end: Boolean(row.cancel_at_period_end),
  };
}

/**
 * Returns true if the user has an active paid plan (active or trialing, plan not free).
 */
export function hasActivePaidPlan(userId: string): boolean {
  const ent = getUserEntitlement(userId);
  return ent.active && ent.plan_code !== 'free';
}
