import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TOKEN_VALUES } from "../shared/token-values";
import { CaptureOverlay } from "./capture-overlay";

describe("CaptureOverlay", () => {
  let overlay: CaptureOverlay;

  beforeEach(() => {
    document.body.innerHTML = '<div id="target" class="hero-section" style="position:absolute;left:100px;top:50px;width:320px;height:180px"></div>';
    overlay = new CaptureOverlay();
  });

  afterEach(() => {
    overlay.destroy();
  });

  it("creates overlay box with correct border and background", () => {
    const box = document.querySelector("[data-element-capture-overlay=box]") as HTMLElement;
    expect(box).toBeTruthy();
    expect(box.style.border).toContain("2px solid");
    expect(box.style.border).toMatch(/59|#3b82f6|rgb\(59/);
    expect(box.style.background).toBe(TOKEN_VALUES.overlayHighlight);
  });

  it("positions overlay and tooltip for element", () => {
    const target = document.getElementById("target")!;
    const rect = { left: 100, top: 50, width: 320, height: 180 };
    vi.spyOn(target, "getBoundingClientRect").mockReturnValue(rect as DOMRect);
    overlay.showForElement(target);

    const box = document.querySelector("[data-element-capture-overlay=box]") as HTMLElement;
    expect(box.style.display).toBe("block");
    expect(box.style.left).toBe("100px");
    expect(box.style.top).toBe("50px");
    expect(box.style.width).toBe("320px");
    expect(box.style.height).toBe("180px");

    const tooltip = document.querySelector("[data-element-capture-overlay=tooltip]") as HTMLElement;
    expect(tooltip.style.display).toBe("block");
    expect(tooltip.textContent).toContain("div.hero-section");
    expect(tooltip.textContent).toContain("320 × 180");
  });

  it("shows Alt+Click hint for overlay-positioned elements", () => {
    const target = document.getElementById("target")!;
    target.style.position = "fixed";
    overlay.showForElement(target, { isOverlay: true });

    const tooltip = document.querySelector("[data-element-capture-overlay=tooltip]") as HTMLElement;
    expect(tooltip.textContent).toContain("Alt+Click to select underneath");
  });

  it("hides overlay and tooltip on hide()", () => {
    const target = document.getElementById("target")!;
    overlay.showForElement(target);
    overlay.hide();

    const box = document.querySelector("[data-element-capture-overlay=box]") as HTMLElement;
    const tooltip = document.querySelector("[data-element-capture-overlay=tooltip]") as HTMLElement;
    expect(box.style.display).toBe("none");
    expect(tooltip.style.display).toBe("none");
  });

  it("removes elements on destroy()", () => {
    overlay.destroy();
    expect(document.querySelector("[data-element-capture-overlay=box]")).toBeNull();
    expect(document.querySelector("[data-element-capture-overlay=tooltip]")).toBeNull();
  });
});
