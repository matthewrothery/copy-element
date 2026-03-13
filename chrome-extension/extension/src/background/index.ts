import type { CapturedElementData } from "../shared/types/snippet";
import { deleteSnippet, getSnippets, saveSnippet } from "../shared/storage/snippet-storage";
import type {
  ExtractCssViaCdpPayload,
  RuntimeErrorCode,
  RuntimeMessage,
  RuntimeResponse
} from "../shared/types/messages";
import { extractCssViaCdp } from "./cdp-css";

let latestCapture: CapturedElementData | null = null;

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
    await chrome.tabs.sendMessage(targetTab.id, message);
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
      const { selectors, baseUrl } = message.payload;
      const tabId = message.payload.tabId ?? sender.tab?.id;
      if (typeof tabId !== "number") {
        sendResponse(failure("tabId is required", "UNKNOWN_ERROR"));
        return;
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
          variableDefinitions: result.variableDefinitions
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

  return false;
});
