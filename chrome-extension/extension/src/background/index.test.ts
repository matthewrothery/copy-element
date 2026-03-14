import { beforeEach, describe, expect, it, vi } from "vitest";

const CAPTURE_DATA_URL = "data:image/png;base64,captured";

describe("background helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("chrome", {
      tabs: {
        query: vi.fn(async () => []),
        get: vi.fn(async (tabId: number) => ({
          id: tabId,
          windowId: 100,
          url: "https://example.com"
        })),
        sendMessage: vi.fn(async () => undefined),
        captureVisibleTab: vi.fn(async () => CAPTURE_DATA_URL)
      },
      webNavigation: {
        getAllFrames: vi.fn((details: { tabId: number }, cb: (frames?: { frameId: number }[]) => void) => {
          cb([{ frameId: 0 }]);
        })
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

  it("CAPTURE_VISIBLE_TAB returns viewport data URL", async () => {
    vi.resetModules();
    (chrome.tabs.query as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 1, windowId: 100, url: "https://example.com" }
    ]);
    await import("./index");
    const addListener = (chrome.runtime.onMessage as { addListener: ReturnType<typeof vi.fn> }).addListener;
    expect(addListener).toHaveBeenCalled();
    const listener = addListener.mock.calls[0][0] as (
      msg: { type: string },
      _s: unknown,
      sendResponse: (r: unknown) => void
    ) => void;
    const sendResponse = vi.fn();
    listener({ type: "CAPTURE_VISIBLE_TAB" }, {}, sendResponse);
    await new Promise((r) => setTimeout(r, 0));
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      payload: { dataUrl: CAPTURE_DATA_URL }
    });
    expect(chrome.tabs.captureVisibleTab).toHaveBeenCalledWith(100, { format: "png" });
  });

  it("BROADCAST_CANCEL_CAPTURE sends CANCEL_CAPTURE to all frames", async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    (chrome.tabs.sendMessage as ReturnType<typeof vi.fn>) = sendMessage;
    (chrome.webNavigation.getAllFrames as ReturnType<typeof vi.fn>).mockImplementation(
      (_: { tabId: number }, cb: (frames: { frameId: number }[]) => void) => {
        cb([{ frameId: 0 }, { frameId: 101 }]);
      }
    );
    vi.resetModules();
    await import("./index");
    const addListener = (chrome.runtime.onMessage as { addListener: ReturnType<typeof vi.fn> }).addListener;
    const listener = addListener.mock.calls[0][0] as (
      msg: { type: string },
      sender: { tab?: { id: number }; frameId?: number },
      sendResponse: (r: unknown) => void
    ) => void;
    const sendResponse = vi.fn();
    listener({ type: "BROADCAST_CANCEL_CAPTURE" }, { tab: { id: 1 }, frameId: 0 }, sendResponse);
    await new Promise((r) => setTimeout(r, 0));
    expect(sendMessage).toHaveBeenCalledWith(1, { type: "CANCEL_CAPTURE" }, { frameId: 0 });
    expect(sendMessage).toHaveBeenCalledWith(1, { type: "CANCEL_CAPTURE" }, { frameId: 101 });
    expect(sendResponse).toHaveBeenCalledWith({ ok: true, payload: null });
  });

  it("FRAME_HOVER_ACTIVE sends CLEAR_FRAME_HOVER to other frames only", async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    (chrome.tabs.sendMessage as ReturnType<typeof vi.fn>) = sendMessage;
    (chrome.webNavigation.getAllFrames as ReturnType<typeof vi.fn>).mockImplementation(
      (_: { tabId: number }, cb: (frames: { frameId: number }[]) => void) => {
        cb([{ frameId: 0 }, { frameId: 101 }, { frameId: 102 }]);
      }
    );
    vi.resetModules();
    await import("./index");
    const addListener = (chrome.runtime.onMessage as { addListener: ReturnType<typeof vi.fn> }).addListener;
    const listener = addListener.mock.calls[0][0] as (
      msg: { type: string },
      sender: { tab?: { id: number }; frameId?: number },
      sendResponse: (r: unknown) => void
    ) => void;
    const sendResponse = vi.fn();
    listener({ type: "FRAME_HOVER_ACTIVE" }, { tab: { id: 1 }, frameId: 101 }, sendResponse);
    await new Promise((r) => setTimeout(r, 0));
    expect(sendMessage).toHaveBeenCalledWith(1, { type: "CLEAR_FRAME_HOVER" }, { frameId: 0 });
    expect(sendMessage).toHaveBeenCalledWith(1, { type: "CLEAR_FRAME_HOVER" }, { frameId: 102 });
    expect(sendMessage).not.toHaveBeenCalledWith(1, expect.anything(), { frameId: 101 });
    expect(sendResponse).toHaveBeenCalledWith({ ok: true, payload: null });
  });

  it("EXTRACT_CSS_VIA_CDP returns failure for iframe (frameId !== 0) without calling CDP", async () => {
    vi.resetModules();
    await import("./index");
    const addListener = (chrome.runtime.onMessage as { addListener: ReturnType<typeof vi.fn> }).addListener;
    const listener = addListener.mock.calls[0][0] as (
      msg: { type: string; payload?: { selectors: string[]; baseUrl: string } },
      sender: { tab?: { id: number }; frameId?: number },
      sendResponse: (r: unknown) => void
    ) => void;
    const sendResponse = vi.fn();
    listener(
      {
        type: "EXTRACT_CSS_VIA_CDP",
        payload: { selectors: ["[data-x=1]"], baseUrl: "https://example.com" }
      },
      { tab: { id: 1 }, frameId: 101 },
      sendResponse
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: false,
        error: expect.stringContaining("iframe")
      })
    );
  });
});
