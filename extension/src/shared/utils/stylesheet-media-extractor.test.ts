import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
    const result = extractMediaAndContainerRules(el, "snippet-root-1");
    expect(result).toBe("");
  });

  it("extracts rules from @media blocks that match element", () => {
    styleEl.textContent = `
      @media (min-width: 768px) {
        .card { padding: 24px; margin: 0; }
      }
    `;
    const el = document.getElementById("target")!;
    const result = extractMediaAndContainerRules(el, "snippet-root-1");
    expect(result).toContain("@media");
    expect(result).toContain("(min-width: 768px)");
    expect(result).toContain("#snippet-root-1");
    expect(result).toContain("padding:24px");
  });
});
