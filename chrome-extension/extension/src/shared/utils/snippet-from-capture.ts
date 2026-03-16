import { nanoid } from "nanoid";
import type { CapturedElementData, Snippet } from "../types/snippet";
import { generateSnippetName } from "./snippet-name";

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

function getThumbnail(capture: CapturedElementData): string {
  if (capture.thumbnail && capture.thumbnail.trim().length > 0) {
    return capture.thumbnail;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#f8fafc"/><rect x="16" y="16" width="168" height="88" fill="#e5e7eb" rx="8"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Builds a Snippet from capture data (used after element capture in content script).
 */
export function buildSnippetFromCapture(capture: CapturedElementData): Snippet {
  const sourceUrl = typeof window !== "undefined" ? window.location.href : "";
  const domain = getDomain(sourceUrl);
  const title = capture.elementLabel?.trim()
    ? `${capture.elementLabel.trim()} - ${domain}`
    : `${generateSnippetName()} - ${domain}`;
  return {
    id: nanoid(),
    title,
    sourceUrl,
    html: capture.html,
    jsx: capture.jsx,
    thumbnail: getThumbnail(capture),
    createdAt: Date.now(),
    width: capture.width,
    height: capture.height,
    renderContext: capture.renderContext,
    styleBlock: capture.styleBlock,
    rootId: capture.rootId,
    externalFontLinks: capture.externalFontLinks
  };
}
