import { getDb } from '../db/connection.js';
import type { PlanCode } from './billing-plan-map.js';

export interface ComplimentaryGrant {
  id: number;
  plan_code: PlanCode;
  status: string;
  created_at: number;
}

/**
 * Grant a user complimentary paid access by inserting a synthetic active subscription row.
 * Any existing active complimentary grant for the user is canceled first.
 */
export function grantComplimentary(userId: string, planCode: PlanCode = 'pro'): void {
  const db = getDb();
  const now = Date.now();

  db.prepare(
    `UPDATE subscriptions SET status = 'canceled', updated_at = ?
     WHERE user_id = ? AND source = 'complimentary' AND status != 'canceled'`
  ).run(now, userId);

  const syntheticSubId = `comp_sub_${userId}_${now}`;
  const syntheticCustId = `comp_cust_${userId}`;

  db.prepare(
    `INSERT INTO subscriptions
       (user_id, stripe_customer_id, stripe_subscription_id, plan_code, status,
        current_period_start, current_period_end, cancel_at_period_end,
        source, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, NULL, 0, 'complimentary', ?, ?)`
  ).run(userId, syntheticCustId, syntheticSubId, planCode, now, now, now);
}

/**
 * Revoke all active complimentary grants for a user.
 */
export function revokeComplimentary(userId: string): void {
  const db = getDb();
  db.prepare(
    `UPDATE subscriptions SET status = 'canceled', updated_at = ?
     WHERE user_id = ? AND source = 'complimentary' AND status != 'canceled'`
  ).run(Date.now(), userId);
}

/**
 * Get the most recent complimentary grant record for a user (active or canceled).
 */
export function getComplimentaryGrant(userId: string): ComplimentaryGrant | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, plan_code, status, created_at FROM subscriptions
       WHERE user_id = ? AND source = 'complimentary'
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(userId) as ComplimentaryGrant | undefined;
}
