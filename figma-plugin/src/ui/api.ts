import type { CaptureItem } from "./types";

const API_BASE = "https://api.elementarmory.com";

interface ApiFigmaCapture {
  id: string;
  title: string;
  width: number;
  height: number;
  source_url: string | null;
  captured_at: number;
  screenshot_url: string | null;
  html_url: string | null;
  stylesheet_url: string | null;
}

/** Fetch all captures for the authenticated user via Figma Bearer token. */
export async function fetchCaptures(token: string): Promise<CaptureItem[]> {
  const res = await fetch(`${API_BASE}/api/captures/figma`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to load captures (${res.status})`);
  }
  const body = await res.json();
  const raw: ApiFigmaCapture[] = Array.isArray(body.captures) ? body.captures : [];
  return raw.map((c) => ({
    id: c.id,
    title: c.title,
    width: c.width,
    height: c.height,
    sourceUrl: c.source_url ?? undefined,
    capturedAt: c.captured_at,
    screenshotUrl: c.screenshot_url ?? undefined,
    htmlUrl: c.html_url ?? undefined,
    stylesheetUrl: c.stylesheet_url ?? undefined,
  }));
}
