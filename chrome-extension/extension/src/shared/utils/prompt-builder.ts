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
 * Claude Code, Cursor, or other AI tools. Includes HTML, stylesheet (when present), and JSX with metadata.
 */
export function buildSnippetPrompt(snippet: Snippet): string {
  const html = buildCopyHtml(snippet);
  const lines: string[] = [
    `## UI Snippet: ${snippet.title}`,
    "",
    `Source: ${snippet.sourceUrl}`,
    `Dimensions: ${snippet.width}x${snippet.height}`,
    `Estimated tokens: ~${estimateTokens(html + (snippet.styleBlock ?? "") + snippet.jsx)}`,
    "",
    "### HTML",
    "```html",
    html,
    "```"
  ];
  if (snippet.styleBlock?.trim()) {
    lines.push("", "### CSS", "```css", snippet.styleBlock.trim(), "```");
  }
  lines.push("", "### JSX", "```jsx", snippet.jsx, "```");
  return lines.join("\n");
}

/**
 * Returns estimated token count for the full snippet prompt (HTML + JSX + metadata).
 */
export function getSnippetPromptTokenEstimate(snippet: Snippet): number {
  const prompt = buildSnippetPrompt(snippet);
  return estimateTokens(prompt);
}

/**
 * Builds a simple prompt for Free-tier users: instruction + CSS + HTML inline.
 */
export function buildBasicAiPrompt(snippet: Snippet): string {
  const html = buildCopyHtml(snippet);
  const parts: string[] = ["Implement this component in our codebase."];
  if (snippet.styleBlock?.trim()) {
    parts.push("", "```css", snippet.styleBlock.trim(), "```");
  }
  parts.push("", "```html", html, "```");
  return parts.join("\n");
}

/**
 * Builds a codebase-aware prompt for Pro-tier users: full context with HTML, CSS, and JSX.
 */
export function buildAdvancedAiPrompt(snippet: Snippet): string {
  const html = buildCopyHtml(snippet);
  const lines: string[] = [
    `## UI Snippet: ${snippet.title}`,
    "",
    `Source: ${snippet.sourceUrl}`,
    `Dimensions: ${snippet.width}x${snippet.height}`,
    "",
    "Implement this UI component in our codebase, matching the existing theme, colors, and code practices.",
    "",
    "### HTML",
    "```html",
    html,
    "```"
  ];
  if (snippet.styleBlock?.trim()) {
    lines.push("", "### CSS", "```css", snippet.styleBlock.trim(), "```");
  }
  lines.push("", "### JSX", "```jsx", snippet.jsx, "```");
  return lines.join("\n");
}

const MCP_INTRO =
  "This is a component from Element Armory, copied from another website. It is your job to implement this UI component as per the user's instructions. Ideally it would match the existing theme, colors and code practices in the existing project.";

/**
 * Builds a short MCP prompt with just an @-mention URL for the snippet.
 * Suitable for pasting into Claude Code, Cursor, or similar tools with MCP support.
 */
export function buildShortMcpPrompt(snippet: Snippet): string {
  return `Implement this element extracted by Element Armory.\n@https://mcp.elementarmory.com/capture/${snippet.id}`;
}

/**
 * Builds the short "Copy MCP" prompt for pasting into AI tools: intro paragraph,
 * code (HTML + optional CSS + JSX), and snapshot image link (thumbnail data URL or placeholder).
 */
export function buildCopyMcpPrompt(snippet: Snippet): string {
  const html = buildCopyHtml(snippet);
  const lines: string[] = [
    MCP_INTRO,
    "",
    "Here is the code:",
    "",
    "```html",
    html,
    "```"
  ];
  if (snippet.styleBlock?.trim()) {
    lines.push("", "```css", snippet.styleBlock.trim(), "```");
  }
  lines.push("", "```jsx", snippet.jsx, "```", "");
  return lines.join("\n");
}
