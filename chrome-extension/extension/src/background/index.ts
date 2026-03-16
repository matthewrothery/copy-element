import type { CapturedElementData } from "../shared/types/snippet";
import { deleteFolder, getFolders, saveFolder } from "../shared/storage/folder-storage";
import { deleteSnippet, getSnippets, saveSnippet } from "../shared/storage/snippet-storage";
import type {
  ExtractCssViaCdpPayload,
  RuntimeErrorCode,
  RuntimeMessage,
  RuntimeResponse
} from "../shared/types/messages";
import { extractCssViaCdp } from "./cdp-css";

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
  message: { type: "START_CAPTURE" | "CANCEL_CAPTURE" }
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
  message: { type: "START_CAPTURE" | "CANCEL_CAPTURE" }
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
    void sendToTargetTab(message.payload, { type: "START_CAPTURE" }).then((response) => sendResponse(response));
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

  if (message.type === "EXTRACT_CSS_VIA_CDP") {
    void (async () => {
      const { selectors, baseUrl, frameId: payloadFrameId } = message.payload;
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
        const result = await extractCssViaCdp(tabId, selectors, baseUrl);
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
      .then(() => sendResponse(success(null)))
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

  return false;
});
