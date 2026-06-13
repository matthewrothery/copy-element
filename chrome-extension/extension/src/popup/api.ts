import { nanoid } from "nanoid";
import type { Folder } from "../shared/types/folder";
import type { CapturedElementData, Snippet } from "../shared/types/snippet";
import type { AuthStatePayload, CaptureMode, RefreshPlanPayload, RetrySnippetSyncPayload, RuntimeErrorCode, RuntimeMessage, RuntimeResponse, TrySilentAuthPayload } from "../shared/types/messages";
import { SERVER_URL } from "../shared/server-url";

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

export async function startCapture(mode: CaptureMode = "element"): Promise<void> {
  const tabId = await getActiveTabId();
  await sendRuntimeMessage<null>({ type: "START_CAPTURE", payload: { tabId, mode } });
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

export async function retrySnippetSync(id: string): Promise<RetrySnippetSyncPayload> {
  return sendRuntimeMessage<RetrySnippetSyncPayload>({ type: "RETRY_SNIPPET_SYNC", payload: { id } });
}

export async function retryAllSyncs(): Promise<void> {
  await sendRuntimeMessage<null>({ type: "RETRY_ALL_SYNCS" });
}

export async function saveSnippetToBackground(snippet: Snippet): Promise<void> {
  await sendRuntimeMessage<null>({ type: "SAVE_SNIPPET", payload: snippet });
}

export async function getFoldersFromBackground(): Promise<Folder[]> {
  return sendRuntimeMessage<Folder[]>({ type: "GET_FOLDERS" });
}

export async function saveFolderToBackground(folder: Folder): Promise<void> {
  return sendRuntimeMessage<null>({ type: "SAVE_FOLDER", payload: folder });
}

export async function deleteFolderFromBackground(id: string): Promise<void> {
  return sendRuntimeMessage<null>({ type: "DELETE_FOLDER", payload: { id } });
}

export async function getSnippetById(id: string): Promise<Snippet | null> {
  return sendRuntimeMessage<Snippet | null>({ type: "GET_SNIPPET_BY_ID", payload: { id } });
}

export function openPreviewInNewTab(snippetId: string): void {
  const url = `${chrome.runtime.getURL("preview.html")}?id=${encodeURIComponent(snippetId)}`;
  void chrome.tabs.create({ url });
}

export function openLibraryInNewTab(snippetId?: string): void {
  const base = chrome.runtime.getURL("app.html");
  const url = snippetId ? `${base}?snippet=${encodeURIComponent(snippetId)}` : base;
  chrome.tabs.create({ url });
}

export async function getAuthStateFromBackground(): Promise<AuthStatePayload> {
  return sendRuntimeMessage<AuthStatePayload>({ type: "GET_AUTH_STATE" });
}

export async function signOutFromBackground(): Promise<void> {
  await sendRuntimeMessage<null>({ type: "SIGN_OUT" });
}

export async function getInstallIdFromBackground(): Promise<string> {
  const result = await sendRuntimeMessage<{ install_id: string }>({ type: "GET_INSTALL_ID" });
  return result.install_id;
}

export async function refreshPlanFromBackground(): Promise<RefreshPlanPayload> {
  return sendRuntimeMessage<RefreshPlanPayload>({ type: "REFRESH_PLAN" });
}

export async function trySilentAuthFromBackground(): Promise<TrySilentAuthPayload> {
  return sendRuntimeMessage<TrySilentAuthPayload>({ type: "TRY_SILENT_AUTH" });
}

export function openUpgradePage(): void {
  chrome.tabs.create({ url: `${SERVER_URL}/billing` });
}

export async function openBillingPortal(): Promise<void> {
  const { getAuthToken } = await import("../shared/storage/auth-storage");
  const token = await getAuthToken();
  if (!token) {
    chrome.tabs.create({ url: `${SERVER_URL}/billing` });
    return;
  }
  const res = await fetch(`${SERVER_URL}/api/billing/portal-session`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    chrome.tabs.create({ url: `${SERVER_URL}/billing` });
    return;
  }
  const data = (await res.json()) as { url?: string };
  if (data.url) {
    chrome.tabs.create({ url: data.url });
  } else {
    chrome.tabs.create({ url: `${SERVER_URL}/billing` });
  }
}

export function openSignInPage(installId: string): void {
  const signInUrl =
    `${SERVER_URL}/sign-in` +
    `?source=extension` +
    `&install_id=${encodeURIComponent(installId)}` +
    `&extension_id=${encodeURIComponent(chrome.runtime.id)}`;
  chrome.tabs.create({ url: signInUrl });
}
