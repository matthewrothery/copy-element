import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FREE_LIBRARY_LIMIT,
  FREE_TIER_MONTHLY_CAPTURE_LIMIT,
  getCurrentMonthKey,
  getUsageThisMonth,
  getUsageTier,
  GUEST_LIBRARY_LIMIT,
  PAID_PLANS,
  SAVES_THIS_MONTH_KEY
} from "./usage";

describe("usage", () => {
  describe("tier limit constants", () => {
    it("GUEST_LIBRARY_LIMIT is 10", () => {
      expect(GUEST_LIBRARY_LIMIT).toBe(10);
    });

    it("FREE_LIBRARY_LIMIT is 25", () => {
      expect(FREE_LIBRARY_LIMIT).toBe(25);
    });

    it("FREE_LIBRARY_LIMIT is greater than GUEST_LIBRARY_LIMIT", () => {
      expect(FREE_LIBRARY_LIMIT).toBeGreaterThan(GUEST_LIBRARY_LIMIT);
    });

    it("PAID_PLANS contains pro and team", () => {
      expect(PAID_PLANS).toContain("pro");
      expect(PAID_PLANS).toContain("team");
    });
  });

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

  describe("getUsageTier", () => {
    it("returns quiet for 0-39%", () => {
      expect(getUsageTier(0)).toBe("quiet");
      expect(getUsageTier(0.39)).toBe("quiet");
    });

    it("returns default for 40-69%", () => {
      expect(getUsageTier(0.4)).toBe("default");
      expect(getUsageTier(0.69)).toBe("default");
    });

    it("returns noticeable for 70-89%", () => {
      expect(getUsageTier(0.7)).toBe("noticeable");
      expect(getUsageTier(0.89)).toBe("noticeable");
    });

    it("returns urgent for 90%+", () => {
      expect(getUsageTier(0.9)).toBe("urgent");
      expect(getUsageTier(1)).toBe("urgent");
    });
  });
});
