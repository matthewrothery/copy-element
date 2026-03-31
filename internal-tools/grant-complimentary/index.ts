/**
 * Grant or revoke complimentary paid access for a user.
 *
 * Usage (run from internal-tools/):
 *   npm run grant-complimentary -- --email user@example.com
 *   npm run grant-complimentary -- --email user@example.com --plan pro
 *   npm run grant-complimentary -- --userId <id> --revoke
 *
 * Reads DATABASE_PATH from the server's .env file (../server/.env).
 * Override by setting DATABASE_PATH in the environment before running.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

// Load server .env so DATABASE_PATH resolves to the correct DB file
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../server/.env') });

const DATABASE_PATH = process.env['DATABASE_PATH'] ?? './data/element-armory.db';
const dbPath = DATABASE_PATH.startsWith('/')
  ? DATABASE_PATH
  : resolve(__dirname, '../../server', DATABASE_PATH);

type PlanCode = 'free' | 'pro' | 'team';

function parseArgs(): { userId?: string; email?: string; plan: PlanCode; revoke: boolean } {
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage:');
    console.log('  npm run grant-complimentary -- --email user@example.com [--plan pro|team]');
    console.log('  npm run grant-complimentary -- --userId <id> [--plan pro|team]');
    console.log('  npm run grant-complimentary -- --email user@example.com --revoke');
    process.exit(0);
  }

  const planArg = get('--plan') ?? 'pro';
  if (planArg !== 'pro' && planArg !== 'team') {
    console.error(`Invalid --plan "${planArg}". Must be "pro" or "team".`);
    process.exit(1);
  }

  return {
    userId: get('--userId'),
    email: get('--email'),
    plan: planArg as PlanCode,
    revoke: args.includes('--revoke'),
  };
}

function main(): void {
  const { userId: rawUserId, email, plan, revoke } = parseArgs();

  if (!rawUserId && !email) {
    console.error('Error: provide --userId <id> or --email <address>');
    process.exit(1);
  }

  const db = new Database(dbPath);

  let userId: string;
  if (rawUserId) {
    userId = rawUserId;
  } else {
    const row = db
      .prepare(`SELECT id FROM "user" WHERE email = ? LIMIT 1`)
      .get(email) as { id: string } | undefined;
    if (!row) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }
    userId = row.id;
    console.log(`Resolved email "${email}" → userId: ${userId}`);
  }

  const now = Date.now();

  if (revoke) {
    db.prepare(
      `UPDATE subscriptions SET status = 'canceled', updated_at = ?
       WHERE user_id = ? AND source = 'complimentary' AND status != 'canceled'`
    ).run(now, userId);
    console.log(`Complimentary access revoked for user ${userId}`);
  } else {
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
    ).run(userId, syntheticCustId, syntheticSubId, plan, now, now, now);

    console.log(`Complimentary "${plan}" access granted for user ${userId}`);
  }

  const grant = db
    .prepare(
      `SELECT id, plan_code, status, created_at FROM subscriptions
       WHERE user_id = ? AND source = 'complimentary'
       ORDER BY created_at DESC LIMIT 1`
    )
    .get(userId) as { id: number; plan_code: string; status: string; created_at: number } | undefined;

  const entRow = db
    .prepare(
      `SELECT plan_code, status, current_period_end, cancel_at_period_end
       FROM subscriptions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`
    )
    .get(userId) as { plan_code: string; status: string } | undefined;

  console.log('\nCurrent state:');
  console.log(`  Grant record:  ${grant ? `status=${grant.status}, plan=${grant.plan_code}` : 'none'}`);
  console.log(`  Entitlement:   plan=${entRow?.plan_code ?? 'free'}, status=${entRow?.status ?? 'inactive'}`);

  db.close();
}

main();
