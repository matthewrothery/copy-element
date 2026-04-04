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
        onInstalled: { addListener: vi.fn() },
        onStartup: { addListener: vi.fn() },
        onMessage: { addListener: vi.fn() },
        sendMessage: vi.fn(async () => undefined),
        getURL: vi.fn((path: string) => `chrome-extension://fake/${path}`)
      },
      alarms: {
        onAlarm: { addListener: vi.fn() },
        create: vi.fn(async () => undefined),
        clear: vi.fn(async () => undefined)
      },
      storage: {
        local: {
          get: vi.fn(async () => ({})),
          set: vi.fn(async () => undefined)
        }
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

  // --- Auth flow ---

  it("EXCHANGE_AUTH_CODE: saves token, closes tab, and responds success", async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: "new-jwt", expires_at: "2030-01-01T00:00:00Z" }),
    }));
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      "element-armory-install-id": "inst-id",
      "element-armory-install-secret": "inst-secret",
    });
    const tabRemove = vi.fn().mockResolvedValue(undefined);
    (chrome.tabs as Record<string, unknown>).remove = tabRemove;

    await import("./index");
    const listener = (chrome.runtime.onMessage as { addListener: ReturnType<typeof vi.fn> })
      .addListener.mock.calls[0][0] as (
        msg: { type: string; payload?: unknown },
        sender: { tab?: { id?: number } },
        sendResponse: (r: unknown) => void
      ) => void;

    const sendResponse = vi.fn();
    listener(
      { type: "EXCHANGE_AUTH_CODE", payload: { code: "oauth-code-123", install_id: "inst-id" } },
      { tab: { id: 99 } },
      sendResponse
    );
    await new Promise((r) => setTimeout(r, 0));

    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ "element-armory-auth-token": "new-jwt" })
    );
    expect(tabRemove).toHaveBeenCalledWith(99);
    expect(sendResponse).toHaveBeenCalledWith({ ok: true, payload: null });
  });

  it("EXCHANGE_AUTH_CODE: responds with failure when server returns non-ok", async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 401 }));
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      "element-armory-install-id": "inst-id",
      "element-armory-install-secret": "inst-secret",
    });

    await import("./index");
    const listener = (chrome.runtime.onMessage as { addListener: ReturnType<typeof vi.fn> })
      .addListener.mock.calls[0][0] as (
        msg: { type: string; payload?: unknown },
        sender: unknown,
        sendResponse: (r: unknown) => void
      ) => void;

    const sendResponse = vi.fn();
    listener(
      { type: "EXCHANGE_AUTH_CODE", payload: { code: "bad-code", install_id: "" } },
      {},
      sendResponse
    );
    await new Promise((r) => setTimeout(r, 0));

    expect(sendResponse).toHaveBeenCalledWith(
      expect.objectContaining({ ok: false })
    );
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it("GET_AUTH_STATE: returns signed-out state when no token stored", async () => {
    vi.resetModules();
    await import("./index");
    const listener = (chrome.runtime.onMessage as { addListener: ReturnType<typeof vi.fn> })
      .addListener.mock.calls[0][0] as (
        msg: { type: string },
        sender: unknown,
        sendResponse: (r: unknown) => void
      ) => void;

    const sendResponse = vi.fn();
    listener({ type: "GET_AUTH_STATE" }, {}, sendResponse);
    await new Promise((r) => setTimeout(r, 0));

    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      payload: { signed_in: false, user_email: null, user_plan: null },
    });
  });

  it("GET_AUTH_STATE: returns signed-in state when token and profile are stored", async () => {
    vi.resetModules();
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      "element-armory-auth-token": "auth-tok",
      "element-armory-user-email": "user@example.com",
      "element-armory-user-plan": "pro",
    });

    await import("./index");
    const listener = (chrome.runtime.onMessage as { addListener: ReturnType<typeof vi.fn> })
      .addListener.mock.calls[0][0] as (
        msg: { type: string },
        sender: unknown,
        sendResponse: (r: unknown) => void
      ) => void;

    const sendResponse = vi.fn();
    listener({ type: "GET_AUTH_STATE" }, {}, sendResponse);
    await new Promise((r) => setTimeout(r, 0));

    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      payload: { signed_in: true, user_email: "user@example.com", user_plan: "pro" },
    });
  });

  // --- MCP flow ---

  it("GENERATE_MCP_TOKEN: returns failure when user is not signed in", async () => {
    vi.resetModules();
    await import("./index");
    const listener = (chrome.runtime.onMessage as { addListener: ReturnType<typeof vi.fn> })
      .addListener.mock.calls[0][0] as (
        msg: { type: string },
        sender: unknown,
        sendResponse: (r: unknown) => void
      ) => void;

    const sendResponse = vi.fn();
    listener({ type: "GENERATE_MCP_TOKEN" }, {}, sendResponse);
    await new Promise((r) => setTimeout(r, 0));

    expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
  });

  it("GENERATE_MCP_TOKEN: fetches token, saves API key, and responds with api_key", async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ code: "mcp-key-123", mcp_url: "https://mcp.example.com/mcp" }),
    }));
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      "element-armory-auth-token": "auth-tok",
      "element-armory-install-id": "inst-id",
      "element-armory-install-secret": "inst-secret",
    });

    await import("./index");
    const listener = (chrome.runtime.onMessage as { addListener: ReturnType<typeof vi.fn> })
      .addListener.mock.calls[0][0] as (
        msg: { type: string },
        sender: unknown,
        sendResponse: (r: unknown) => void
      ) => void;

    const sendResponse = vi.fn();
    listener({ type: "GENERATE_MCP_TOKEN" }, {}, sendResponse);
    await new Promise((r) => setTimeout(r, 0));

    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ "element-armory-mcp-api-key": "mcp-key-123" })
    );
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      payload: { api_key: "mcp-key-123" },
    });
  });

  it("ROTATE_MCP_TOKEN: returns failure when user is not signed in", async () => {
    vi.resetModules();
    await import("./index");
    const listener = (chrome.runtime.onMessage as { addListener: ReturnType<typeof vi.fn> })
      .addListener.mock.calls[0][0] as (
        msg: { type: string },
        sender: unknown,
        sendResponse: (r: unknown) => void
      ) => void;

    const sendResponse = vi.fn();
    listener({ type: "ROTATE_MCP_TOKEN" }, {}, sendResponse);
    await new Promise((r) => setTimeout(r, 0));

    expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
  });

  it("ROTATE_MCP_TOKEN: rotates token, saves new key, and responds with api_key", async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ code: "mcp-rotated-key", mcp_url: "https://mcp.example.com/mcp" }),
    }));
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      "element-armory-auth-token": "auth-tok",
    });

    await import("./index");
    const listener = (chrome.runtime.onMessage as { addListener: ReturnType<typeof vi.fn> })
      .addListener.mock.calls[0][0] as (
        msg: { type: string },
        sender: unknown,
        sendResponse: (r: unknown) => void
      ) => void;

    const sendResponse = vi.fn();
    listener({ type: "ROTATE_MCP_TOKEN" }, {}, sendResponse);
    await new Promise((r) => setTimeout(r, 0));

    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ "element-armory-mcp-api-key": "mcp-rotated-key" })
    );
    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      payload: { api_key: "mcp-rotated-key" },
    });
  });

  it("GET_MCP_TOKEN_META: returns failure when user is not signed in", async () => {
    vi.resetModules();
    await import("./index");
    const listener = (chrome.runtime.onMessage as { addListener: ReturnType<typeof vi.fn> })
      .addListener.mock.calls[0][0] as (
        msg: { type: string },
        sender: unknown,
        sendResponse: (r: unknown) => void
      ) => void;

    const sendResponse = vi.fn();
    listener({ type: "GET_MCP_TOKEN_META" }, {}, sendResponse);
    await new Promise((r) => setTimeout(r, 0));

    expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({ ok: false }));
  });

  it("GET_MCP_TOKEN_META: returns token metadata from server", async () => {
    vi.resetModules();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ exists: true, created_at: 1700000000000, last_used_at: 1700001000000 }),
    }));
    (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      "element-armory-auth-token": "auth-tok",
    });

    await import("./index");
    const listener = (chrome.runtime.onMessage as { addListener: ReturnType<typeof vi.fn> })
      .addListener.mock.calls[0][0] as (
        msg: { type: string },
        sender: unknown,
        sendResponse: (r: unknown) => void
      ) => void;

    const sendResponse = vi.fn();
    listener({ type: "GET_MCP_TOKEN_META" }, {}, sendResponse);
    await new Promise((r) => setTimeout(r, 0));

    expect(sendResponse).toHaveBeenCalledWith({
      ok: true,
      payload: { exists: true, created_at: 1700000000000, last_used_at: 1700001000000 },
    });
  });
});
