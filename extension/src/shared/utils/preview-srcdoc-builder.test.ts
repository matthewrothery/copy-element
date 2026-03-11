import { describe, expect, it } from "vitest";
import {
  buildCopyHtml,
  buildPreviewForCapture,
  buildPreviewSrcDoc
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

  it("omits style block when includeStyleBlock is false", () => {
    const snippet = baseSnippet({ styleBlock: "#root{padding:8px}" });
    const result = buildCopyHtml(snippet, { includeStyleBlock: false });
    expect(result).toBe("<div>Hello</div>");
    expect(result).not.toContain("<style>");
  });
});

describe("buildPreviewForCapture", () => {
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
