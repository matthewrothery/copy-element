import { buildCopyHtml } from "./preview-srcdoc-builder";
import type { Snippet } from "../types/snippet";

/**
 * Estimates token count for text using characters / 4 * 1.2 (common heuristic).
 */
export function estimateTokens(text: string): number {
  return Math.ceil((text.length / 4) * 1.2);
}

/**
 * Builds a formatted prompt string for a snippet, suitable for pasting into
 * Claude Code, Cursor, or other AI tools. Includes HTML and JSX with metadata.
 */
export function buildSnippetPrompt(snippet: Snippet): string {
  const html = buildCopyHtml(snippet);
  const lines: string[] = [
    `## UI Snippet: ${snippet.title}`,
    "",
    `Source: ${snippet.sourceUrl}`,
    `Dimensions: ${snippet.width}x${snippet.height}`,
    `Estimated tokens: ~${estimateTokens(html + snippet.jsx)}`,
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

/**
 * Returns estimated token count for the full snippet prompt (HTML + JSX + metadata).
 */
export function getSnippetPromptTokenEstimate(snippet: Snippet): number {
  const prompt = buildSnippetPrompt(snippet);
  return estimateTokens(prompt);
}
