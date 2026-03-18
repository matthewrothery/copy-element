import { describe, it, expect, vi, beforeEach } from "vitest";
import { stampPseudoIds, extractPseudoElementRules } from "./pseudo-element-extractor";

const PSEUDO_ID_ATTR = "data-ea-id";

function makeElement(tag = "div"): HTMLElement {
  return document.createElement(tag);
}

describe("stampPseudoIds", () => {
  it("stamps data-ea-id on root and all descendants", () => {
    const root = makeElement();
    const child = makeElement("span");
    root.appendChild(child);
    document.body.appendChild(root);

    const unstamp = stampPseudoIds(root);
    expect(root.getAttribute(PSEUDO_ID_ATTR)).toBe("0");
    expect(child.getAttribute(PSEUDO_ID_ATTR)).toBe("1");

    unstamp();
    document.body.removeChild(root);
  });

  it("cleanup removes the attribute from all elements", () => {
    const root = makeElement();
    const child = makeElement("span");
    root.appendChild(child);
    document.body.appendChild(root);

    const unstamp = stampPseudoIds(root);
    unstamp();

    expect(root.hasAttribute(PSEUDO_ID_ATTR)).toBe(false);
    expect(child.hasAttribute(PSEUDO_ID_ATTR)).toBe(false);
    document.body.removeChild(root);
  });
});

describe("extractPseudoElementRules", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("skips elements where content is 'none'", () => {
    const root = makeElement();
    root.setAttribute(PSEUDO_ID_ATTR, "0");
    document.body.appendChild(root);

    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      content: "none",
      getPropertyValue: () => "",
    } as unknown as CSSStyleDeclaration);

    const rules = extractPseudoElementRules(root);
    expect(rules).toHaveLength(0);

    document.body.removeChild(root);
  });

  it("skips elements where content is empty string", () => {
    const root = makeElement();
    root.setAttribute(PSEUDO_ID_ATTR, "0");
    document.body.appendChild(root);

    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      content: "",
      getPropertyValue: () => "",
    } as unknown as CSSStyleDeclaration);

    const rules = extractPseudoElementRules(root);
    expect(rules).toHaveLength(0);

    document.body.removeChild(root);
  });

  it("skips elements where content is 'normal'", () => {
    const root = makeElement();
    root.setAttribute(PSEUDO_ID_ATTR, "0");
    document.body.appendChild(root);

    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      content: "normal",
      getPropertyValue: () => "",
    } as unknown as CSSStyleDeclaration);

    const rules = extractPseudoElementRules(root);
    expect(rules).toHaveLength(0);

    document.body.removeChild(root);
  });

  it("includes a rule with correct selector format when content is non-trivial", () => {
    const root = makeElement();
    root.setAttribute(PSEUDO_ID_ATTR, "0");
    document.body.appendChild(root);

    vi.spyOn(window, "getComputedStyle").mockImplementation((_el, pseudo) => {
      if (pseudo === "::before") {
        return {
          content: '"•"',
          getPropertyValue: (p: string) => (p === "display" ? "block" : ""),
        } as unknown as CSSStyleDeclaration;
      }
      return {
        content: "none",
        getPropertyValue: () => "",
      } as unknown as CSSStyleDeclaration;
    });

    const rules = extractPseudoElementRules(root);
    expect(rules).toHaveLength(1);
    expect(rules[0].selector).toBe(`[${PSEUDO_ID_ATTR}="0"]::before`);
    expect(rules[0].declarations).toContain("display: block");

    document.body.removeChild(root);
  });

  it("distinguishes ::before from ::after selectors", () => {
    const root = makeElement();
    root.setAttribute(PSEUDO_ID_ATTR, "0");
    document.body.appendChild(root);

    vi.spyOn(window, "getComputedStyle").mockImplementation((_el, pseudo) => ({
      content: '"x"',
      getPropertyValue: (p: string) => (p === "display" ? "inline" : ""),
    }) as unknown as CSSStyleDeclaration);

    const rules = extractPseudoElementRules(root);
    const selectors = rules.map((r) => r.selector);
    expect(selectors).toContain(`[${PSEUDO_ID_ATTR}="0"]::before`);
    expect(selectors).toContain(`[${PSEUDO_ID_ATTR}="0"]::after`);

    document.body.removeChild(root);
  });

  it("skips pseudo if no non-empty property values are found", () => {
    const root = makeElement();
    root.setAttribute(PSEUDO_ID_ATTR, "0");
    document.body.appendChild(root);

    vi.spyOn(window, "getComputedStyle").mockReturnValue({
      content: '"•"',
      getPropertyValue: () => "",
    } as unknown as CSSStyleDeclaration);

    const rules = extractPseudoElementRules(root);
    expect(rules).toHaveLength(0);

    document.body.removeChild(root);
  });
});
