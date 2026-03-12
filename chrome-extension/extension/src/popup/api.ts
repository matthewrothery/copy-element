import { nanoid } from "nanoid";
import type { CapturedElementData, Snippet } from "../shared/types/snippet";
import type { RuntimeErrorCode, RuntimeMessage, RuntimeResponse } from "../shared/types/messages";

export class RuntimeRequestError extends Error {
  public readonly code: RuntimeErrorCode;

  public constructor(message: string, code: RuntimeErrorCode) {
    super(message);
    this.name = "RuntimeRequestError";
    this.code = code;
  }
}

function getCaptureStartErrorMessage(code: RuntimeErrorCode): string {
  switch (code) {
    case "NO_ACTIVE_TAB":
      return "No active page tab found.";
    case "UNSUPPORTED_TAB_URL":
      return "Capture is not supported on this page.";
    case "CONTENT_SCRIPT_UNREACHABLE":
      return "Capture script is not available on this tab. Refresh the page and try again.";
    case "UNKNOWN_ERROR":
    default:
      return "Unable to start capture.";
  }
}

export function formatCaptureStartError(error: unknown): string {
  if (error instanceof RuntimeRequestError) {
    return getCaptureStartErrorMessage(error.code);
  }
  return "Unable to start capture.";
}

async function sendRuntimeMessage<T>(message: RuntimeMessage): Promise<T> {
  const response = (await chrome.runtime.sendMessage(message)) as RuntimeResponse<T>;
  if (!response || !response.ok) {
    const code = response?.code ?? "UNKNOWN_ERROR";
    const error = response?.error ?? "Unknown runtime error.";
    throw new RuntimeRequestError(error, code);
  }
  return response.payload;
}

async function getActiveTabId(): Promise<number | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  return tab?.id;
}

export async function startCapture(): Promise<void> {
  const tabId = await getActiveTabId();
  await sendRuntimeMessage<null>({ type: "START_CAPTURE", payload: { tabId } });
}

export async function getLatestCapture(): Promise<CapturedElementData | null> {
  return sendRuntimeMessage<CapturedElementData | null>({ type: "GET_LATEST_CAPTURE" });
}

export async function getSnippetsFromBackground(): Promise<Snippet[]> {
  return sendRuntimeMessage<Snippet[]>({ type: "GET_SNIPPETS" });
}

export async function saveSnippetFromCapture(
  capture: CapturedElementData,
  title: string,
  sourceUrl: string
): Promise<Snippet> {
  const snippet: Snippet = {
    id: nanoid(),
    title,
    sourceUrl,
    html: capture.html,
    jsx: capture.jsx,
    thumbnail: capture.thumbnail ?? "",
    createdAt: Date.now(),
    width: capture.width,
    height: capture.height
  };

  await sendRuntimeMessage<null>({ type: "SAVE_SNIPPET", payload: snippet });
  return snippet;
}

export async function deleteSnippetFromBackground(id: string): Promise<void> {
  await sendRuntimeMessage<null>({ type: "DELETE_SNIPPET", payload: { id } });
}

export function openLibraryInNewTab(): void {
  chrome.tabs.create({ url: chrome.runtime.getURL("library.html") });
}
