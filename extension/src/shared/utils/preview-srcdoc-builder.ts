import type { Snippet } from "../types/snippet";

const RESET_CSS = `
html, body { margin: 0; padding: 0; box-sizing: border-box; overflow: hidden; }
* { box-sizing: inherit; }
`;

/**
 * Builds HTML string for copy-to-clipboard (self-contained with style block when present).
 */
export function buildCopyHtml(snippet: Snippet): string {
  if (snippet.styleBlock && snippet.styleBlock.length > 0) {
    return `<style>${snippet.styleBlock}</style>${snippet.html}`;
  }
  return snippet.html;
}

function getBaseTag(sourceUrl: string): string {
  try {
    const url = new URL(sourceUrl);
    const baseHref = url.origin + "/";
    return `<base href="${escapeHtml(baseHref)}">`;
  } catch {
    return "";
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export interface CapturePreviewInput {
  html: string;
  styleBlock?: string;
  width: number;
  height: number;
  sourceUrl: string;
}

/**
 * Builds srcDoc for capture modal fallback preview (when no thumbnail).
 * Includes style block and base tag for correct layout and relative URL resolution.
 */
export function buildPreviewForCapture(input: CapturePreviewInput): string {
  const stageWidth = Math.max(1, input.width);
  const stageHeight = Math.max(1, input.height);

  const baseTag = getBaseTag(input.sourceUrl);
  const styleBlock = input.styleBlock ? `<style>${input.styleBlock}</style>` : "";
  const bodyContent = `<div class="snippet-stage" style="width:${stageWidth}px;height:${stageHeight}px;overflow:hidden;">${input.html}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8">${baseTag}<style>${RESET_CSS}.snippet-stage{min-width:0;min-height:0;}</style>${styleBlock}</head><body>${bodyContent}</body></html>`;
}

/**
 * Builds a deterministic iframe srcDoc document for snippet preview.
 * Single stage wrapper; no inner scrollbar (body overflow hidden).
 * When sourceUrl is present, injects a base tag so relative URLs (e.g. SVG sprites) resolve correctly.
 */
export function buildPreviewSrcDoc(snippet: Snippet): string {
  const stageWidth = Math.max(1, snippet.width);
  const stageHeight = Math.max(1, snippet.height);

  const baseTag = snippet.sourceUrl ? getBaseTag(snippet.sourceUrl) : "";
  const styleBlock = snippet.styleBlock ? `<style>${snippet.styleBlock}</style>` : "";
  const bodyContent = `<div class="snippet-stage" style="width:${stageWidth}px;height:${stageHeight}px;overflow:hidden;">${snippet.html}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8">${baseTag}<style>${RESET_CSS}.snippet-stage{min-width:0;min-height:0;}</style>${styleBlock}</head><body>${bodyContent}</body></html>`;
}
