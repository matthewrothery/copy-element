/**
 * Shared usage (monthly capture count) for free tier.
 * Used by content script (writes on save) and popup (reads for meter).
 */

export const SAVES_THIS_MONTH_KEY = "element-armory-saves-this-month";

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
 * Returns current month usage and limit. Used is 0 when stored month is not current.
 */
export async function getUsageThisMonth(): Promise<{ used: number; limit: number }> {
  if (typeof chrome === "undefined" || typeof chrome.storage?.local?.get !== "function") {
    return { used: 0, limit: FREE_TIER_MONTHLY_CAPTURE_LIMIT };
  }
  const result = await chrome.storage.local.get(SAVES_THIS_MONTH_KEY);
  const stored = result[SAVES_THIS_MONTH_KEY] as SavesThisMonth | undefined;
  const currentMonth = getCurrentMonthKey();
  const used =
    stored?.monthKey === currentMonth ? stored.count : 0;
  return { used, limit: FREE_TIER_MONTHLY_CAPTURE_LIMIT };
}
