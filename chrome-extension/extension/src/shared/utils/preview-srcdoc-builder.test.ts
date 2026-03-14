import { describe, expect, it } from "vitest";
import {
  buildCopyHtml,
  buildPreviewForCapture,
  buildPreviewSrcDoc,
  externalFontLinksToImportCss
} from "./preview-srcdoc-builder";
import type { Snippet } from "../types/snippet";

function baseSnippet(overrides: Partial<Snippet> = {}): Snippet {
  return {
    id: "test-1",
    title: "Test",
    sourceUrl: "https://example.com",
    html: "<div>Hello</div>",
    jsx: "<div>Hello</div>",
    thumbnail: "",
    createdAt: 0,
    width: 200,
    height: 100,
    ...overrides
  };
}

describe("buildPreviewSrcDoc", () => {
  it("produces full HTML document with reset and stage", () => {
    const snippet = baseSnippet();
    const doc = buildPreviewSrcDoc(snippet);

    expect(doc).toContain("<!doctype html>");
    expect(doc).toContain("<html>");
    expect(doc).toContain("margin: 0");
    expect(doc).toContain("padding: 0");
    expect(doc).toContain("overflow: hidden");
    expect(doc).toContain("snippet-stage");
    expect(doc).toContain("<div>Hello</div>");
    expect(doc).toContain("width:200px");
    expect(doc).toContain("height:100px");
    expect(doc).toContain("html, body { width: 200px; height: 100px; }");
    expect(doc).toContain(".snippet-stage{width:200px;height:100px;min-width:200px;min-height:100px;overflow:hidden;}");
  });

  it("uses single stage wrapper only when no layout context", () => {
    const snippet = baseSnippet();

    const doc = buildPreviewSrcDoc(snippet);

    expect(doc).toContain("snippet-stage");
    expect(doc).toContain("<div>Hello</div>");
    expect(doc).not.toContain("snippet-stage-parent");
  });

  it("adds layout wrapper when renderContext has parentLayout", () => {
    const snippet = baseSnippet({
      renderContext: {
        parentLayout: { display: "flex", gap: "8px" }
      }
    });

    const doc = buildPreviewSrcDoc(snippet);

    expect(doc).toContain("snippet-stage-parent");
    expect(doc).toContain("display:flex");
    expect(doc).toContain("gap:8px");
    expect(doc).toContain("<div>Hello</div>");
  });

  it("adds wrapper when renderContext has inherited visual context only", () => {
    const snippet = baseSnippet({
      renderContext: {
        inheritedText: { color: "rgb(10, 20, 30)" },
        visibleBackgroundColor: "rgb(245, 245, 245)"
      }
    });

    const doc = buildPreviewSrcDoc(snippet);

    expect(doc).toContain("snippet-stage-parent");
    expect(doc).toContain("color:rgb(10, 20, 30)");
    expect(doc).toContain("background-color:rgb(245, 245, 245)");
  });

  it("injects styleBlock in head when present", () => {
    const snippet = baseSnippet({ styleBlock: "#x{color:red}" });

    const doc = buildPreviewSrcDoc(snippet);

    expect(doc).toContain("<style>#x{color:red}</style>");
  });

  it("handles zero dimensions with minimum of 1", () => {
    const snippet = baseSnippet({ width: 0, height: 0 });
    const doc = buildPreviewSrcDoc(snippet);

    expect(doc).toContain("width:1px");
    expect(doc).toContain("height:1px");
  });

  it("injects base tag when sourceUrl is present for relative URL resolution", () => {
    const snippet = baseSnippet({ sourceUrl: "https://chat.example.com/chat" });
    const doc = buildPreviewSrcDoc(snippet);

    expect(doc).toContain('<base href="https://chat.example.com/">');
  });

  it("omits base tag when sourceUrl is invalid", () => {
    const snippet = baseSnippet({ sourceUrl: "not-a-valid-url" });
    const doc = buildPreviewSrcDoc(snippet);

    expect(doc).not.toContain("<base ");
  });
});

describe("buildCopyHtml", () => {
  it("returns html only when styleBlock is absent", () => {
    const snippet = baseSnippet();
    expect(buildCopyHtml(snippet)).toBe("<div>Hello</div>");
  });

  it("prepends style tag when styleBlock is present", () => {
    const snippet = baseSnippet({ styleBlock: "#root{padding:8px}" });
    expect(buildCopyHtml(snippet)).toBe("<style>#root{padding:8px}</style><div>Hello</div>");
  });

  it("wraps content with layout div when renderContext has parentLayout", () => {
    const snippet = baseSnippet({
      renderContext: {
        parentLayout: { display: "flex", gap: "12px" }
      }
    });
    const result = buildCopyHtml(snippet);
    expect(result).toContain("snippet-stage-parent");
    expect(result).toContain("display:flex");
    expect(result).toContain("gap:12px");
    expect(result).toContain("<div>Hello</div>");
  });

  it("wraps content with visual context when inherited text/background exist", () => {
    const snippet = baseSnippet({
      renderContext: {
        inheritedText: { color: "rgb(30, 40, 50)" },
        visibleBackgroundColor: "rgb(250, 250, 250)"
      }
    });
    const result = buildCopyHtml(snippet);
    expect(result).toContain("snippet-stage-parent");
    expect(result).toContain("color:rgb(30, 40, 50)");
    expect(result).toContain("background-color:rgb(250, 250, 250)");
  });

  it("escapes quoted font-family once in wrapper style attribute", () => {
    const snippet = baseSnippet({
      renderContext: {
        inheritedText: {
          fontFamily: '"system-ui", "SF Pro Display", sans-serif'
        }
      }
    });
    const result = buildCopyHtml(snippet);
    expect(result).toContain(
      'font-family:&quot;system-ui&quot;, &quot;SF Pro Display&quot;, sans-serif'
    );
    expect(result).not.toContain("&amp;quot;");
  });

  it("omits style block when includeStyleBlock is false", () => {
    const snippet = baseSnippet({ styleBlock: "#root{padding:8px}" });
    const result = buildCopyHtml(snippet, { includeStyleBlock: false });
    expect(result).toBe("<div>Hello</div>");
    expect(result).not.toContain("<style>");
  });

  it("prepends @import for each external font stylesheet link", () => {
    const snippet = baseSnippet({
      styleBlock: "#root{color:red}",
      externalFontLinks: [
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:400,700&display=swap">',
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Manrope:wght@400;700">'
      ]
    });
    const result = buildCopyHtml(snippet);
    expect(result).toContain("@import url('https://fonts.googleapis.com/css?family=Inter:400,700&display=swap');");
    expect(result).toContain("@import url('https://fonts.googleapis.com/css?family=Manrope:wght@400;700');");
    expect(result).toContain("#root{color:red}");
    expect(result).toMatch(/<style>[\s\S]*@import[\s\S]*<\/style><div>Hello<\/div>/);
  });

  it("includes only @import when externalFontLinks present and no styleBlock", () => {
    const snippet = baseSnippet({
      externalFontLinks: [
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter">'
      ]
    });
    const result = buildCopyHtml(snippet);
    expect(result).toContain("@import url('https://fonts.googleapis.com/css2?family=Inter');");
    expect(result).toContain("<style>");
    expect(result).toContain("</style><div>Hello</div>");
  });

  it("ignores preconnect/preload links and only uses stylesheet links", () => {
    const snippet = baseSnippet({
      styleBlock: "#x{}",
      externalFontLinks: [
        '<link rel="preconnect" href="https://fonts.googleapis.com">',
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter">'
      ]
    });
    const result = buildCopyHtml(snippet);
    expect(result).toContain("@import url('https://fonts.googleapis.com/css?family=Inter');");
    expect(result).not.toContain("preconnect");
  });
});

describe("externalFontLinksToImportCss", () => {
  it("returns @import line per stylesheet link", () => {
    const links = [
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter">',
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Manrope">'
    ];
    const css = externalFontLinksToImportCss(links);
    expect(css).toBe(
      "@import url('https://fonts.googleapis.com/css?family=Inter');\n@import url('https://fonts.googleapis.com/css?family=Manrope');"
    );
  });

  it("skips non-stylesheet links", () => {
    const links = [
      '<link rel="preconnect" href="https://fonts.googleapis.com">',
      '<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter">'
    ];
    const css = externalFontLinksToImportCss(links);
    expect(css).toBe("@import url('https://fonts.googleapis.com/css?family=Inter');");
  });

  it("skips empty or invalid href", () => {
    const links = [
      '<link rel="stylesheet" href="">',
      '<link rel="stylesheet" href="https://valid.com/fonts.css">',
      '<link rel="stylesheet">'
    ];
    const css = externalFontLinksToImportCss(links);
    expect(css).toBe("@import url('https://valid.com/fonts.css');");
  });

  it("returns empty string when no stylesheet links", () => {
    expect(externalFontLinksToImportCss([])).toBe("");
    expect(externalFontLinksToImportCss(['<link rel="preconnect" href="https://fonts.gstatic.com">'])).toBe("");
  });
});

describe("buildPreviewForCapture", () => {
  it("uses deterministic stage sizing for width and height", () => {
    const doc = buildPreviewForCapture({
      html: "<span>X</span>",
      width: 240,
      height: 80,
      sourceUrl: "https://example.com"
    });
    expect(doc).toContain("html, body { width: 240px; height: 80px; }");
    expect(doc).toContain(".snippet-stage{width:240px;height:80px;min-width:240px;min-height:80px;overflow:hidden;}");
  });

  it("adds layout wrapper when renderContext has parentLayout", () => {
    const doc = buildPreviewForCapture({
      html: "<span>X</span>",
      width: 100,
      height: 50,
      sourceUrl: "https://example.com",
      renderContext: {
        parentLayout: { display: "grid", gridTemplateColumns: "1fr 1fr" }
      }
    });
    expect(doc).toContain("snippet-stage-parent");
    expect(doc).toContain("display:grid");
    expect(doc).toContain("grid-template-columns:1fr 1fr");
    expect(doc).toContain("<span>X</span>");
  });

  it("adds wrapper when renderContext only has visible ancestor context", () => {
    const doc = buildPreviewForCapture({
      html: "<span>X</span>",
      width: 100,
      height: 50,
      sourceUrl: "https://example.com",
      renderContext: {
        inheritedText: { color: "rgb(11, 22, 33)" },
        visibleBackgroundColor: "rgb(244, 244, 244)"
      }
    });
    expect(doc).toContain("snippet-stage-parent");
    expect(doc).toContain("color:rgb(11, 22, 33)");
    expect(doc).toContain("background-color:rgb(244, 244, 244)");
  });

  it("omits layout wrapper when renderContext is absent", () => {
    const doc = buildPreviewForCapture({
      html: "<span>X</span>",
      width: 100,
      height: 50,
      sourceUrl: "https://example.com"
    });
    expect(doc).not.toContain("snippet-stage-parent");
    expect(doc).toContain("<span>X</span>");
  });
});
