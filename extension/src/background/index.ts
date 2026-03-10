import type { CapturedElementData } from "../shared/types/snippet";
import { deleteSnippet, getSnippets, saveSnippet } from "../shared/storage/snippet-storage";

let latestCapture: CapturedElementData | null = null;

async function sendToActiveTab(message: { type: string }): Promise<void> {
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!activeTab?.id) {
    throw new Error("No active tab found.");
  }

  await chrome.tabs.sendMessage(activeTab.id, message);
}

chrome.runtime.onMessage.addListener((message: { type?: string; payload?: unknown }, _sender, sendResponse) => {
  if (!message?.type) {
    return false;
  }

  if (message.type === "START_CAPTURE") {
    void sendToActiveTab({ type: "START_CAPTURE" })
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "CANCEL_CAPTURE") {
    void sendToActiveTab({ type: "CANCEL_CAPTURE" })
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "ELEMENT_CAPTURED") {
    latestCapture = message.payload as CapturedElementData;
    void chrome.runtime.sendMessage({ type: "CAPTURE_READY", payload: latestCapture });
    sendResponse({ ok: true });
    return true;
  }

  if (message.type === "GET_LATEST_CAPTURE") {
    sendResponse({ ok: true, payload: latestCapture });
    return true;
  }

  if (message.type === "SAVE_SNIPPET") {
    void saveSnippet(message.payload as never)
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "GET_SNIPPETS") {
    void getSnippets()
      .then((snippets) => sendResponse({ ok: true, payload: snippets }))
      .catch((error: unknown) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  if (message.type === "DELETE_SNIPPET") {
    const payload = message.payload as { id: string };
    void deleteSnippet(payload.id)
      .then(() => sendResponse({ ok: true }))
      .catch((error: unknown) => sendResponse({ ok: false, error: String(error) }));
    return true;
  }

  return false;
});
