import { beforeEach, describe, expect, it, vi } from "vitest";
import { RuntimeRequestError, formatCaptureStartError, startCapture } from "./api";

describe("popup api", () => {
  beforeEach(() => {
    vi.stubGlobal("chrome", {
      tabs: {
        query: vi.fn(async () => [{ id: 42 }])
      },
      runtime: {
        sendMessage: vi.fn(async () => ({ ok: true, payload: null }))
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
});
