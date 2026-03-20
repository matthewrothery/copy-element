import type { CapturedElementData } from "../shared/types/snippet";
import { deleteFolder, getFolders, saveFolder } from "../shared/storage/folder-storage";
import { deleteSnippet, getSnippetById, getSnippets, saveSnippet } from "../shared/storage/snippet-storage";
import {
  clearAuthToken,
  getAuthExpiresAt,
  getAuthState,
  getAuthToken,
  getOrCreateInstallCredentials,
  saveToken,
  saveUserProfile,
} from "../shared/storage/auth-storage";
import { SERVER_URL } from "../shared/server-url";
import type {
  AuthStatePayload,
  ExtractCssViaCdpPayload,
  RuntimeErrorCode,
  RuntimeMessage,
  RuntimeResponse
} from "../shared/types/messages";
import { clearViewportEmulation, extractCssViaCdp, setViewportEmulation } from "./cdp-css";
import { syncCaptureToServer } from "./sync-capture";

const REFRESH_ALARM_NAME = "element-armory-auth-refresh";

async function scheduleRefreshAlarm(): Promise<void> {
  const expiresAt = await getAuthExpiresAt();
  await chrome.alarms.clear(REFRESH_ALARM_NAME);
  if (!expiresAt) return;
  const expiryMs = new Date(expiresAt).getTime();
  const now = Date.now();
  const refreshMs = expiryMs - 12 * 60 * 60 * 1000; // 12 hours before expiry
  const delayMs = Math.max(refreshMs - now, 60 * 1000); // minimum 1 minute
  const delayMinutes = delayMs / 60000;
  await chrome.alarms.create(REFRESH_ALARM_NAME, { delayInMinutes: delayMinutes });
}

chrome.runtime.onInstalled.addListener(() => {
  void registerInstall();
  void scheduleRefreshAlarm();
});

async function registerInstall(): Promise<void> {
  const creds = await getOrCreateInstallCredentials();
  await fetch(`${SERVER_URL}/api/installs/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ install_id: creds.install_id, install_secret: creds.install_secret }),
  }).catch(() => {});
}

chrome.runtime.onStartup.addListener(() => {
  void registerInstall();
  void scheduleRefreshAlarm();
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== REFRESH_ALARM_NAME) return;
  void (async () => {
    const token = await getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/extension-session/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { token?: string; expires_at?: string };
        if (data.token && data.expires_at) {
          await saveToken(data.token, data.expires_at);
          await scheduleRefreshAlarm();
        }
      }
    } catch {
      // Silently fail — will retry on next startup
    }
  })();
});

let latestCapture: CapturedElementData | null = null;

const DEBUG_CAPTURE_FRAME_SEND = false;

export function isCapturableUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  const unsupportedPrefixes = ["chrome://", "chrome-extension://", "edge://", "about:"];
  if (unsupportedPrefixes.some((prefix) => url.startsWith(prefix))) {
    return false;
  }

  if (url.startsWith("https://chrome.google.com/webstore")) {
    return false;
  }

  return true;
}

export function getErrorCode(error: unknown): RuntimeErrorCode {
  const message = String(error);
  if (message.includes("Receiving end does not exist")) {
    return "CONTENT_SCRIPT_UNREACHABLE";
  }
  return "UNKNOWN_ERROR";
}

function success<T>(payload: T): RuntimeResponse<T> {
  return { ok: true, payload };
}

function failure(error: string, code: RuntimeErrorCode): RuntimeResponse<never> {
  return { ok: false, error, code };
}

export async function resolveTargetTab(payload?: { tabId?: number }): Promise<chrome.tabs.Tab | null> {
  if (typeof payload?.tabId === "number") {
    try {
      return await chrome.tabs.get(payload.tabId);
    } catch {
      return null;
    }
  }

  const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return activeTab ?? null;
}

function getAllFrameIds(tabId: number): Promise<number[]> {
  return new Promise((resolve) => {
    chrome.webNavigation.getAllFrames({ tabId }, (details) => {
      if (!details) {
        resolve([]);
        return;
      }
      resolve(details.map((d) => d.frameId));
    });
  });
}

async function sendToAllFrames(
  tabId: number,
  message: { type: "START_CAPTURE" | "CANCEL_CAPTURE"; mode?: string }
): Promise<void> {
  const frameIds = await getAllFrameIds(tabId);
  for (const frameId of frameIds) {
    try {
      await chrome.tabs.sendMessage(tabId, message, { frameId });
    } catch (err) {
      if (DEBUG_CAPTURE_FRAME_SEND) {
        console.debug("[Element Armory] sendToAllFrames failed", { tabId, frameId, message: message.type, error: err });
      }
      // Ignore failures (e.g. cross-origin frame, script not injected)
    }
  }
}

/** Send CLEAR_FRAME_HOVER to all frames in the tab except the given frame (the one that claimed hover). */
async function sendClearHoverToOtherFrames(tabId: number, exceptFrameId: number): Promise<void> {
  const frameIds = await getAllFrameIds(tabId);
  const message = { type: "CLEAR_FRAME_HOVER" as const };
  for (const frameId of frameIds) {
    if (frameId === exceptFrameId) continue;
    try {
      await chrome.tabs.sendMessage(tabId, message, { frameId });
    } catch (err) {
      if (DEBUG_CAPTURE_FRAME_SEND) {
        console.debug("[Element Armory] sendClearHoverToOtherFrames failed", { tabId, frameId, error: err });
      }
      // Ignore failures (e.g. cross-origin frame, script not injected)
    }
  }
}

export async function sendToTargetTab(
  payload: { tabId?: number } | undefined,
  message: { type: "START_CAPTURE" | "CANCEL_CAPTURE"; mode?: string }
): Promise<RuntimeResponse<null>> {
  const targetTab = await resolveTargetTab(payload);
  if (!targetTab?.id) {
    return failure("No active page tab found.", "NO_ACTIVE_TAB");
  }

  if (!isCapturableUrl(targetTab.url)) {
    return failure("Capture is not supported on this page.", "UNSUPPORTED_TAB_URL");
  }

  try {
    await sendToAllFrames(targetTab.id, message);
    return success(null);
  } catch (error: unknown) {
    const code = getErrorCode(error);
    return failure(String(error), code);
  }
}

chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
  if (!message?.type) {
    return false;
  }

  if (message.type === "START_CAPTURE") {
    void sendToTargetTab(message.payload, { type: "START_CAPTURE", mode: message.payload?.mode }).then((response) => sendResponse(response));
    return true;
  }

  if (message.type === "CANCEL_CAPTURE") {
    void sendToTargetTab(message.payload, { type: "CANCEL_CAPTURE" }).then((response) => sendResponse(response));
    return true;
  }

  if (message.type === "STOP_OTHER_PICKERS") {
    void (async () => {
      const tabId = message.payload?.tabId ?? sender.tab?.id;
      const keepFrameId = message.payload?.frameId ?? sender.frameId;
      if (typeof tabId !== "number" || typeof keepFrameId !== "number") {
        sendResponse(success(null));
        return;
      }
      const frameIds = await getAllFrameIds(tabId);
      for (const frameId of frameIds) {
        if (frameId === keepFrameId) continue;
        try {
          await chrome.tabs.sendMessage(tabId, { type: "CANCEL_CAPTURE" }, { frameId });
        } catch {
          // Ignore per-frame failures
        }
      }
      sendResponse(success(null));
    })();
    return true;
  }

  if (message.type === "BROADCAST_CANCEL_CAPTURE") {
    void (async () => {
      const tabId = sender.tab?.id;
      if (typeof tabId === "number") {
        await sendToAllFrames(tabId, { type: "CANCEL_CAPTURE" });
      }
      sendResponse(success(null));
    })();
    return true;
  }

  if (message.type === "FRAME_HOVER_ACTIVE") {
    void (async () => {
      const tabId = sender.tab?.id;
      const frameId = sender.frameId;
      if (typeof tabId === "number" && typeof frameId === "number") {
        await sendClearHoverToOtherFrames(tabId, frameId);
      }
      sendResponse(success(null));
    })();
    return true;
  }

  if (message.type === "CAPTURE_VISIBLE_TAB") {
    void (async () => {
      const targetTab = await resolveTargetTab(message.payload);
      if (!targetTab?.id) {
        sendResponse(failure("No active page tab found.", "NO_ACTIVE_TAB"));
        return;
      }
      if (!isCapturableUrl(targetTab.url)) {
        sendResponse(failure("Capture is not supported on this page.", "UNSUPPORTED_TAB_URL"));
        return;
      }
      try {
        const dataUrl = await chrome.tabs.captureVisibleTab(targetTab.windowId!, { format: "png" });
        sendResponse(success({ dataUrl }));
      } catch (error: unknown) {
        const code = getErrorCode(error);
        sendResponse(failure(String(error), code));
      }
    })();
    return true;
  }

  if (message.type === "ELEMENT_CAPTURED") {
    latestCapture = message.payload;
    chrome.runtime
      .sendMessage({ type: "CAPTURE_READY", payload: latestCapture })
      .catch(() => {
        /* Popup may be closed; capture is stored for GET_LATEST_CAPTURE */
      });
    sendResponse(success(null));
    return true;
  }

  if (message.type === "GET_LATEST_CAPTURE") {
    sendResponse(success(latestCapture));
    return true;
  }

  if (message.type === "FETCH_STYLESHEET_TEXT") {
    void (async () => {
      const { url } = message.payload;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) {
          sendResponse(success({ text: null }));
          return;
        }
        const contentLength = res.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > 2 * 1024 * 1024) {
          sendResponse(success({ text: null }));
          return;
        }
        const text = await res.text();
        sendResponse(success({ text }));
      } catch {
        sendResponse(success({ text: null }));
      }
    })();
    return true;
  }

  if (message.type === "EXTRACT_CSS_VIA_CDP") {
    void (async () => {
      const { selectors, baseUrl, frameId: payloadFrameId, theme, viewport } = message.payload;
      const tabId = message.payload.tabId ?? sender.tab?.id;
      const frameId = payloadFrameId ?? sender.frameId;
      if (typeof tabId !== "number") {
        sendResponse(failure("tabId is required", "UNKNOWN_ERROR"));
        return;
      }
      // CDP DOM queries run against the main frame only; iframe selection must use in-page fallback
      if (typeof frameId === "number" && frameId !== 0) {
        sendResponse(failure("iframe capture: use in-page extraction", "UNKNOWN_ERROR"));
        return true;
      }
      try {
        const result = await extractCssViaCdp(tabId, selectors, baseUrl, { theme, viewport });
        const payload: ExtractCssViaCdpPayload = {
          cssText: result.cssText,
          usedFontFamilies: [...result.usedFontFamilies],
          usedAnimationNames: [...result.usedAnimationNames],
          layerOrder: result.layerOrder,
          fontFacesCss: result.fontFacesCss,
          keyframesCss: result.keyframesCss,
          variableDefinitions: result.variableDefinitions,
          variableUsageContexts: result.variableUsageContexts
        };
        sendResponse(success(payload));
      } catch (error) {
        sendResponse(
          failure(String(error), "UNKNOWN_ERROR")
        );
      }
    })();
    return true;
  }

  if (message.type === "SAVE_SNIPPET") {
    void saveSnippet(message.payload)
      .then(() => {
        void syncCaptureToServer(message.payload); // fire-and-forget, never throws
        sendResponse(success(null));
      })
      .catch((error: unknown) => sendResponse(failure(String(error), "UNKNOWN_ERROR")));
    return true;
  }

  if (message.type === "OPEN_LIBRARY_TAB") {
    void chrome.tabs
      .create({ url: chrome.runtime.getURL("app.html#/library") })
      .then(() => sendResponse(success(null)))
      .catch((error: unknown) => sendResponse(failure(String(error), "UNKNOWN_ERROR")));
    return true;
  }

  if (message.type === "GET_SNIPPETS") {
    void getSnippets()
      .then((snippets) => sendResponse(success(snippets)))
      .catch((error: unknown) => sendResponse(failure(String(error), "UNKNOWN_ERROR")));
    return true;
  }

  if (message.type === "GET_SNIPPET_BY_ID") {
    void getSnippetById(message.payload.id)
      .then((snippet) => sendResponse(success(snippet)))
      .catch((error: unknown) => sendResponse(failure(String(error), "UNKNOWN_ERROR")));
    return true;
  }

  if (message.type === "DELETE_SNIPPET") {
    void deleteSnippet(message.payload.id)
      .then(() => sendResponse(success(null)))
      .catch((error: unknown) => sendResponse(failure(String(error), "UNKNOWN_ERROR")));
    return true;
  }

  if (message.type === "GET_FOLDERS") {
    void getFolders()
      .then((folders) => sendResponse(success(folders)))
      .catch((error: unknown) => sendResponse(failure(String(error), "UNKNOWN_ERROR")));
    return true;
  }

  if (message.type === "SAVE_FOLDER") {
    void saveFolder(message.payload)
      .then(() => sendResponse(success(null)))
      .catch((error: unknown) => sendResponse(failure(String(error), "UNKNOWN_ERROR")));
    return true;
  }

  if (message.type === "DELETE_FOLDER") {
    const folderId = message.payload.id;
    void (async () => {
      try {
        const snippets = await getSnippets();
        const inFolder = snippets.filter((s) => s.folderId === folderId);
        for (const s of inFolder) {
          await saveSnippet({ ...s, folderId: null });
        }
        await deleteFolder(folderId);
        sendResponse(success(null));
      } catch (error: unknown) {
        sendResponse(failure(String(error), "UNKNOWN_ERROR"));
      }
    })();
    return true;
  }

  if (message.type === "EXCHANGE_AUTH_CODE") {
    void (async () => {
      try {
        const { code, install_id } = message.payload;
        const creds = await getOrCreateInstallCredentials();
        const res = await fetch(`${SERVER_URL}/api/auth/extension-session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            install_id: install_id || creds.install_id,
            install_secret: creds.install_secret,
          }),
        });
        if (!res.ok) {
          console.error("[Element Armory] EXCHANGE_AUTH_CODE failed", res.status);
          sendResponse(failure("Failed to exchange auth code", "UNKNOWN_ERROR"));
          return;
        }
        const data = (await res.json()) as { token?: string; expires_at?: string };
        if (data.token && data.expires_at) {
          await saveToken(data.token, data.expires_at);
          await scheduleRefreshAlarm();
          // Best-effort: fetch user info and save profile
          void (async () => {
            try {
              const [meRes, entitlementRes] = await Promise.all([
                fetch(`${SERVER_URL}/api/me`, {
                  headers: { Authorization: `Bearer ${data.token}` },
                }),
                fetch(`${SERVER_URL}/api/billing/entitlement`, {
                  headers: { Authorization: `Bearer ${data.token}` },
                }),
              ]);
              const meData = meRes.ok
                ? ((await meRes.json()) as { user?: { email?: string } })
                : null;
              const entData = entitlementRes.ok
                ? ((await entitlementRes.json()) as { plan_code?: string })
                : null;
              const email = meData?.user?.email ?? null;
              const planCode = entData?.plan_code ?? "free";
              if (email) {
                await saveUserProfile(email, planCode);
              }
            } catch {
              // Silently fail — user info is non-critical
            }
          })();
        }
        // Close the auth-callback tab
        if (sender.tab?.id !== undefined) {
          chrome.tabs.remove(sender.tab.id).catch(() => {});
        }
        sendResponse(success(null));
      } catch (error: unknown) {
        console.error("[Element Armory] EXCHANGE_AUTH_CODE error", error);
        sendResponse(failure(String(error), "UNKNOWN_ERROR"));
      }
    })();
    return true;
  }

  if (message.type === "GET_AUTH_STATE") {
    void getAuthState()
      .then((state) => sendResponse(success(state as AuthStatePayload)))
      .catch((error: unknown) => sendResponse(failure(String(error), "UNKNOWN_ERROR")));
    return true;
  }

  if (message.type === "SIGN_OUT") {
    void (async () => {
      try {
        const token = await getAuthToken();
        if (token) {
          await fetch(`${SERVER_URL}/api/auth/extension-session/revoke`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
        await clearAuthToken();
        await chrome.alarms.clear(REFRESH_ALARM_NAME);
        sendResponse(success(null));
      } catch (error: unknown) {
        sendResponse(failure(String(error), "UNKNOWN_ERROR"));
      }
    })();
    return true;
  }

  if (message.type === "SET_VIEWPORT_EMULATION") {
    void (async () => {
      const tabId = message.payload.tabId ?? sender.tab?.id;
      if (typeof tabId !== "number") {
        sendResponse(failure("tabId is required", "UNKNOWN_ERROR"));
        return;
      }
      try {
        await setViewportEmulation(tabId, message.payload.viewport);
        sendResponse(success(null));
      } catch (error) {
        sendResponse(failure(String(error), "UNKNOWN_ERROR"));
      }
    })();
    return true;
  }

  if (message.type === "CLEAR_VIEWPORT_EMULATION") {
    void (async () => {
      const tabId = message.payload?.tabId ?? sender.tab?.id;
      if (typeof tabId !== "number") {
        sendResponse(failure("tabId is required", "UNKNOWN_ERROR"));
        return;
      }
      try {
        await clearViewportEmulation(tabId);
        sendResponse(success(null));
      } catch (error) {
        sendResponse(failure(String(error), "UNKNOWN_ERROR"));
      }
    })();
    return true;
  }

  if (message.type === "GET_INSTALL_ID") {
    void getOrCreateInstallCredentials()
      .then((creds) => sendResponse(success({ install_id: creds.install_id })))
      .catch((error: unknown) => sendResponse(failure(String(error), "UNKNOWN_ERROR")));
    return true;
  }

  return false;
});
