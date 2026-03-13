import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  collectVarNamesFromCss,
  extractUsedCssVariableDefinitions
} from "./css-var-definition-extractor";
import type { CssVariableDefinition } from "./css-var-definition-index";

describe("collectVarNamesFromCss", () => {
  it("collects single var reference", () => {
    const css = ".x { font-size: var(--typo-copy); }";
    expect(collectVarNamesFromCss(css)).toEqual(new Set(["--typo-copy"]));
  });

  it("collects multiple var references and deduplicates", () => {
    const css = `
      .a { font-size: var(--typo-copy); }
      .b { color: var(--typo-copy); line-height: var(--typo-title); }
    `;
    expect(collectVarNamesFromCss(css)).toEqual(
      new Set(["--typo-copy", "--typo-title"])
    );
  });

  it("collects var with fallback", () => {
    const css = ".x { color: var(--primary, #000); }";
    expect(collectVarNamesFromCss(css)).toEqual(new Set(["--primary"]));
  });

  it("collects nested fallback var references", () => {
    const css = ".x { margin: var(--a, var(--b, var(--c, 12px))); }";
    expect(collectVarNamesFromCss(css)).toEqual(new Set(["--a", "--b", "--c"]));
  });

  it("returns empty set when no var() in css", () => {
    expect(collectVarNamesFromCss(".x { color: red; }")).toEqual(new Set());
    expect(collectVarNamesFromCss("")).toEqual(new Set());
  });
});

describe("extractUsedCssVariableDefinitions", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="root"></div>`;
  });

  it("returns empty string when cssText has no var()", async () => {
    const root = document.getElementById("root")!;
    expect(
      await extractUsedCssVariableDefinitions(root, ".x { color: red; }")
    ).toBe("");
  });

  it("returns empty string when no variables have computed values", async () => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () => ({ getPropertyValue: () => "" }) as CSSStyleDeclaration
    );
    const root = document.getElementById("root")!;
    expect(
      await extractUsedCssVariableDefinitions(root, ".x { font-size: var(--typo); }")
    ).toBe("");
  });

  it("returns :root block with resolved values", async () => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) =>
            name === "--typo-copy" ? "16px" : name === "--typo-title" ? "48px" : ""
        }) as CSSStyleDeclaration
    );
    const root = document.getElementById("root")!;
    const css = ".x { font-size: var(--typo-copy); } .y { font-size: var(--typo-title); }";
    const result = await extractUsedCssVariableDefinitions(root, css);
    expect(result).toContain(":root {");
    expect(result).toContain("--typo-copy: 16px");
    expect(result).toContain("--typo-title: 48px");
  });

  it("omits variables whose computed value is empty", async () => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) =>
            name === "--typo-copy" ? "16px" : ""
        }) as CSSStyleDeclaration
    );
    const root = document.getElementById("root")!;
    const css = ".x { font-size: var(--typo-copy); color: var(--missing); }";
    const result = await extractUsedCssVariableDefinitions(root, css);
    expect(result).toContain("--typo-copy: 16px");
    expect(result).not.toContain("--missing");
  });

  it("includes transitive variable dependencies from provided definitions", async () => {
    const defs: CssVariableDefinition[] = [
      {
        name: "--hds-space-section-gap-top",
        value: "var(--hds-space-core-1200)",
        selector: ":root",
        sourceOrder: 1
      },
      {
        name: "--hds-space-core-1200",
        value: "96px",
        selector: ":root",
        sourceOrder: 2
      }
    ];

    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          getPropertyValue: () => ""
        }) as CSSStyleDeclaration
    );

    const root = document.getElementById("root")!;
    const css = ".x { padding-top: var(--hds-space-section-gap-top); }";
    const result = await extractUsedCssVariableDefinitions(root, css, { definitions: defs });
    expect(result).toContain("--hds-space-section-gap-top: var(--hds-space-core-1200)");
    expect(result).toContain("--hds-space-core-1200: 96px");
  });

  it("emits media-scoped variable overrides", async () => {
    const defs: CssVariableDefinition[] = [
      {
        name: "--hds-space-core-1200",
        value: "72px",
        selector: ":root",
        sourceOrder: 1
      },
      {
        name: "--hds-space-core-1200",
        value: "96px",
        selector: ":root",
        media: "(min-width: 940px)",
        sourceOrder: 2
      }
    ];
    const root = document.getElementById("root")!;
    const css = ".x { margin-top: var(--hds-space-core-1200); }";
    const result = await extractUsedCssVariableDefinitions(root, css, { definitions: defs });
    expect(result).toContain(":root {");
    expect(result).toContain("--hds-space-core-1200: 72px");
    expect(result).toContain("@media (min-width: 940px)");
    expect(result).toContain("--hds-space-core-1200: 96px");
  });

  it("uses snippet-root fallback block when definition is unresolved", async () => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) => (name === "--missing" ? "20px" : "")
        }) as CSSStyleDeclaration
    );
    const root = document.getElementById("root")!;
    const css = ".x { gap: var(--missing); }";
    const result = await extractUsedCssVariableDefinitions(root, css, {
      definitions: [],
      rootSelector: "#snippet-root-test"
    });
    expect(result).toContain("#snippet-root-test {");
    expect(result).toContain("--missing: 20px");
    expect(result).not.toContain(":root {");
  });
});
