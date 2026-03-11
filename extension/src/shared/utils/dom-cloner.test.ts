import { beforeEach, describe, expect, it, vi } from "vitest";
import { cloneElementTreeWithInlineStyles } from "./dom-cloner";

const BASE_URL = "https://example.com/page/";

describe("cloneElementTreeWithInlineStyles", () => {
  beforeEach(() => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (element: Element, pseudo?: string) =>
        ({
          getPropertyValue: (property: string) => {
            if (pseudo) return "";
            if (property === "display") return "block";
            if (property === "padding") return "8px";
            return "";
          }
        }) as CSSStyleDeclaration
    );
  });

  it("clones tree and inlines styles", () => {
    document.body.innerHTML = `<section id="target"><span>Hello</span></section>`;
    const target = document.getElementById("target") as HTMLElement;
    const clone = cloneElementTreeWithInlineStyles(target, BASE_URL);

    expect(clone.tagName).toBe("SECTION");
    expect(clone.getAttribute("style")).toContain("padding:8px");
    expect(clone.getAttribute("style")).not.toContain("display:block");
    expect(clone.textContent).toContain("Hello");
  });

  it("removes script and noscript tags from clone", () => {
    document.body.innerHTML = `
      <div id="target">
        <span>Before</span>
        <script>alert('xss')</script>
        <noscript>No JS</noscript>
        <span>After</span>
      </div>
    `;
    const target = document.getElementById("target") as HTMLElement;
    const clone = cloneElementTreeWithInlineStyles(target, BASE_URL);

    expect(clone.querySelector("script")).toBeNull();
    expect(clone.querySelector("noscript")).toBeNull();
    expect(clone.textContent).toContain("Before");
    expect(clone.textContent).toContain("After");
  });

  it("removes inline event handlers", () => {
    document.body.innerHTML = `<div id="target" onclick="alert(1)" onmouseover="x()"><span>Hi</span></div>`;
    const target = document.getElementById("target") as HTMLElement;
    const clone = cloneElementTreeWithInlineStyles(target, BASE_URL);

    expect(clone.hasAttribute("onclick")).toBe(false);
    expect(clone.hasAttribute("onmouseover")).toBe(false);
    expect(clone.textContent).toContain("Hi");
  });

  it("removes tracking and analytics attributes", () => {
    document.body.innerHTML = `
      <div id="target" data-testid="foo" data-reactroot="x" ng-if="y" data-ng-click="z">
        <span>Content</span>
      </div>
    `;
    const target = document.getElementById("target") as HTMLElement;
    const clone = cloneElementTreeWithInlineStyles(target, BASE_URL);

    expect(clone.hasAttribute("data-testid")).toBe(false);
    expect(clone.hasAttribute("data-reactroot")).toBe(false);
    expect(clone.hasAttribute("ng-if")).toBe(false);
    expect(clone.hasAttribute("data-ng-click")).toBe(false);
    expect(clone.textContent).toContain("Content");
  });

  it("preserves text nodes in DOM order", () => {
    document.body.innerHTML = `<div id="target">Before<span>middle</span>After</div>`;
    const target = document.getElementById("target") as HTMLElement;
    const clone = cloneElementTreeWithInlineStyles(target, BASE_URL);

    expect(clone.textContent).toBe("BeforemiddleAfter");
    expect(clone.childNodes.length).toBe(3);
    expect(clone.childNodes[0].nodeType).toBe(Node.TEXT_NODE);
    expect(clone.childNodes[0].textContent).toBe("Before");
    expect(clone.childNodes[1].nodeType).toBe(Node.ELEMENT_NODE);
    expect(clone.childNodes[2].nodeType).toBe(Node.TEXT_NODE);
    expect(clone.childNodes[2].textContent).toBe("After");
  });

  it("includes ::before pseudo element when it has content", () => {
    vi.mocked(window.getComputedStyle).mockImplementation(
      (element: Element, pseudo?: string) =>
        ({
          getPropertyValue: (property: string) => {
            if (property === "display") return "block";
            if (property === "padding") return "8px";
            if (pseudo === "::before" && property === "content") return '"• "';
            if (pseudo === "::before" && property === "color") return "rgb(100, 100, 100)";
            if (pseudo === "::after" && property === "content") return "none";
            return "";
          }
        }) as CSSStyleDeclaration
    );

    document.body.innerHTML = `<div id="target"><span>Item</span></div>`;
    const target = document.getElementById("target") as HTMLElement;
    const clone = cloneElementTreeWithInlineStyles(target, BASE_URL);

    const beforePseudo = clone.querySelector('[data-pseudo-element="::before"]');
    expect(beforePseudo).not.toBeNull();
    expect(beforePseudo?.textContent).toBe("• ");
  });

  it("includes ::after pseudo element when it has content", () => {
    vi.mocked(window.getComputedStyle).mockImplementation(
      (element: Element, pseudo?: string) =>
        ({
          getPropertyValue: (property: string) => {
            if (property === "display") return "block";
            if (property === "padding") return "8px";
            if (pseudo === "::before" && property === "content") return "none";
            if (pseudo === "::after" && property === "content") return '" →"';
            return "";
          }
        }) as CSSStyleDeclaration
    );

    document.body.innerHTML = `<div id="target"><span>Link</span></div>`;
    const target = document.getElementById("target") as HTMLElement;
    const clone = cloneElementTreeWithInlineStyles(target, BASE_URL);

    const afterPseudo = clone.querySelector('[data-pseudo-element="::after"]');
    expect(afterPseudo).not.toBeNull();
    expect(afterPseudo?.textContent).toBe(" →");
  });

  it("preserves inline SVG markup and attributes including viewBox", () => {
    document.body.innerHTML = `
      <div id="target">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" fill="currentColor"/>
        </svg>
      </div>
    `;
    const target = document.getElementById("target") as HTMLElement;
    const clone = cloneElementTreeWithInlineStyles(target, BASE_URL);

    const svg = clone.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("viewBox")).toBe("0 0 24 24");
    expect(svg?.getAttribute("xmlns")).toBe("http://www.w3.org/2000/svg");

    const circle = clone.querySelector("circle");
    expect(circle).not.toBeNull();
    expect(circle?.getAttribute("cx")).toBe("12");
    expect(circle?.getAttribute("cy")).toBe("12");
    expect(circle?.getAttribute("r")).toBe("10");
    expect(circle?.getAttribute("fill")).toBe("currentColor");
  });

  it("preserves same-document SVG use reference", () => {
    document.body.innerHTML = `
      <div id="target">
        <svg xmlns="http://www.w3.org/2000/svg">
          <defs><symbol id="s"><circle r="5"/></symbol></defs>
          <use href="#s"/>
        </svg>
      </div>
    `;
    const target = document.getElementById("target") as HTMLElement;
    const clone = cloneElementTreeWithInlineStyles(target, BASE_URL);

    const use = clone.querySelector("use");
    expect(use?.getAttribute("href")).toBe("#s");
    const symbol = clone.querySelector("symbol[id='s']");
    expect(symbol).not.toBeNull();
    expect(symbol?.querySelector("circle")).not.toBeNull();
  });

  it("combines margin longhand into shorthand", () => {
    vi.mocked(window.getComputedStyle).mockImplementation(
      (element: Element, pseudo?: string) =>
        ({
          getPropertyValue: (property: string) => {
            if (pseudo) return "";
            if (property === "margin-top") return "10px";
            if (property === "margin-right") return "10px";
            if (property === "margin-bottom") return "10px";
            if (property === "margin-left") return "10px";
            return "";
          }
        }) as CSSStyleDeclaration
    );

    document.body.innerHTML = `<div id="target"><span>x</span></div>`;
    const target = document.getElementById("target") as HTMLElement;
    const clone = cloneElementTreeWithInlineStyles(target, BASE_URL);

    const style = clone.getAttribute("style") ?? "";
    expect(style).toContain("margin:10px");
    expect(style).not.toContain("margin-top");
  });

  it("preserves essential attributes", () => {
    document.body.innerHTML = `
      <div id="target">
        <img src="/img.png" alt="An image" title="Tooltip" />
        <a href="/page">Link</a>
        <span aria-label="Accessible">Text</span>
      </div>
    `;
    const target = document.getElementById("target") as HTMLElement;
    const clone = cloneElementTreeWithInlineStyles(target, BASE_URL);

    const img = clone.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/img.png");
    expect(img?.getAttribute("alt")).toBe("An image");
    expect(img?.getAttribute("title")).toBe("Tooltip");

    const link = clone.querySelector("a");
    expect(link?.getAttribute("href")).toBe("/page");

    const span = clone.querySelector("span");
    expect(span?.getAttribute("aria-label")).toBe("Accessible");
  });
});
