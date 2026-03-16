/**
 * Shared usage (monthly capture count) for free tier.
 * Used by content script (writes on save) and popup (reads for meter).
 */

export const SAVES_THIS_MONTH_KEY = "element-armory-saves-this-month";

export const FREE_TIER_MONTHLY_CAPTURE_LIMIT = 20;

/** Threshold (0–1) above which to show upgrade hint. */
export const USAGE_HINT_THRESHOLD = 0.7;

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
