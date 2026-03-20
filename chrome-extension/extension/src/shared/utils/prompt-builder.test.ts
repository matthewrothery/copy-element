import { describe, expect, it } from "vitest";
import { buildBasicAiPrompt, buildAdvancedAiPrompt } from "./prompt-builder";
import type { Snippet } from "../types/snippet";

const BASE_SNIPPET: Snippet = {
  id: "test-1",
  title: "Test Card",
  sourceUrl: "https://example.com/page",
  html: "<div>hello</div>",
  jsx: "<div>hello</div>",
  thumbnail: "",
  createdAt: 1700000000000,
  width: 320,
  height: 200,
};

describe("buildBasicAiPrompt", () => {
  it("includes the implementation instruction and HTML", () => {
    const prompt = buildBasicAiPrompt(BASE_SNIPPET);
    expect(prompt).toContain("Implement this component in our codebase.");
    expect(prompt).toContain("<div>hello</div>");
    expect(prompt).toContain("```html");
  });

  it("includes CSS block when styleBlock is present", () => {
    const snippet = { ...BASE_SNIPPET, styleBlock: ".foo { color: red; }" };
    const prompt = buildBasicAiPrompt(snippet);
    expect(prompt).toContain("```css");
    expect(prompt).toContain(".foo { color: red; }");
  });

  it("omits CSS block when styleBlock is absent", () => {
    const prompt = buildBasicAiPrompt(BASE_SNIPPET);
    expect(prompt).not.toContain("```css");
  });

  it("omits CSS block when styleBlock is empty", () => {
    const snippet = { ...BASE_SNIPPET, styleBlock: "   " };
    const prompt = buildBasicAiPrompt(snippet);
    expect(prompt).not.toContain("```css");
  });
});

describe("buildAdvancedAiPrompt", () => {
  it("includes snippet title, source URL, and dimensions", () => {
    const prompt = buildAdvancedAiPrompt(BASE_SNIPPET);
    expect(prompt).toContain("Test Card");
    expect(prompt).toContain("https://example.com/page");
    expect(prompt).toContain("320x200");
  });

  it("includes HTML, CSS, and JSX sections", () => {
    const snippet = { ...BASE_SNIPPET, styleBlock: ".bar { margin: 0; }" };
    const prompt = buildAdvancedAiPrompt(snippet);
    expect(prompt).toContain("### HTML");
    expect(prompt).toContain("### CSS");
    expect(prompt).toContain("### JSX");
    expect(prompt).toContain(".bar { margin: 0; }");
    expect(prompt).toContain("<div>hello</div>");
  });

  it("omits CSS section when styleBlock is absent", () => {
    const prompt = buildAdvancedAiPrompt(BASE_SNIPPET);
    expect(prompt).not.toContain("### CSS");
  });

  it("includes codebase-aware instruction", () => {
    const prompt = buildAdvancedAiPrompt(BASE_SNIPPET);
    expect(prompt).toContain("Implement this UI component in our codebase");
  });
});
