import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildBaseStyleBlock } from "./style-block-builder";

describe("buildBaseStyleBlock", () => {
  beforeEach(() => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(() => ({
      getPropertyValue: (prop: string) => {
        if (prop === "display") return "flex";
        if (prop === "padding") return "16px";
        return "";
      }
    }) as CSSStyleDeclaration);
  });

  it("builds CSS rule for root with extracted styles", () => {
    document.body.innerHTML = `<div id="target">x</div>`;
    const el = document.getElementById("target")!;
    const block = buildBaseStyleBlock(el, "snippet-root-abc");

    expect(block).toContain("#snippet-root-abc");
    expect(block).toContain("padding:16px");
  });

  it("returns empty string when no non-default styles", () => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () => ({ getPropertyValue: () => "" }) as CSSStyleDeclaration
    );
    document.body.innerHTML = `<span id="empty">x</span>`;
    const el = document.getElementById("empty")!;
    const block = buildBaseStyleBlock(el, "root-x");

    expect(block).toBe("");
  });
});
