import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildRenderContextFromElement,
  extractParentLayoutContext,
  findNearestLayoutParent,
  getLayoutDisplayKind
} from "./parent-layout-extractor";

describe("parent-layout-extractor", () => {
  beforeEach(() => {
    vi.spyOn(window, "getComputedStyle").mockImplementation((el: Element) => {
      const styles: Record<string, string> = {};
      const layout = (el as HTMLElement).getAttribute("data-layout");
      if (layout === "flex") {
        styles.display = "flex";
        styles["flex-direction"] = "row";
        styles.gap = "8px";
      } else if (layout === "grid") {
        styles.display = "grid";
        styles["grid-template-columns"] = "1fr 1fr";
      } else {
        styles.display = "block";
      }
      return {
        getPropertyValue: (prop: string) => styles[prop] ?? ""
      } as CSSStyleDeclaration;
    });
  });

  it("findNearestLayoutParent returns null when no flex/grid parent", () => {
    document.body.innerHTML = `<div><div><span id="child">x</span></div></div>`;
    const child = document.getElementById("child")!;
    expect(findNearestLayoutParent(child)).toBeNull();
  });

  it("findNearestLayoutParent returns flex parent", () => {
    document.body.innerHTML = `<div data-layout="flex"><div id="child">x</div></div>`;
    const child = document.getElementById("child")!;
    const parent = findNearestLayoutParent(child);
    expect(parent).not.toBeNull();
    expect(parent?.getAttribute("data-layout")).toBe("flex");
  });

  it("extractParentLayoutContext extracts layout properties and omits defaults", () => {
    document.body.innerHTML = `<div data-layout="flex" id="parent"><span id="child">x</span></div>`;
    const parent = document.getElementById("parent")!;
    const ctx = extractParentLayoutContext(parent);
    expect(ctx.display).toBe("flex");
    expect(ctx.flexDirection).toBeUndefined();
    expect(ctx.gap).toBe("8px");
  });

  it("buildRenderContextFromElement returns undefined when no layout parent", () => {
    document.body.innerHTML = `<div><span id="child">x</span></div>`;
    const child = document.getElementById("child")!;
    expect(buildRenderContextFromElement(child)).toBeUndefined();
  });

  it("getLayoutDisplayKind classifies flex and grid", () => {
    expect(getLayoutDisplayKind("flex")).toBe("flex");
    expect(getLayoutDisplayKind("inline-flex")).toBe("flex");
    expect(getLayoutDisplayKind("grid")).toBe("grid");
    expect(getLayoutDisplayKind("inline-grid")).toBe("grid");
  });

  it("buildRenderContextFromElement returns context when layout parent exists", () => {
    document.body.innerHTML = `<div data-layout="flex"><span id="child">x</span></div>`;
    const child = document.getElementById("child")!;
    const ctx = buildRenderContextFromElement(child);
    expect(ctx).toBeDefined();
    expect(ctx?.parentLayout?.display).toBe("flex");
    expect(ctx?.parentLayout?.gap).toBe("8px");
  });
});
