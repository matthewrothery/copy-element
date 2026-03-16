import type { RenderContext, Snippet } from "../types/snippet";
import {
  buildLayoutWrapperStyle,
  needsLayoutWrapper
} from "./layout-wrapper-builder";

const RESET_CSS = `
html, body { margin: 0; padding: 0; box-sizing: border-box; overflow: hidden; }
* { box-sizing: inherit; }
`;

/** Match rel="stylesheet" or rel='stylesheet' (order-agnostic). */
const REL_STYLESHEET = /rel\s*=\s*["']stylesheet["']/i;
/** Capture href value from href="..." or href='...'. */
const HREF_ATTR = /href\s*=\s*["']([^"']+)["']/i;

/**
 * Converts external font link tags (serialized <link>) to @import lines.
 * Only includes <link rel="stylesheet" href="...">; skips preconnect/preload.
 * Skips empty or invalid hrefs.
 */
export function externalFontLinksToImportCss(externalFontLinks: string[]): string {
  const lines: string[] = [];
  for (const linkHtml of externalFontLinks) {
    if (!REL_STYLESHEET.test(linkHtml)) {
      continue;
    }
    const match = linkHtml.match(HREF_ATTR);
    const href = match?.[1]?.trim();
    if (!href) {
      continue;
    }
    try {
      new URL(href);
    } catch {
      continue;
    }
    lines.push(`@import url('${href}');`);
  }
  return lines.join("\n");
}

export interface BuildCopyHtmlOptions {
  /** Include style block when present. Default true. Set false for inline-only output. */
  includeStyleBlock?: boolean;
}

/**
 * Builds HTML string for copy-to-clipboard (self-contained with style block when present).
 * When externalFontLinks exist, prepends @import url('...'); for each stylesheet so fonts load.
 */
export function buildCopyHtml(
  snippet: Snippet,
  options: BuildCopyHtmlOptions = {}
): string {
  const { includeStyleBlock = true } = options;
  const content = wrapWithLayoutIfNeeded(snippet.html, snippet.renderContext);
  const externalFontLinks = snippet.externalFontLinks ?? [];
  if (!includeStyleBlock) {
    return content;
  }
  const importCss =
    externalFontLinks.length > 0
      ? externalFontLinksToImportCss(externalFontLinks)
      : "";
  const styleBlock = snippet.styleBlock?.trim() ?? "";
  const parts: string[] = [];
  if (importCss) parts.push(importCss);
  if (styleBlock) parts.push(styleBlock);
  const styleContent = parts.join("\n\n");
  if (styleContent.length > 0) {
    return `<style>${styleContent}</style>${content}`;
  }
  return content;
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

function wrapWithLayoutIfNeeded(
  html: string,
  renderContext: RenderContext | undefined
): string {
  if (!needsLayoutWrapper(renderContext)) {
    return html;
  }
  const style = buildLayoutWrapperStyle(
    renderContext?.parentLayout,
    renderContext?.inheritedText,
    renderContext?.visibleBackgroundColor
  );
  return `<div class="snippet-stage-parent" style="${escapeHtml(style)}">${html}</div>`;
}

export interface CapturePreviewInput {
  html: string;
  styleBlock?: string;
  width: number;
  height: number;
  sourceUrl: string;
  renderContext?: RenderContext;
  externalFontLinks?: string[];
}

function buildPreviewHeadAndBody(
  stageWidth: number,
  stageHeight: number,
  baseTag: string,
  externalFontLinks: string,
  styleBlock: string,
  innerContent: string
): string {
  const previewStageCss = `.snippet-stage{width:${stageWidth}px;height:${stageHeight}px;min-width:${stageWidth}px;min-height:${stageHeight}px;overflow:hidden;}`;
  const bodyContent = `<div class="snippet-stage">${innerContent}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8">${baseTag}${externalFontLinks}<style>${RESET_CSS}html, body { width: ${stageWidth}px; height: ${stageHeight}px; }${previewStageCss}</style>${styleBlock}</head><body>${bodyContent}</body></html>`;
}

/**
 * Builds srcDoc for capture modal fallback preview (when no thumbnail).
 * Includes style block and base tag for correct layout and relative URL resolution.
 */
export function buildPreviewForCapture(input: CapturePreviewInput): string {
  const stageWidth = Math.max(1, input.width);
  const stageHeight = Math.max(1, input.height);

  const baseTag = getBaseTag(input.sourceUrl);
  const externalFontLinks = input.externalFontLinks?.join("\n") || "";
  const styleBlock = input.styleBlock ? `<style>${input.styleBlock}</style>` : "";
  const innerContent = wrapWithLayoutIfNeeded(input.html, input.renderContext);
  return buildPreviewHeadAndBody(
    stageWidth,
    stageHeight,
    baseTag,
    externalFontLinks,
    styleBlock,
    innerContent
  );
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
  const externalFontLinks = snippet.externalFontLinks?.join("\n") || "";
  const styleBlock = snippet.styleBlock ? `<style>${snippet.styleBlock}</style>` : "";
  const innerContent = wrapWithLayoutIfNeeded(snippet.html, snippet.renderContext);
  return buildPreviewHeadAndBody(
    stageWidth,
    stageHeight,
    baseTag,
    externalFontLinks,
    styleBlock,
    innerContent
  );
}
