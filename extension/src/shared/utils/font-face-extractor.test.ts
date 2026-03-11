import { describe, it, expect, beforeEach } from "vitest";
import { extractUsedFontFaces } from "./font-face-extractor";

describe("extractUsedFontFaces", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  // Skip font-face tests in jsdom as CSSFontFaceRule is not available
  it.skipIf(typeof CSSFontFaceRule === "undefined")("extracts @font-face rules for used fonts", () => {
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: "CustomFont";
        src: url("/fonts/custom.woff2") format("woff2");
      }
      @font-face {
        font-family: "UnusedFont";
        src: url("/fonts/unused.woff2") format("woff2");
      }
    `;
    document.head.appendChild(style);

    const usedFonts = new Set(["CustomFont"]);
    const result = extractUsedFontFaces(usedFonts, "https://example.com");

    expect(result).toContain("CustomFont");
    expect(result).toContain("https://example.com/fonts/custom.woff2");
    expect(result).not.toContain("UnusedFont");
  });

  it.skipIf(typeof CSSFontFaceRule === "undefined")("converts relative URLs to absolute", () => {
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: "TestFont";
        src: url("fonts/test.woff2") format("woff2");
      }
    `;
    document.head.appendChild(style);

    const usedFonts = new Set(["TestFont"]);
    const result = extractUsedFontFaces(usedFonts, "https://example.com/page/");

    expect(result).toContain("https://example.com/page/fonts/test.woff2");
  });

  it.skipIf(typeof CSSFontFaceRule === "undefined")("handles font names with quotes", () => {
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: 'Quoted Font';
        src: url("/fonts/quoted.woff2") format("woff2");
      }
    `;
    document.head.appendChild(style);

    const usedFonts = new Set(["Quoted Font"]);
    const result = extractUsedFontFaces(usedFonts, "https://example.com");

    expect(result).toContain("Quoted Font");
  });

  it("returns empty string when no fonts are used", () => {
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: "TestFont";
        src: url("/fonts/test.woff2") format("woff2");
      }
    `;
    document.head.appendChild(style);

    const usedFonts = new Set<string>();
    const result = extractUsedFontFaces(usedFonts, "https://example.com");

    expect(result).toBe("");
  });

  it.skipIf(typeof CSSFontFaceRule === "undefined")("extracts @font-face from @supports blocks", () => {
    const style = document.createElement("style");
    style.textContent = `
      @supports (font-variation-settings: normal) {
        @font-face {
          font-family: "VariableFont";
          src: url("/fonts/variable.woff2") format("woff2");
        }
      }
    `;
    document.head.appendChild(style);

    const usedFonts = new Set(["VariableFont"]);
    const result = extractUsedFontFaces(usedFonts, "https://example.com");

    expect(result).toContain("@supports");
    expect(result).toContain("VariableFont");
  });

  it.skipIf(typeof CSSFontFaceRule === "undefined")("extracts @font-face from @media blocks", () => {
    const style = document.createElement("style");
    style.textContent = `
      @media screen {
        @font-face {
          font-family: "MediaFont";
          src: url("/fonts/media.woff2") format("woff2");
        }
      }
    `;
    document.head.appendChild(style);

    const usedFonts = new Set(["MediaFont"]);
    const result = extractUsedFontFaces(usedFonts, "https://example.com");

    expect(result).toContain("@media");
    expect(result).toContain("MediaFont");
  });
});
