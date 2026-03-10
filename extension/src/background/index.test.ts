import { beforeEach, describe, expect, it, vi } from "vitest";

describe("background helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("chrome", {
      tabs: {
        query: vi.fn(async () => []),
        get: vi.fn(async (tabId: number) => ({ id: tabId, url: "https://example.com" })),
        sendMessage: vi.fn(async () => undefined)
      },
      runtime: {
        onMessage: {
          addListener: vi.fn()
        },
        sendMessage: vi.fn(async () => undefined)
      }
    });
  });

  it("validates capturable urls", async () => {
    const mod = await import("./index");
    expect(mod.isCapturableUrl("https://example.com")).toBe(true);
    expect(mod.isCapturableUrl("chrome://settings")).toBe(false);
  });

  it("maps content-script receiver errors", async () => {
    const mod = await import("./index");
    expect(mod.getErrorCode(new Error("Receiving end does not exist."))).toBe("CONTENT_SCRIPT_UNREACHABLE");
  });

  it("resolves tab by explicit id first", async () => {
    const mod = await import("./index");
    const tab = await mod.resolveTargetTab({ tabId: 99 });
    expect(tab?.id).toBe(99);
    expect(chrome.tabs.get).toHaveBeenCalledWith(99);
  });
});
