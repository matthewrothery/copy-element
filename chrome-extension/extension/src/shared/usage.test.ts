import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCaptureLimit,
  getCurrentMonthKey,
  getMcpUsageThisMonth,
  getUsageThisMonth,
  getUsageTier,
  MCP_REQUESTS_THIS_MONTH_KEY,
  SAVES_THIS_MONTH_KEY
} from "./usage";

describe("usage", () => {
  describe("getCurrentMonthKey", () => {
    it("returns YYYY-MM format", () => {
      const key = getCurrentMonthKey();
      expect(key).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  describe("getCaptureLimit", () => {
    it("returns 10 for guest", () => {
      expect(getCaptureLimit("guest")).toBe(10);
    });
    it("returns 20 for free", () => {
      expect(getCaptureLimit("free")).toBe(20);
    });
    it("returns unlimited for pro", () => {
      expect(getCaptureLimit("pro")).toBe("unlimited");
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

    it("returns stored count and free limit for free plan", async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({
        [SAVES_THIS_MONTH_KEY]: { monthKey: currentMonth, count: 10 }
      });
      const result = await getUsageThisMonth("free");
      expect(result).toEqual({ used: 10, limit: 20 });
    });

    it("returns stored count and guest limit for guest plan", async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({
        [SAVES_THIS_MONTH_KEY]: { monthKey: currentMonth, count: 5 }
      });
      const result = await getUsageThisMonth("guest");
      expect(result).toEqual({ used: 5, limit: 10 });
    });

    it("returns unlimited limit for pro plan", async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({
        [SAVES_THIS_MONTH_KEY]: { monthKey: currentMonth, count: 3 }
      });
      const result = await getUsageThisMonth("pro");
      expect(result).toEqual({ used: 3, limit: "unlimited" });
    });

    it("returns 0 used when stored month is different", async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({
        [SAVES_THIS_MONTH_KEY]: { monthKey: "2020-01", count: 5 }
      });
      const result = await getUsageThisMonth("free");
      expect(result).toEqual({ used: 0, limit: 20 });
    });

    it("returns 0 used when storage is empty", async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({});
      const result = await getUsageThisMonth("free");
      expect(result).toEqual({ used: 0, limit: 20 });
    });

    it("returns 0 used and plan limit when chrome.storage is unavailable", async () => {
      vi.stubGlobal("chrome", undefined);
      const result = await getUsageThisMonth("free");
      expect(result).toEqual({ used: 0, limit: 20 });
    });
  });

  describe("getMcpUsageThisMonth", () => {
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

    it("returns stored MCP count and free limit", async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({
        [MCP_REQUESTS_THIS_MONTH_KEY]: { monthKey: currentMonth, count: 4 }
      });
      const result = await getMcpUsageThisMonth("free");
      expect(result).toEqual({ used: 4, limit: 10 });
    });

    it("returns 0 used when month is different", async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({
        [MCP_REQUESTS_THIS_MONTH_KEY]: { monthKey: "2020-01", count: 9 }
      });
      const result = await getMcpUsageThisMonth("free");
      expect(result).toEqual({ used: 0, limit: 10 });
    });

    it("returns 0 MCP access for guest", async () => {
      vi.mocked(chrome.storage.local.get).mockResolvedValue({});
      const result = await getMcpUsageThisMonth("guest");
      expect(result).toEqual({ used: 0, limit: 0 });
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
