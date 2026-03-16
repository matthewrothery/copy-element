import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FREE_TIER_MONTHLY_CAPTURE_LIMIT,
  getCurrentMonthKey,
  getUsageThisMonth,
  SAVES_THIS_MONTH_KEY
} from "./usage";

describe("usage", () => {
  describe("getCurrentMonthKey", () => {
    it("returns YYYY-MM format", () => {
      const key = getCurrentMonthKey();
      expect(key).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe("getUsageThisMonth", () => {
    const currentMonth = getCurrentMonthKey();

    beforeEach(() => {
      vi.stubGlobal("chrome", {
        storage: {
          local: {
            get: vi.fn()
          }
        }
      });
    });

    it("returns stored count when month matches", async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({
        [SAVES_THIS_MONTH_KEY]: { monthKey: currentMonth, count: 10 }
      });
      const result = await getUsageThisMonth();
      expect(result).toEqual({ used: 10, limit: FREE_TIER_MONTHLY_CAPTURE_LIMIT });
    });

    it("returns 0 used when stored month is different", async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({
        [SAVES_THIS_MONTH_KEY]: { monthKey: "2020-01", count: 5 }
      });
      const result = await getUsageThisMonth();
      expect(result).toEqual({ used: 0, limit: FREE_TIER_MONTHLY_CAPTURE_LIMIT });
    });

    it("returns 0 used when storage is empty", async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({});
      const result = await getUsageThisMonth();
      expect(result).toEqual({ used: 0, limit: FREE_TIER_MONTHLY_CAPTURE_LIMIT });
    });

    it("returns 0 used and limit when chrome.storage is unavailable", async () => {
      vi.stubGlobal("chrome", undefined);
      const result = await getUsageThisMonth();
      expect(result).toEqual({ used: 0, limit: FREE_TIER_MONTHLY_CAPTURE_LIMIT });
    });
  });
});
