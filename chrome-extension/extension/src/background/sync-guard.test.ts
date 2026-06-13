import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Snippet } from "../shared/types/snippet";

function makeSnippet(overrides: Partial<Snippet> = {}): Snippet {
  return {
    id: "snip-1",
    title: "Title",
    sourceUrl: "https://example.com",
    html: "<div></div>",
    jsx: "<div />",
    thumbnail: "",
    createdAt: 1000,
    width: 100,
    height: 100,
    syncStatus: "pending",
    ...overrides,
  };
}

let snippetsStore: Snippet[] = [];

vi.mock("../shared/storage/snippet-storage", () => ({
  getSnippets: vi.fn(async () => snippetsStore),
  saveSnippet: vi.fn(async (snippet: Snippet) => {
    snippetsStore = snippetsStore.map((s) => (s.id === snippet.id ? snippet : s));
  }),
  getSnippetById: vi.fn(async () => null),
  deleteSnippet: vi.fn(async () => undefined),
}));

vi.mock("../shared/storage/auth-storage", () => ({
  getAuthToken: vi.fn(async () => "test-token"),
  getAuthExpiresAt: vi.fn(async () => null),
  getAuthState: vi.fn(async () => ({ signed_in: true, user_email: null, user_plan: "free" })),
  getOrCreateInstallCredentials: vi.fn(async () => ({ install_id: "inst", install_secret: "sec" })),
  saveToken: vi.fn(async () => undefined),
  saveUserProfile: vi.fn(async () => undefined),
  clearAuthToken: vi.fn(async () => undefined),
}));

vi.mock("./sync-capture", () => ({
  syncCaptureToServer: vi.fn(async () => "server-id"),
  deleteServerCapture: vi.fn(async () => undefined),
}));

vi.mock("./restore-from-cloud", () => ({
  restoreCapturesFromCloud: vi.fn(async () => ({ restored: 0, skipped: 0, failed: 0 })),
}));

vi.mock("../shared/storage/folder-storage", () => ({
  getFolders: vi.fn(async () => []),
  saveFolder: vi.fn(async () => undefined),
  deleteFolder: vi.fn(async () => undefined),
}));

vi.mock("../shared/analytics", () => ({
  trackExtensionEvent: vi.fn(async () => undefined),
}));

function stubChrome(): void {
  vi.stubGlobal("chrome", {
    runtime: {
      onInstalled: { addListener: vi.fn() },
      onStartup: { addListener: vi.fn() },
      onMessage: { addListener: vi.fn() },
      sendMessage: vi.fn(async () => undefined),
      setUninstallURL: vi.fn(async () => undefined),
      getURL: vi.fn((path: string) => `chrome-extension://fake/${path}`),
      getManifest: vi.fn(() => ({ version: "1.0.0" })),
    },
    alarms: {
      onAlarm: { addListener: vi.fn() },
      create: vi.fn(async () => undefined),
      clear: vi.fn(async () => undefined),
    },
    storage: {
      local: {
        get: vi.fn(async () => ({})),
        set: vi.fn(async () => undefined),
      },
    },
  });
}

describe("retryPendingSyncs concurrency guard", () => {
  beforeEach(() => {
    snippetsStore = [];
    vi.resetModules();
    vi.clearAllMocks();
    stubChrome();
  });

  it("uploads each pending snippet exactly once", async () => {
    snippetsStore = [makeSnippet({ id: "a" }), makeSnippet({ id: "b" })];
    const { retryPendingSyncs } = await import("./index");
    const { syncCaptureToServer } = await import("./sync-capture");

    await retryPendingSyncs();

    expect(syncCaptureToServer).toHaveBeenCalledTimes(2);
    expect(snippetsStore.find((s) => s.id === "a")?.syncStatus).toBe("synced");
    expect(snippetsStore.find((s) => s.id === "b")?.syncStatus).toBe("synced");
  });

  it("an overlapping call while a run is in flight does not start a second pass", async () => {
    snippetsStore = [makeSnippet({ id: "a" }), makeSnippet({ id: "b" })];
    const { retryPendingSyncs } = await import("./index");
    const { syncCaptureToServer } = await import("./sync-capture");

    // Both calls are issued synchronously; the in-flight flag is set before
    // the first call's first await, so the second call must return early.
    await Promise.all([retryPendingSyncs(), retryPendingSyncs()]);

    expect(syncCaptureToServer).toHaveBeenCalledTimes(2);
  });

  it("reconciles an orphaned 'syncing' snippet to 'failed'", async () => {
    snippetsStore = [makeSnippet({ id: "a", syncStatus: "syncing" })];
    const { reconcileOrphanedSyncs } = await import("./index");

    await reconcileOrphanedSyncs();

    expect(snippetsStore.find((s) => s.id === "a")?.syncStatus).toBe("failed");
  });

  it("broadcasts CAPTURE_SYNC_STATUS start/done when notify is true and the backlog is non-empty", async () => {
    snippetsStore = [makeSnippet({ id: "a" })];
    const { retryPendingSyncs } = await import("./index");

    await retryPendingSyncs({ notify: true });

    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "CAPTURE_SYNC_STATUS",
      payload: { phase: "start", total: 1 },
    });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "CAPTURE_SYNC_STATUS",
      payload: { phase: "done", total: 1, synced: 1, failed: 0 },
    });
  });

  it("does not broadcast when there is nothing to sync", async () => {
    snippetsStore = [];
    const { retryPendingSyncs } = await import("./index");

    await retryPendingSyncs({ notify: true });

    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled();
  });

  it("queues a notify-only follow-up when notify:true arrives while a non-notify run is in flight", async () => {
    snippetsStore = [makeSnippet({ id: "a" })];
    const { retryPendingSyncs } = await import("./index");
    const { syncCaptureToServer } = await import("./sync-capture");

    const first = retryPendingSyncs();
    const second = retryPendingSyncs({ notify: true });
    await Promise.all([first, second]);

    // The snippet is uploaded only once, but the queued notify still
    // announces the result of the in-flight run rather than dropping the toast.
    expect(syncCaptureToServer).toHaveBeenCalledTimes(1);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "CAPTURE_SYNC_STATUS",
      payload: { phase: "start", total: 1 },
    });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      type: "CAPTURE_SYNC_STATUS",
      payload: { phase: "done", total: 1, synced: 1, failed: 0 },
    });
  });
});
