import { describe, expect, it } from "vitest";
import { buildCopyHtml, buildPreviewSrcDoc } from "./preview-srcdoc-builder";
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

  it("uses single stage wrapper only (no synthetic parent)", () => {
    const snippet = baseSnippet();

    const doc = buildPreviewSrcDoc(snippet);

    expect(doc).toContain("snippet-stage");
    expect(doc).toContain("<div>Hello</div>");
    expect(doc).not.toContain("snippet-stage-parent");
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
});
