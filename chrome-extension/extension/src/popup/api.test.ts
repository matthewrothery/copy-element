import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  RuntimeRequestError,
  formatCaptureStartError,
  openLibraryInNewTab,
  startCapture
} from "./api";

describe("popup api", () => {
  beforeEach(() => {
    vi.stubGlobal("chrome", {
      tabs: {
        query: vi.fn(async () => [{ id: 42 }]),
        create: vi.fn()
      },
      runtime: {
        sendMessage: vi.fn(async () => ({ ok: true, payload: null })),
        getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`)
      }
    });
  });

  it("sends START_CAPTURE with tabId", async () => {
    await startCapture();
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "START_CAPTURE",
      payload: { tabId: 42 }
    });
  });

  it("throws RuntimeRequestError for failed responses", async () => {
    vi.stubGlobal("chrome", {
      tabs: {
        query: vi.fn(async () => [{ id: 42 }])
      },
      runtime: {
        sendMessage: vi.fn(async () => ({ ok: false, code: "UNSUPPORTED_TAB_URL", error: "bad page" }))
      }
    });

    await expect(startCapture()).rejects.toBeInstanceOf(RuntimeRequestError);
  });

  it("formats capture start errors by code", () => {
    const formatted = formatCaptureStartError(new RuntimeRequestError("x", "UNSUPPORTED_TAB_URL"));
    expect(formatted).toBe("Capture is not supported on this page.");
  });

  it("opens app in new tab", () => {
    openLibraryInNewTab();
    expect(chrome.runtime.getURL).toHaveBeenCalledWith("app.html");
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "chrome-extension://mock-id/app.html"
    });
  });

  it("opens app with snippet id in query when provided", () => {
    openLibraryInNewTab("snippet-123");
    expect(chrome.runtime.getURL).toHaveBeenCalledWith("app.html");
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "chrome-extension://mock-id/app.html?snippet=snippet-123"
    });
  });
});
