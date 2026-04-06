import type { CapturedElementData } from "../shared/types/snippet";
import { deleteFolder, getFolders, saveFolder } from "../shared/storage/folder-storage";
import { deleteSnippet, getSnippetById, getSnippets, saveSnippet } from "../shared/storage/snippet-storage";
import { FREE_LIBRARY_LIMIT, GUEST_LIBRARY_LIMIT, PAID_PLANS } from "../shared/usage";
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
import { trackExtensionEvent } from "../shared/analytics";
import type {
  AuthStatePayload,
  ExtractCssViaCdpPayload,
  McpTokenGeneratedPayload,
  McpTokenMetaPayload,
  RefreshPlanPayload,
  RuntimeErrorCode,
  RuntimeMessage,
  RuntimeResponse
} from "../shared/types/messages";
import { saveMcpApiKey } from "../shared/storage/mcp-storage";
import { clearViewportEmulation, extractCssViaCdp, setViewportEmulation } from "./cdp-css";
import { syncCaptureToServer } from "./sync-capture";
import { isCapturableUrl } from "../shared/utils/capture-url";

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

const UNINSTALL_URL = `${SERVER_URL}/uninstall`;

chrome.runtime.onInstalled.addListener((details) => {
  void chrome.runtime.setUninstallURL(UNINSTALL_URL);
  void scheduleRefreshAlarm();
  void registerInstall().then(async (creds) => {
    if (details.reason === "install") {
      void trackExtensionEvent("extension_installed", creds.install_id);
    }
    try {
      await trySilentAuth(creds.install_id, creds.install_secret);
    } catch {
      // Silently fail — user may not have a website session
    }
  });
});

interface UABrand { brand: string; version: string }
interface NavigatorUAData { brands?: UABrand[]; platform?: string }

function collectInstallMetadata(): {
  extension_version?: string;
  chrome_version?: string;
  os_family?: string;
  locale?: string;
  timezone?: string;
} {
  const extension_version = chrome.runtime.getManifest().version;
  const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData }).userAgentData;

  let chrome_version: string | undefined;
  if (uaData?.brands) {
    const entry = uaData.brands.find((b) => b.brand === "Google Chrome" || b.brand === "Chromium");
    chrome_version = entry?.version;
  }
  if (!chrome_version) {
    chrome_version = navigator.userAgent.match(/Chrome\/(\d+)/)?.[1];
  }

  let os_family: string | undefined = uaData?.platform;
  if (!os_family) {
    const ua = navigator.userAgent;
    if (ua.includes("CrOS")) os_family = "ChromeOS";
    else if (ua.includes("Win")) os_family = "Windows";
    else if (ua.includes("Mac")) os_family = "macOS";
    else if (ua.includes("Linux")) os_family = "Linux";
  }

  return {
    extension_version,
    chrome_version,
    os_family,
    locale: navigator.language || undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
  };
}

async function registerInstall(): Promise<{ install_id: string; install_secret: string }> {
  const creds = await getOrCreateInstallCredentials();
  await fetch(`${SERVER_URL}/api/installs/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ install_id: creds.install_id, install_secret: creds.install_secret, ...collectInstallMetadata() }),
  }).catch(() => {});
  return creds;
}

async function trySilentAuth(installId: string, installSecret: string): Promise<boolean> {
  // Step 1: Link install to website session (requires session cookie)
  const linkRes = await fetch(`${SERVER_URL}/api/installs/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ install_id: installId }),
  });
  if (!linkRes.ok) return false;

  // Step 2: Get a short-lived auth code
  const codeRes = await fetch(`${SERVER_URL}/api/auth/extension-session/code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ install_id: installId }),
  });
  if (!codeRes.ok) return false;
  const codeData = (await codeRes.json()) as { code?: string };
  if (!codeData.code) return false;

  // Step 3: Exchange code for bearer token
  const tokenRes = await fetch(`${SERVER_URL}/api/auth/extension-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: codeData.code, install_id: installId, install_secret: installSecret }),
  });
  if (!tokenRes.ok) return false;
  const tokenData = (await tokenRes.json()) as { token?: string; expires_at?: string };
  if (!tokenData.token || !tokenData.expires_at) return false;

  await saveToken(tokenData.token, tokenData.expires_at);
  await scheduleRefreshAlarm();

  // Best-effort: fetch and save user profile
  try {
    const [meRes, entitlementRes] = await Promise.all([
      fetch(`${SERVER_URL}/api/me`, { headers: { Authorization: `Bearer ${tokenData.token}` } }),
      fetch(`${SERVER_URL}/api/billing/entitlement`, { headers: { Authorization: `Bearer ${tokenData.token}` } }),
    ]);
    const meData = meRes.ok ? ((await meRes.json()) as { user?: { email?: string } }) : null;
    const entData = entitlementRes.ok ? ((await entitlementRes.json()) as { plan_code?: string }) : null;
    const email = meData?.user?.email ?? null;
    const planCode = entData?.plan_code ?? "free";
    if (email) {
      await saveUserProfile(email, planCode);
    }
  } catch {
    // Silently fail — user info is non-critical
  }

  return true;
}

chrome.runtime.onStartup.addListener(() => {
  void chrome.runtime.setUninstallURL(UNINSTALL_URL);
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

export { isCapturableUrl } from "../shared/utils/capture-url";

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
): Promise<number> {
  const frameIds = await getAllFrameIds(tabId);
  let successCount = 0;
  for (const frameId of frameIds) {
    try {
      await chrome.tabs.sendMessage(tabId, message, { frameId });
      successCount++;
    } catch (err) {
      if (DEBUG_CAPTURE_FRAME_SEND) {
        console.debug("[Element Armory] sendToAllFrames failed", { tabId, frameId, message: message.type, error: err });
      }
      // Ignore failures (e.g. cross-origin frame, script not injected)
    }
  }
  return successCount;
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
    const successCount = await sendToAllFrames(targetTab.id, message);
    if (message.type === "START_CAPTURE" && successCount === 0) {
      return failure("Content script is not available on this tab. Reload the page and try again.", "CONTENT_SCRIPT_UNREACHABLE");
    }
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
    void (async () => {
      try {
        const authState = await getAuthState();
        const creds = await getOrCreateInstallCredentials();
        if (!authState.signed_in) {
          const snippets = await getSnippets();
          if (snippets.length >= GUEST_LIBRARY_LIMIT) {
            void trackExtensionEvent("limit_reached", creds.install_id, { limit_type: "guest_library" });
          }
          while (snippets.length >= GUEST_LIBRARY_LIMIT) {
            await deleteSnippet(snippets[snippets.length - 1].id);
            snippets.pop();
          }
        } else if (!PAID_PLANS.includes(authState.user_plan as never)) {
          const snippets = await getSnippets();
          if (snippets.length >= FREE_LIBRARY_LIMIT) {
            void trackExtensionEvent("limit_reached", creds.install_id, { limit_type: "free_library" });
          }
          while (snippets.length >= FREE_LIBRARY_LIMIT) {
            await deleteSnippet(snippets[snippets.length - 1].id);
            snippets.pop();
          }
        }
        await saveSnippet(message.payload);
        void syncCaptureToServer(message.payload); // fire-and-forget, never throws
        void trackExtensionEvent("element_captured", creds.install_id, {
          url: message.payload.sourceUrl,
        });
        sendResponse(success(null));
      } catch (error: unknown) {
        void getOrCreateInstallCredentials().then((creds) => {
          void trackExtensionEvent("element_capture_failed", creds.install_id);
        });
        sendResponse(failure(String(error), "UNKNOWN_ERROR"));
      }
    })();
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
          const creds = await getOrCreateInstallCredentials();
          void trackExtensionEvent("account_created", creds.install_id);
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

  if (message.type === "REFRESH_PLAN") {
    void (async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          sendResponse(success<RefreshPlanPayload>({ plan_code: "free" }));
          return;
        }
        const res = await fetch(`${SERVER_URL}/api/billing/entitlement`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = (await res.json()) as { plan_code?: string };
          const plan_code = data.plan_code ?? "free";
          const authState = await getAuthState();
          if (authState.user_email) {
            await saveUserProfile(authState.user_email, plan_code);
          }
          sendResponse(success<RefreshPlanPayload>({ plan_code }));
        } else {
          const authState = await getAuthState();
          sendResponse(success<RefreshPlanPayload>({ plan_code: authState.user_plan ?? "free" }));
        }
      } catch {
        const authState = await getAuthState();
        sendResponse(success<RefreshPlanPayload>({ plan_code: authState.user_plan ?? "free" }));
      }
    })();
    return true;
  }

  if (message.type === "GET_MCP_TOKEN_META") {
    void (async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          sendResponse(failure("Not signed in", "UNKNOWN_ERROR"));
          return;
        }
        const res = await fetch(`${SERVER_URL}/api/mcp/token`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          sendResponse(failure("Failed to fetch MCP token metadata", "UNKNOWN_ERROR"));
          return;
        }
        const data = (await res.json()) as { exists: boolean; created_at: number | null; last_used_at: number | null };
        const payload: McpTokenMetaPayload = {
          exists: data.exists,
          created_at: data.created_at,
          last_used_at: data.last_used_at,
        };
        sendResponse(success(payload));
      } catch (error: unknown) {
        sendResponse(failure(String(error), "UNKNOWN_ERROR"));
      }
    })();
    return true;
  }

  if (message.type === "GENERATE_MCP_TOKEN") {
    void (async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          sendResponse(failure("Not signed in", "UNKNOWN_ERROR"));
          return;
        }
        const res = await fetch(`${SERVER_URL}/api/mcp/token`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          sendResponse(failure("Failed to generate MCP token", "UNKNOWN_ERROR"));
          return;
        }
        const data = (await res.json()) as { code: string; mcp_url: string };
        await saveMcpApiKey(data.code);
        const creds = await getOrCreateInstallCredentials();
        void trackExtensionEvent("mcp_connected", creds.install_id);
        const payload: McpTokenGeneratedPayload = { api_key: data.code };
        sendResponse(success(payload));
      } catch (error: unknown) {
        sendResponse(failure(String(error), "UNKNOWN_ERROR"));
      }
    })();
    return true;
  }

  if (message.type === "TRY_SILENT_AUTH") {
    void (async () => {
      try {
        const creds = await getOrCreateInstallCredentials();
        const result = await trySilentAuth(creds.install_id, creds.install_secret);
        sendResponse(success({ success: result }));
      } catch {
        sendResponse(success({ success: false }));
      }
    })();
    return true;
  }

  if (message.type === "ROTATE_MCP_TOKEN") {
    void (async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          sendResponse(failure("Not signed in", "UNKNOWN_ERROR"));
          return;
        }
        const res = await fetch(`${SERVER_URL}/api/mcp/token`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          sendResponse(failure("Failed to rotate MCP token", "UNKNOWN_ERROR"));
          return;
        }
        const data = (await res.json()) as { code: string; mcp_url: string };
        await saveMcpApiKey(data.code);
        const payload: McpTokenGeneratedPayload = { api_key: data.code };
        sendResponse(success(payload));
      } catch (error: unknown) {
        sendResponse(failure(String(error), "UNKNOWN_ERROR"));
      }
    })();
    return true;
  }

  return false;
});
