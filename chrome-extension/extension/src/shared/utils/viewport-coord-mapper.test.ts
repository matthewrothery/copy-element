import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getElementRectInTopViewport } from "./viewport-coord-mapper";

describe("getElementRectInTopViewport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns element rect and viewport when in top window", () => {
    document.body.innerHTML = "<div id='el' style='position:absolute;left:10px;top:20px;width:50px;height:30px'></div>";
    const el = document.getElementById("el")!;
    el.getBoundingClientRect = () => ({
      left: 10,
      top: 20,
      width: 50,
      height: 30,
      right: 60,
      bottom: 50,
      x: 10,
      y: 20,
      toJSON: () => {}
    });

    const result = getElementRectInTopViewport(el);

    expect(result.ok).toBe(true);
    expect(result.cropLeft).toBe(10);
    expect(result.cropTop).toBe(20);
    expect(result.cropWidth).toBe(50);
    expect(result.cropHeight).toBe(30);
    expect(result.viewportWidth).toBe(window.innerWidth);
    expect(result.viewportHeight).toBe(window.innerHeight);
  });

  it("accumulates iframe offset when inside one level of iframe", () => {
    document.body.innerHTML = "<div id='el'></div>";
    const el = document.getElementById("el")!;
    el.getBoundingClientRect = () => ({
      left: 5,
      top: 5,
      width: 10,
      height: 10,
      right: 15,
      bottom: 15,
      x: 5,
      y: 5,
      toJSON: () => {}
    });

    const frameEl = document.createElement("div");
    frameEl.getBoundingClientRect = () => ({
      left: 100,
      top: 50,
      width: 200,
      height: 150,
      right: 300,
      bottom: 200,
      x: 100,
      y: 50,
      toJSON: () => {}
    });
    const topWin = {
      innerWidth: 800,
      innerHeight: 600,
      parent: null as Window | null,
      frameElement: undefined as Element | undefined
    };
    topWin.parent = topWin as unknown as Window;
    const iframeWin = {
      innerWidth: 200,
      innerHeight: 150,
      parent: topWin as unknown as Window,
      frameElement: frameEl
    };
    vi.stubGlobal("window", iframeWin);

    const result = getElementRectInTopViewport(el);

    expect(result.ok).toBe(true);
    expect(result.cropLeft).toBe(105);
    expect(result.cropTop).toBe(55);
    expect(result.cropWidth).toBe(10);
    expect(result.cropHeight).toBe(10);
    expect(result.viewportWidth).toBe(800);
    expect(result.viewportHeight).toBe(600);
  });

  it("adds iframe content-area offset (border + padding) when inside iframe", () => {
    document.body.innerHTML = "<div id='el'></div>";
    const el = document.getElementById("el")!;
    el.getBoundingClientRect = () => ({
      left: 5,
      top: 5,
      width: 10,
      height: 10,
      right: 15,
      bottom: 15,
      x: 5,
      y: 5,
      toJSON: () => {}
    });

    const frameEl = document.createElement("div");
    frameEl.getBoundingClientRect = () => ({
      left: 100,
      top: 50,
      width: 200,
      height: 150,
      right: 300,
      bottom: 200,
      x: 100,
      y: 50,
      toJSON: () => {}
    });
    const mockGetComputedStyle = vi.fn((target: Element) => {
      if (target !== frameEl) return window.getComputedStyle(target);
      return {
        getPropertyValue: (prop: string) => {
          switch (prop) {
            case "border-left-width":
              return "5px";
            case "padding-left":
              return "3px";
            case "border-top-width":
              return "2px";
            case "padding-top":
              return "4px";
            default:
              return "0px";
          }
        }
      } as CSSStyleDeclaration;
    });
    const topWin = {
      innerWidth: 800,
      innerHeight: 600,
      parent: null as Window | null,
      frameElement: undefined as Element | undefined,
      document: { getElementsByTagName: () => [] }
    };
    topWin.parent = topWin as unknown as Window;
    const iframeWin = {
      innerWidth: 200,
      innerHeight: 150,
      parent: topWin as unknown as Window,
      frameElement: frameEl,
      document: { getElementsByTagName: () => [] }
    };
    // frameEl.ownerDocument.defaultView is the pre-stub window, so stub getComputedStyle there
    const doc = frameEl.ownerDocument;
    const win = doc.defaultView as Window & { getComputedStyle: typeof getComputedStyle };
    if (win) win.getComputedStyle = mockGetComputedStyle;
    vi.stubGlobal("window", iframeWin);

    const result = getElementRectInTopViewport(el);

    expect(result.ok).toBe(true);
    // Element in iframe: (5, 5). Frame border box: (100, 50). Content offset: left 5+3=8, top 2+4=6.
    expect(result.cropLeft).toBe(5 + 100 + 8);
    expect(result.cropTop).toBe(5 + 50 + 6);
    expect(result.cropWidth).toBe(10);
    expect(result.cropHeight).toBe(10);
    expect(result.viewportWidth).toBe(800);
    expect(result.viewportHeight).toBe(600);
  });

  it("returns ok: false when parent access throws (cross-origin)", () => {
    document.body.innerHTML = "<div id='el'></div>";
    const el = document.getElementById("el")!;
    el.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 10,
      height: 10,
      right: 10,
      bottom: 10,
      x: 0,
      y: 0,
      toJSON: () => {}
    });

    const topWin = {
      innerWidth: 800,
      innerHeight: 600,
      parent: null as Window | null,
      frameElement: undefined as Element | undefined
    };
    topWin.parent = topWin as unknown as Window;
    const iframeWin = {
      get innerWidth() {
        return 200;
      },
      get innerHeight() {
        return 150;
      },
      parent: topWin as unknown as Window,
      get frameElement() {
        throw new Error("cross-origin");
      }
    };
    vi.stubGlobal("window", iframeWin);

    const result = getElementRectInTopViewport(el);

    expect(result.ok).toBe(false);
    expect(result.cropLeft).toBe(0);
    expect(result.cropTop).toBe(0);
    expect(result.viewportWidth).toBe(200);
    expect(result.viewportHeight).toBe(150);
  });
});
