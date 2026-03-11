import { describe, expect, it } from "vitest";
import { hasShadowDomInSubtree } from "./shadow-dom-detector";

describe("hasShadowDomInSubtree", () => {
  it("returns false for element in document", () => {
    document.body.innerHTML = `<div id="target"><span>Hello</span></div>`;
    const target = document.getElementById("target") as HTMLElement;
    expect(hasShadowDomInSubtree(target)).toBe(false);
  });

  it("returns true when element is inside Shadow DOM", () => {
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    const inner = document.createElement("span");
    inner.textContent = "Inside shadow";
    shadow.appendChild(inner);

    document.body.appendChild(host);
    expect(hasShadowDomInSubtree(inner)).toBe(true);
    document.body.removeChild(host);
  });

  it("returns true when element hosts Shadow DOM", () => {
    const host = document.createElement("div");
    host.attachShadow({ mode: "open" });
    document.body.appendChild(host);

    expect(hasShadowDomInSubtree(host)).toBe(true);
    document.body.removeChild(host);
  });

  it("returns true when descendant hosts Shadow DOM", () => {
    document.body.innerHTML = `<div id="target"><div id="child"></div></div>`;
    const target = document.getElementById("target") as HTMLElement;
    const child = document.getElementById("child") as HTMLElement;
    child.attachShadow({ mode: "open" });

    expect(hasShadowDomInSubtree(target)).toBe(true);
  });
});
