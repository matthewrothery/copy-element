import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  collectVarNamesFromCss,
  extractUsedCssVariableDefinitions
} from "./css-var-definition-extractor";

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

  it("returns empty set when no var() in css", () => {
    expect(collectVarNamesFromCss(".x { color: red; }")).toEqual(new Set());
    expect(collectVarNamesFromCss("")).toEqual(new Set());
  });
});

describe("extractUsedCssVariableDefinitions", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="root"></div>`;
  });

  it("returns empty string when cssText has no var()", () => {
    const root = document.getElementById("root")!;
    expect(
      extractUsedCssVariableDefinitions(root, ".x { color: red; }")
    ).toBe("");
  });

  it("returns empty string when no variables have computed values", () => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () => ({ getPropertyValue: () => "" }) as CSSStyleDeclaration
    );
    const root = document.getElementById("root")!;
    expect(
      extractUsedCssVariableDefinitions(root, ".x { font-size: var(--typo); }")
    ).toBe("");
  });

  it("returns :root block with resolved values", () => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) =>
            name === "--typo-copy" ? "16px" : name === "--typo-title" ? "48px" : ""
        }) as CSSStyleDeclaration
    );
    const root = document.getElementById("root")!;
    const css = ".x { font-size: var(--typo-copy); } .y { font-size: var(--typo-title); }";
    const result = extractUsedCssVariableDefinitions(root, css);
    expect(result).toContain(":root {");
    expect(result).toContain("--typo-copy: 16px");
    expect(result).toContain("--typo-title: 48px");
  });

  it("omits variables whose computed value is empty", () => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) =>
            name === "--typo-copy" ? "16px" : ""
        }) as CSSStyleDeclaration
    );
    const root = document.getElementById("root")!;
    const css = ".x { font-size: var(--typo-copy); color: var(--missing); }";
    const result = extractUsedCssVariableDefinitions(root, css);
    expect(result).toContain("--typo-copy: 16px");
    expect(result).not.toContain("--missing");
  });
});
