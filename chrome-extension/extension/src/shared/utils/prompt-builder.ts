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
  const html = buildCopyHtml(snippet, { includeStyleBlock: false});
  let lines: string[] = [
    `## UI Snippet: ${snippet.title}`,
    "",
    `Source: ${snippet.sourceUrl}`,
    `Captured using: Element Armory - https://elementarmory.com`,
    `Dimensions: ${snippet.width}x${snippet.height}`,
    "",
    "### HTML",
    "This is the HTML code for the element.",
    "```html",
    html,
    "```"
  ];
  if (snippet.styleBlock?.trim()) {
    lines.push("", "### CSS", "This is the CSS code for the element.", "```css", snippet.styleBlock.trim(), "```");
  }

  // lines.splice(4, 0, `Estimated tokens: ~${estimateTokens(lines.join("\n"))}`);

  return lines.join("\n");
}

/**
 * Builds the codebase-aware advanced prompt for Pro users. Instructs the AI to implement
 * the captured element into the existing codebase, matching its style and conventions.
 */
export function buildAdvancedSnippetPrompt(snippet: Snippet): string {
  const html = buildCopyHtml(snippet, { includeStyleBlock: false});
  let lines: string[] = [
    `We have extracted a components styles and html code using the chrome extension Element Armory - https://elementarmory.com.`,
    `Component dimensions: ${snippet.width}x${snippet.height}`,
    `Captured from: ${snippet.sourceUrl}`,
    `You need to implement this component into our code base. Focus on creating a perfect replica with style changes to match our existing codebase and rules. The code may include external resources, replace them with existing resources we have, or placeholders.`,
    `Take into account desktop, mobile and tablet views.`,
    `The component needs to be reusable and dynamic, so it can be used in a variety of contexts.`,
    `The html code is: \n\`\`\`html\n${html}\n\`\`\``
  ];
  if (snippet.styleBlock?.trim()) {
    lines.push(`The css code is: \n\`\`\`css\n${snippet.styleBlock.trim()}\n\`\`\``);
  }

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
  return buildShortMcpPrompt(snippet);
  
  // const html = buildCopyHtml(snippet);
  // const lines: string[] = [
  //   MCP_INTRO,
  //   "",
  //   "Here is the code:",
  //   "",
  //   "```html",
  //   html,
  //   "```"
  // ];
  // if (snippet.styleBlock?.trim()) {
  //   lines.push("", "```css", snippet.styleBlock.trim(), "```");
  // }
  // lines.push("", "```jsx", snippet.jsx, "```", "");
  // return lines.join("\n");
}
