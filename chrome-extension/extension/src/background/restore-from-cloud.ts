import type { RenderContext, Snippet } from "../shared/types/snippet";
import { getAuthToken, getOrCreateInstallCredentials } from "../shared/storage/auth-storage";
import { getSnippets, saveSnippet } from "../shared/storage/snippet-storage";
import { SERVER_URL } from "../shared/server-url";
import { FREE_LIBRARY_LIMIT, PAID_PLANS } from "../shared/usage";

interface RestoreCapture {
  server_capture_id: string;
  snippet_id: string;
  title: string;
  source_url: string | null;
  captured_at: number;
  width: number;
  height: number;
  render_context: RenderContext | null;
  root_id: string | null;
  external_font_links: string[] | null;
  folder_id: string | null;
  html_url: string | null;
  screenshot_url: string | null;
  stylesheet_url: string | null;
}

interface RestoreResponse {
  captures: RestoreCapture[];
  has_more: boolean;
  next_cursor: number | null;
}

export interface RestoreResult {
  restored: number;
  skipped: number;
  failed: number;
}

function arrayBufferToBase64DataUrl(buffer: ArrayBuffer, mimeType: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

async function fetchScreenshot(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    const contentType = res.headers.get("content-type") ?? "image/png";
    const mimeType = contentType.split(";")[0].trim();
    const buffer = await res.arrayBuffer();
    return arrayBufferToBase64DataUrl(buffer, mimeType);
  } catch {
    return "";
  }
}

async function fetchStylesheet(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    return res.text();
  } catch {
    return undefined;
  }
}

/**
 * Restores captures from the cloud into local storage.
 * Intended to run after login or on startup when the local library is empty.
 * Deduplicates by snippet_id, respects library limits, and processes sequentially
 * to avoid flooding fetch queue within the presigned URL TTL window.
 */
export async function restoreCapturesFromCloud(userPlan?: string): Promise<RestoreResult> {
  const result: RestoreResult = { restored: 0, skipped: 0, failed: 0 };

  const [token, creds] = await Promise.all([
    getAuthToken(),
    getOrCreateInstallCredentials(),
  ]);
  if (!token) return result;

  let serverCaptures: RestoreCapture[];
  try {
    const res = await fetch(
      `${SERVER_URL}/api/captures/install/${creds.install_id}/restore?limit=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return result;
    const data = await res.json() as RestoreResponse;
    serverCaptures = data.captures ?? [];
  } catch {
    return result;
  }

  if (serverCaptures.length === 0) return result;

  const localSnippets = await getSnippets();
  const localIds = new Set(localSnippets.map((s) => s.id));
  const isPaid = PAID_PLANS.includes(userPlan as never);
  const libraryLimit = isPaid ? Infinity : FREE_LIBRARY_LIMIT;
  let localCount = localSnippets.length;

  for (const capture of serverCaptures) {
    if (localIds.has(capture.snippet_id)) {
      result.skipped++;
      continue;
    }

    if (localCount >= libraryLimit) {
      result.skipped++;
      continue;
    }

    if (!capture.html_url) {
      result.skipped++;
      continue;
    }

    const html = await fetchHtml(capture.html_url);
    if (!html) {
      result.failed++;
      continue;
    }

    const [thumbnail, styleBlock] = await Promise.all([
      capture.screenshot_url ? fetchScreenshot(capture.screenshot_url) : Promise.resolve(""),
      capture.stylesheet_url ? fetchStylesheet(capture.stylesheet_url) : Promise.resolve(undefined),
    ]);

    const restored: Snippet = {
      id: capture.snippet_id,
      title: capture.title,
      sourceUrl: capture.source_url ?? "",
      html,
      jsx: "",
      thumbnail: thumbnail ?? "",
      createdAt: capture.captured_at,
      width: capture.width,
      height: capture.height,
      ...(capture.render_context ? { renderContext: capture.render_context } : {}),
      ...(styleBlock !== undefined ? { styleBlock } : {}),
      ...(capture.root_id ? { rootId: capture.root_id } : {}),
      ...(capture.external_font_links ? { externalFontLinks: capture.external_font_links } : {}),
      ...(capture.folder_id ? { folderId: capture.folder_id } : {}),
      syncStatus: "synced",
      serverCaptureId: capture.server_capture_id,
    };

    try {
      await saveSnippet(restored);
      localIds.add(capture.snippet_id);
      localCount++;
      result.restored++;
    } catch {
      result.failed++;
    }
  }

  return result;
}
