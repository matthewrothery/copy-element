import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractMediaAndContainerRules } from "./stylesheet-media-extractor";

describe("extractMediaAndContainerRules", () => {
  let styleEl: HTMLStyleElement;

  beforeEach(() => {
    document.body.innerHTML = `<div id="target" class="card">Hello</div>`;
    styleEl = document.createElement("style");
    document.head.appendChild(styleEl);
  });

  afterEach(() => {
    styleEl?.remove();
  });

  it("returns empty string when no stylesheets match", () => {
    const el = document.getElementById("target")!;
    const result = extractMediaAndContainerRules(
      el,
      "snippet-root-1",
      "https://example.com/"
    );
    expect(result).toBe("");
  });

  it("extracts rules from @media blocks that match element", () => {
    styleEl.textContent = `
      @media (min-width: 768px) {
        .card { padding: 24px; margin: 0; }
      }
    `;
    const el = document.getElementById("target")!;
    const result = extractMediaAndContainerRules(
      el,
      "snippet-root-1",
      "https://example.com/"
    );
    expect(result).toContain("@media");
    expect(result).toContain("(min-width: 768px)");
    expect(result).toContain("#snippet-root-1");
    expect(result).toContain("padding:24px");
  });

  it("absolutizes background-image URLs in stylesheet rules", () => {
    styleEl.textContent = `
      @media (min-width: 768px) {
        .card { background-image: url(/hero.png); }
      }
    `;
    const el = document.getElementById("target")!;
    const result = extractMediaAndContainerRules(
      el,
      "snippet-root-1",
      "https://example.com/"
    );
    expect(result).toContain('url("https://example.com/hero.png")');
  });

  it("resolves var(--*) in media rule values to computed values", () => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          getPropertyValue: (prop: string) =>
            prop === "color" ? "rgb(34, 34, 34)" : ""
        }) as CSSStyleDeclaration
    );
    styleEl.textContent = `
      @media (min-width: 768px) {
        .card { color: var(--primary); }
      }
    `;
    const el = document.getElementById("target")!;
    const result = extractMediaAndContainerRules(
      el,
      "snippet-root-1",
      "https://example.com/"
    );
    expect(result).toContain("color:rgb(34, 34, 34)");
    expect(result).not.toContain("var(--primary)");
  });
});
