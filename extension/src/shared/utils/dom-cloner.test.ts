import { beforeEach, describe, expect, it, vi } from "vitest";
import { cloneElementTreeWithInlineStyles } from "./dom-cloner";

describe("cloneElementTreeWithInlineStyles", () => {
  beforeEach(() => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          getPropertyValue: (property: string) => {
            if (property === "display") {
              return "block";
            }
            if (property === "padding") {
              return "8px";
            }
            return "";
          }
        }) as CSSStyleDeclaration
    );
  });

  it("clones tree and inlines styles", () => {
    document.body.innerHTML = `<section id="target"><span>Hello</span></section>`;
    const target = document.getElementById("target") as HTMLElement;
    const clone = cloneElementTreeWithInlineStyles(target);

    expect(clone.tagName).toBe("SECTION");
    expect(clone.getAttribute("style")).toContain("display:block");
    expect(clone.textContent).toContain("Hello");
  });
});
