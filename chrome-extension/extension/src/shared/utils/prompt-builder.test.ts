import { describe, it, expect } from "vitest";
import { buildSnippetPrompt, buildAdvancedSnippetPrompt, buildCopyMcpPrompt, estimateTokens } from "./prompt-builder";
import type { Snippet } from "../types/snippet";

const baseSnippet: Snippet = {
  id: "test-id",
  title: "Test Button",
  sourceUrl: "https://example.com/page",
  html: '<button class="btn">Click me</button>',
  jsx: '<button className="btn">Click me</button>',
  thumbnail: "",
  createdAt: 1700000000000,
  width: 120,
  height: 40,
};

const snippetWithCss: Snippet = {
  ...baseSnippet,
  styleBlock: ".btn { background: blue; color: white; }",
};

describe("estimateTokens", () => {
  it("returns a positive integer for non-empty text", () => {
    const result = estimateTokens("hello world");
    expect(result).toBeGreaterThan(0);
    expect(Number.isInteger(result)).toBe(true);
  });

  it("returns 0 for empty string", () => {
    expect(estimateTokens("")).toBe(0);
  });

  it("returns a larger value for longer text", () => {
    const short = estimateTokens("hi");
    const long = estimateTokens("hi".repeat(100));
    expect(long).toBeGreaterThan(short);
  });
});

describe("buildSnippetPrompt", () => {
  it("includes HTML section", () => {
    const prompt = buildSnippetPrompt(baseSnippet);
    expect(prompt).toContain("### HTML");
    expect(prompt).toContain("```html");
    expect(prompt).toContain("Click me");
  });

  it("includes JSX section", () => {
    const prompt = buildSnippetPrompt(baseSnippet);
    expect(prompt).toContain("### JSX");
    expect(prompt).toContain("```jsx");
    expect(prompt).toContain("className");
  });

  it("includes metadata", () => {
    const prompt = buildSnippetPrompt(baseSnippet);
    expect(prompt).toContain("Test Button");
    expect(prompt).toContain("example.com");
    expect(prompt).toContain("120x40");
  });

  it("includes CSS section when styleBlock is present", () => {
    const prompt = buildSnippetPrompt(snippetWithCss);
    expect(prompt).toContain("### CSS");
    expect(prompt).toContain("```css");
    expect(prompt).toContain("background: blue");
  });

  it("omits CSS section when styleBlock is absent", () => {
    const prompt = buildSnippetPrompt(baseSnippet);
    expect(prompt).not.toContain("### CSS");
  });
});

describe("buildAdvancedSnippetPrompt", () => {
  it("contains codebase-aware instructions", () => {
    const prompt = buildAdvancedSnippetPrompt(baseSnippet);
    expect(prompt).toContain("Element Armory");
    expect(prompt).toContain("implement this element into our code base");
    expect(prompt).toContain("match our existing codebase and rules");
    expect(prompt).toContain("placeholders");
  });

  it("includes html content", () => {
    const prompt = buildAdvancedSnippetPrompt(baseSnippet);
    expect(prompt).toContain("Click me");
  });

  it("includes css content when present", () => {
    const prompt = buildAdvancedSnippetPrompt(snippetWithCss);
    expect(prompt).toContain("background: blue");
  });

  it("references css and html fields", () => {
    const prompt = buildAdvancedSnippetPrompt(snippetWithCss);
    expect(prompt).toContain("The css code is:");
    expect(prompt).toContain("and the html code to go with it is:");
  });
});

describe("buildCopyMcpPrompt", () => {
  it("contains MCP intro text", () => {
    const prompt = buildCopyMcpPrompt(baseSnippet);
    expect(prompt).toContain("Element Armory");
    expect(prompt).toContain("implement this UI component");
  });

  it("includes HTML block", () => {
    const prompt = buildCopyMcpPrompt(baseSnippet);
    expect(prompt).toContain("```html");
    expect(prompt).toContain("Click me");
  });

  it("includes CSS block when styleBlock is present", () => {
    const prompt = buildCopyMcpPrompt(snippetWithCss);
    expect(prompt).toContain("```css");
    expect(prompt).toContain("background: blue");
  });

  it("omits CSS block when styleBlock is absent", () => {
    const prompt = buildCopyMcpPrompt(baseSnippet);
    const cssBlockCount = (prompt.match(/```css/g) ?? []).length;
    expect(cssBlockCount).toBe(0);
  });

  it("includes JSX block", () => {
    const prompt = buildCopyMcpPrompt(baseSnippet);
    expect(prompt).toContain("```jsx");
    expect(prompt).toContain("className");
  });
});
