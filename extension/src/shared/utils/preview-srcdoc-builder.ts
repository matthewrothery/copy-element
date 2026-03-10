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

/**
 * Builds a deterministic iframe srcDoc document for snippet preview.
 * Single stage wrapper; no inner scrollbar (body overflow hidden).
 */
export function buildPreviewSrcDoc(snippet: Snippet): string {
  const stageWidth = Math.max(1, snippet.width);
  const stageHeight = Math.max(1, snippet.height);

  const styleBlock = snippet.styleBlock ? `<style>${snippet.styleBlock}</style>` : "";
  const bodyContent = `<div class="snippet-stage" style="width:${stageWidth}px;height:${stageHeight}px;overflow:hidden;">${snippet.html}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><style>${RESET_CSS}.snippet-stage{min-width:0;min-height:0;}</style>${styleBlock}</head><body>${bodyContent}</body></html>`;
}
