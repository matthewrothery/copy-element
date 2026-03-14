import type { SnippetRecord } from "./types.js";

function estimateTokens(text: string): number {
  return Math.ceil((text.length / 4) * 1.2);
}

/**
 * Builds HTML string for prompt (style block + content). Simpler than extension's
 * buildCopyHtml; no layout wrapper or font imports for brevity.
 */
function getHtmlForPrompt(snippet: SnippetRecord): string {
  const styleBlock = snippet.styleBlock?.trim() ?? "";
  if (styleBlock.length > 0) {
    return `<style>${styleBlock}</style>${snippet.html}`;
  }
  return snippet.html;
}

/**
 * Builds a formatted prompt string for a snippet for use in AI tools.
 */
export function buildSnippetPrompt(snippet: SnippetRecord): string {
  const html = getHtmlForPrompt(snippet);
  const tokens = estimateTokens(html + snippet.jsx);
  const lines: string[] = [
    `## UI Snippet: ${snippet.title}`,
    "",
    `Source: ${snippet.sourceUrl}`,
    `Dimensions: ${snippet.width}x${snippet.height}`,
    `Estimated tokens: ~${tokens}`,
    "",
    "### HTML",
    "```html",
    html,
    "```",
    "",
    "### JSX",
    "```jsx",
    snippet.jsx,
    "```"
  ];
  return lines.join("\n");
}
