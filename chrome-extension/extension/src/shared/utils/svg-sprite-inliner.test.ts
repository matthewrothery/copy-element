import { beforeEach, describe, expect, it, vi } from "vitest";
import { inlineSvgSprites } from "./svg-sprite-inliner";

const SPRITE_SVG = `<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <symbol id="icon" viewBox="0 0 24 24">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2z"/>
    </symbol>
  </defs>
</svg>`;

describe("inlineSvgSprites", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string) => {
        if (url.includes("sprite.svg")) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(SPRITE_SVG)
          } as Response);
        }
        return Promise.reject(new Error("Not found"));
      })
    );
  });

  it("inlines external sprite and rewrites href to local reference", async () => {
    document.body.innerHTML = `
      <div id="root">
        <svg xmlns="http://www.w3.org/2000/svg">
          <use href="/sprite.svg#icon"/>
        </svg>
      </div>
    `;
    const root = document.getElementById("root")!;
    await inlineSvgSprites(root, "https://example.com/");

    const use = root.querySelector("use");
    expect(use?.getAttribute("href")).toBe("#icon");
    expect(use?.hasAttribute("xlink:href")).toBe(false);

    const defs = root.querySelector("defs");
    expect(defs).not.toBeNull();
    const symbol = defs?.querySelector("symbol[id='icon']");
    expect(symbol).not.toBeNull();
    expect(symbol?.querySelector("path")).not.toBeNull();
  });

  it("preserves same-document use reference without fetching", async () => {
    document.body.innerHTML = `
      <div id="root">
        <svg xmlns="http://www.w3.org/2000/svg">
          <defs><symbol id="s"><circle r="5"/></symbol></defs>
          <use href="#s"/>
        </svg>
      </div>
    `;
    const root = document.getElementById("root")!;
    const fetchSpy = vi.mocked(fetch);
    await inlineSvgSprites(root, "https://example.com/");

    expect(fetchSpy).not.toHaveBeenCalled();
    const use = root.querySelector("use");
    expect(use?.getAttribute("href")).toBe("#s");
  });

  it("caches sprite document for multiple use elements from same URL", async () => {
    document.body.innerHTML = `
      <div id="root">
        <svg xmlns="http://www.w3.org/2000/svg">
          <use href="/sprite.svg#icon"/>
          <use href="/sprite.svg#icon"/>
        </svg>
      </div>
    `;
    const root = document.getElementById("root")!;
    const fetchSpy = vi.mocked(fetch);
    await inlineSvgSprites(root, "https://example.com/");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const symbols = root.querySelectorAll("symbol[id='icon']");
    expect(symbols.length).toBe(1);
  });
});
