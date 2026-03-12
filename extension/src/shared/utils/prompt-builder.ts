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

const MCP_INTRO =
  "This is a component from SnappyMCP, copied from another website. It is your job to implement this UI component as per the user's instructions. Ideally it would match the existing theme, colors and code practices in the existing project.";

/**
 * Builds the short "Copy MCP" prompt for pasting into AI tools: intro paragraph,
 * code (HTML + JSX), and snapshot image link (thumbnail data URL or placeholder).
 */
export function buildCopyMcpPrompt(snippet: Snippet): string {
  const html = buildCopyHtml(snippet);
  const snapshotUrl =
    snippet.thumbnail && snippet.thumbnail.trim().length > 0
      ? snippet.thumbnail
      : "[No snapshot available]";
  const lines: string[] = [
    MCP_INTRO,
    "",
    "Here is the code:",
    "",
    "```html",
    html,
    "```",
    "",
    "```jsx",
    snippet.jsx,
    "```",
    "",
    `And a link to the snapshot image: ${snapshotUrl}`
  ];
  return lines.join("\n");
}
