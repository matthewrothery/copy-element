import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildPseudoElementClone } from "./pseudo-element-extractor";

describe("buildPseudoElementClone", () => {
  beforeEach(() => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (element: Element, pseudo?: string) =>
        ({
          getPropertyValue: (property: string) => {
            const values: Record<string, string> = {};
            if (pseudo === "::before" || pseudo === "::after") {
              values.content = '""';
              values["background-color"] = "transparent";
              values.position = "static";
            }
            return values[property] ?? "";
          }
        }) as CSSStyleDeclaration
    );
  });

  it("returns span with text when content is quoted string", () => {
    vi.mocked(window.getComputedStyle).mockImplementation(
      (element: Element, pseudo?: string) =>
        ({
          getPropertyValue: (property: string) => {
            if (pseudo === "::before" && property === "content") return '"x"';
            if (pseudo === "::before" && property === "color") return "rgb(255, 0, 0)";
            return "";
          }
        }) as CSSStyleDeclaration
    );

    document.body.innerHTML = `<div id="target"></div>`;
    const target = document.getElementById("target") as HTMLElement;
    const result = buildPseudoElementClone(target, "::before", document);

    expect(result).not.toBeNull();
    expect(result?.tagName).toBe("SPAN");
    expect(result?.textContent).toBe("x");
    expect(result?.getAttribute("data-pseudo-element")).toBe("::before");
    expect(result?.getAttribute("aria-hidden")).toBe("true");
  });

  it("returns span with background when content is empty but has visual styles", () => {
    vi.mocked(window.getComputedStyle).mockImplementation(
      (element: Element, pseudo?: string) =>
        ({
          getPropertyValue: (property: string) => {
            if (pseudo === "::before" && property === "content") return '""';
            if (pseudo === "::before" && property === "background-color") return "rgb(255, 0, 0)";
            if (pseudo === "::before" && property === "width") return "8px";
            if (pseudo === "::before" && property === "height") return "8px";
            return "";
          }
        }) as CSSStyleDeclaration
    );

    document.body.innerHTML = `<div id="target"></div>`;
    const target = document.getElementById("target") as HTMLElement;
    const result = buildPseudoElementClone(target, "::before", document);

    expect(result).not.toBeNull();
    expect(result?.tagName).toBe("SPAN");
    expect(result?.textContent).toBe("");
    expect(result?.getAttribute("style")).toContain("background-color");
  });

  it("returns null when content is none and no visual styles", () => {
    vi.mocked(window.getComputedStyle).mockImplementation(
      (element: Element, pseudo?: string) =>
        ({
          getPropertyValue: (property: string) => {
            if (pseudo === "::before" && property === "content") return "none";
            return "";
          }
        }) as CSSStyleDeclaration
    );

    document.body.innerHTML = `<div id="target"></div>`;
    const target = document.getElementById("target") as HTMLElement;
    const result = buildPseudoElementClone(target, "::before", document);

    expect(result).toBeNull();
  });

  it("applies position absolute and top/left styles correctly", () => {
    vi.mocked(window.getComputedStyle).mockImplementation(
      (element: Element, pseudo?: string) =>
        ({
          getPropertyValue: (property: string) => {
            if (pseudo === "::before" && property === "content") return '""';
            if (pseudo === "::before" && property === "position") return "absolute";
            if (pseudo === "::before" && property === "top") return "0px";
            if (pseudo === "::before" && property === "left") return "0px";
            return "";
          }
        }) as CSSStyleDeclaration
    );

    document.body.innerHTML = `<div id="target"></div>`;
    const target = document.getElementById("target") as HTMLElement;
    const result = buildPseudoElementClone(target, "::before", document);

    expect(result).not.toBeNull();
    expect(result?.getAttribute("style")).toContain("position:absolute");
    expect(result?.getAttribute("style")).toContain("top:0px");
    expect(result?.getAttribute("style")).toContain("left:0px");
  });

  it("creates img element when content is url()", () => {
    vi.mocked(window.getComputedStyle).mockImplementation(
      (element: Element, pseudo?: string) =>
        ({
          getPropertyValue: (property: string) => {
            if (pseudo === "::after" && property === "content") return 'url("https://example.com/icon.png")';
            return "";
          }
        }) as CSSStyleDeclaration
    );

    document.body.innerHTML = `<div id="target"></div>`;
    const target = document.getElementById("target") as HTMLElement;
    const result = buildPseudoElementClone(target, "::after", document);

    expect(result).not.toBeNull();
    expect(result?.tagName).toBe("IMG");
    expect(result?.getAttribute("src")).toBe("https://example.com/icon.png");
    expect(result?.getAttribute("data-pseudo-element")).toBe("::after");
  });
});
