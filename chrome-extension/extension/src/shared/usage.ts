/**
 * Shared usage tracking (monthly capture and MCP request counts).
 * Used by content script (writes on save) and popup (reads for meter).
 */

import type { PlanCode } from "./types/plan";
import { PLAN_FEATURES } from "./types/plan";

export const SAVES_THIS_MONTH_KEY = "element-armory-saves-this-month";
export const MCP_REQUESTS_THIS_MONTH_KEY = "element-armory-mcp-requests-this-month";

export const FREE_TIER_MONTHLY_CAPTURE_LIMIT = 20;

/** Threshold (0–1) above which to show upgrade hint. */
export const USAGE_HINT_THRESHOLD = 0.7;

/** Tier boundaries (0–1). Quiet 0–39%, default 40–69%, noticeable 70–89%, urgent 90%+. */
export const USAGE_TIER_QUIET_MAX = 0.4;
export const USAGE_TIER_NOTICEABLE_MAX = 0.69;
export const USAGE_TIER_URGENT_MIN = 0.9;

export type UsageTier = "quiet" | "default" | "noticeable" | "urgent";

/**
 * Returns the emphasis tier for a given usage ratio (0–1).
 */
export function getUsageTier(ratio: number): UsageTier {
  if (ratio < USAGE_TIER_QUIET_MAX) return "quiet";
  if (ratio <= USAGE_TIER_NOTICEABLE_MAX) return "default";
  if (ratio < USAGE_TIER_URGENT_MIN) return "noticeable";
  return "urgent";
}

export interface SavesThisMonth {
  monthKey: string;
  count: number;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/**
 * Returns the capture limit for a given plan.
 */
export function getCaptureLimit(plan: PlanCode): number | "unlimited" {
  return PLAN_FEATURES[plan].capturesPerMonth;
}

/**
 * Returns current month capture usage and the plan's capture limit.
 */
export async function getUsageThisMonth(plan: PlanCode): Promise<{ used: number; limit: number | "unlimited" }> {
  if (typeof chrome === "undefined" || typeof chrome.storage?.local?.get !== "function") {
    return { used: 0, limit: PLAN_FEATURES[plan].capturesPerMonth };
  }
  const result = await chrome.storage.local.get(SAVES_THIS_MONTH_KEY);
  const stored = result[SAVES_THIS_MONTH_KEY] as SavesThisMonth | undefined;
  const currentMonth = getCurrentMonthKey();
  const used =
    stored?.monthKey === currentMonth ? stored.count : 0;
  return { used, limit: PLAN_FEATURES[plan].capturesPerMonth };
}

/**
 * Returns current month MCP request usage and the plan's MCP limit.
 */
export async function getMcpUsageThisMonth(plan: PlanCode): Promise<{ used: number; limit: number | "unlimited" }> {
  if (typeof chrome === "undefined" || typeof chrome.storage?.local?.get !== "function") {
    return { used: 0, limit: PLAN_FEATURES[plan].mcpRequestsPerMonth };
  }
  const result = await chrome.storage.local.get(MCP_REQUESTS_THIS_MONTH_KEY);
  const stored = result[MCP_REQUESTS_THIS_MONTH_KEY] as SavesThisMonth | undefined;
  const currentMonth = getCurrentMonthKey();
  const used =
    stored?.monthKey === currentMonth ? stored.count : 0;
  return { used, limit: PLAN_FEATURES[plan].mcpRequestsPerMonth };
}
