import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useCaptureSyncStatus } from "./useCaptureSyncStatus";

type MessageListener = (message: unknown) => void;

function setupChromeRuntime(): { listeners: MessageListener[] } {
  const listeners: MessageListener[] = [];

  vi.stubGlobal("chrome", {
    runtime: {
      onMessage: {
        addListener: vi.fn((listener: MessageListener) => listeners.push(listener)),
        removeListener: vi.fn((listener: MessageListener) => {
          const index = listeners.indexOf(listener);
          if (index >= 0) listeners.splice(index, 1);
        }),
      },
    },
  });

  return { listeners };
}

describe("useCaptureSyncStatus", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("starts idle", () => {
    setupChromeRuntime();
    const { result } = renderHook(() => useCaptureSyncStatus());

    expect(result.current).toEqual({ phase: null, message: "" });
  });

  it("enters the start phase on a CAPTURE_SYNC_STATUS start broadcast", () => {
    const { listeners } = setupChromeRuntime();
    const { result } = renderHook(() => useCaptureSyncStatus());

    act(() => {
      listeners.forEach((listener) =>
        listener({ type: "CAPTURE_SYNC_STATUS", payload: { phase: "start", total: 2 } })
      );
    });

    expect(result.current.phase).toBe("start");
    expect(result.current.message).toBe("Syncing your captures…");
  });

  it("describes a successful done broadcast with the synced count", () => {
    const { listeners } = setupChromeRuntime();
    const { result } = renderHook(() => useCaptureSyncStatus());

    act(() => {
      listeners.forEach((listener) =>
        listener({
          type: "CAPTURE_SYNC_STATUS",
          payload: { phase: "done", total: 2, synced: 2, failed: 0 },
        })
      );
    });

    expect(result.current.phase).toBe("done");
    expect(result.current.message).toBe("2 captures synced");
  });

  it("uses singular wording when exactly one capture synced", () => {
    const { listeners } = setupChromeRuntime();
    const { result } = renderHook(() => useCaptureSyncStatus());

    act(() => {
      listeners.forEach((listener) =>
        listener({
          type: "CAPTURE_SYNC_STATUS",
          payload: { phase: "done", total: 1, synced: 1, failed: 0 },
        })
      );
    });

    expect(result.current.message).toBe("1 capture synced");
  });

  it("describes a done broadcast with failures using degraded copy", () => {
    const { listeners } = setupChromeRuntime();
    const { result } = renderHook(() => useCaptureSyncStatus());

    act(() => {
      listeners.forEach((listener) =>
        listener({
          type: "CAPTURE_SYNC_STATUS",
          payload: { phase: "done", total: 2, synced: 1, failed: 1 },
        })
      );
    });

    expect(result.current.message).toBe("Some captures didn't sync — they'll retry automatically.");
  });

  it("auto-dismisses the done message after the delay", async () => {
    const { listeners } = setupChromeRuntime();
    const { result } = renderHook(() => useCaptureSyncStatus());

    act(() => {
      listeners.forEach((listener) =>
        listener({
          type: "CAPTURE_SYNC_STATUS",
          payload: { phase: "done", total: 1, synced: 1, failed: 0 },
        })
      );
    });
    expect(result.current.phase).toBe("done");

    await waitFor(() => expect(result.current).toEqual({ phase: null, message: "" }), {
      timeout: 3000,
    });
  });

  it("ignores unrelated messages", () => {
    const { listeners } = setupChromeRuntime();
    const { result } = renderHook(() => useCaptureSyncStatus());

    act(() => {
      listeners.forEach((listener) => listener({ type: "CAPTURE_READY" }));
    });

    expect(result.current).toEqual({ phase: null, message: "" });
  });

  it("removes the message listener on unmount", () => {
    const { listeners } = setupChromeRuntime();
    const { unmount } = renderHook(() => useCaptureSyncStatus());

    const removeListener = chrome.runtime.onMessage.removeListener as ReturnType<typeof vi.fn>;
    expect(removeListener).not.toHaveBeenCalled();
    unmount();
    expect(removeListener).toHaveBeenCalledTimes(1);
    expect(listeners.length).toBe(0);
  });
});
