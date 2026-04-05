import { getDb } from '../db/connection.js';
import type { PlanCode } from './billing-plan-map.js';

const FREE_MONTHLY_LIMIT = 50;

export interface McpLimitCheck {
  allowed: boolean;
  callCount: number;
  limit: number | null;
}

export interface McpUsageRow {
  period: string;
  callCount: number;
  lastCallAt: number | null;
}

/**
 * Returns current period label as 'YYYY-MM'. This is a partition label, not stored as a timestamp.
 */
export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Increment MCP usage for user in current period. Returns new call_count.
 * weight = 1 for regular tools, 5 for convertCapture.
 */
export function incrementMcpUsage(userId: string, weight = 1): number {
  const db = getDb();
  const period = getCurrentPeriod();
  const now = Date.now();

  db.prepare(
    `INSERT INTO mcp_usage (user_id, period, call_count, last_call_at, first_call_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, period) DO UPDATE SET
       call_count = call_count + excluded.call_count,
       last_call_at = excluded.last_call_at`
  ).run(userId, period, weight, now, now);

  const row = db
    .prepare('SELECT call_count FROM mcp_usage WHERE user_id = ? AND period = ?')
    .get(userId, period) as { call_count: number } | undefined;

  return row?.call_count ?? weight;
}

/**
 * Check if user is within their plan's MCP call limit for the current period.
 * free: 50 weighted units/month; pro: unlimited.
 */
export function checkMcpLimit(userId: string, planCode: PlanCode): McpLimitCheck {
  const db = getDb();
  const period = getCurrentPeriod();
  const row = db
    .prepare('SELECT call_count FROM mcp_usage WHERE user_id = ? AND period = ?')
    .get(userId, period) as { call_count: number } | undefined;

  const callCount = row?.call_count ?? 0;

  if (planCode === 'free') {
    return {
      allowed: callCount < FREE_MONTHLY_LIMIT,
      callCount,
      limit: FREE_MONTHLY_LIMIT,
    };
  }

  return { allowed: true, callCount, limit: null };
}

/**
 * Get current period usage for a user.
 */
export function getMcpUsage(userId: string): McpUsageRow {
  const db = getDb();
  const period = getCurrentPeriod();
  const row = db
    .prepare('SELECT period, call_count, last_call_at FROM mcp_usage WHERE user_id = ? AND period = ?')
    .get(userId, period) as { period: string; call_count: number; last_call_at: number | null } | undefined;

  return {
    period,
    callCount: row?.call_count ?? 0,
    lastCallAt: row?.last_call_at ?? null,
  };
}
