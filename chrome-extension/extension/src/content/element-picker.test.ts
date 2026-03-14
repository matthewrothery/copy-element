import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ElementPicker } from "./element-picker";

describe("ElementPicker", () => {
  let picker: ElementPicker;
  let onSelected: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="parent">
        <div id="child" class="card">Card content</div>
      </div>
    `;
    onSelected = vi.fn();
    picker = new ElementPicker(onSelected);
  });

  afterEach(() => {
    picker.destroy();
  });

  it("starts and shows overlay on mousemove", () => {
    picker.start();
    const child = document.getElementById("child")!;
    child.dispatchEvent(
      new MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        clientX: 0,
        clientY: 0
      })
    );

    const box = document.querySelector("[data-element-capture-overlay=box]") as HTMLElement;
    expect(box.style.display).toBe("block");
    picker.stop();
  });

  it("invokes onSelected on click", () => {
    picker.start();
    const child = document.getElementById("child")!;
    child.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, cancelable: true })
    );
    child.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );

    expect(onSelected).toHaveBeenCalledTimes(1);
    expect(onSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        element: child,
        label: "div.card",
        width: expect.any(Number),
        height: expect.any(Number)
      })
    );
  });

  it("stops on Escape key", () => {
    picker.start();
    const child = document.getElementById("child")!;
    child.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, cancelable: true })
    );
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    const box = document.querySelector("[data-element-capture-overlay=box]") as HTMLElement;
    expect(box.style.display).toBe("none");
  });

  it("expands selection to parent on ArrowUp", () => {
    picker.start();
    const child = document.getElementById("child")!;
    const parent = document.getElementById("parent")!;

    child.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, cancelable: true })
    );
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));

    child.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );

    expect(onSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        element: parent,
        label: "div"
      })
    );
  });

  it("resets to hovered element on ArrowDown", () => {
    picker.start();
    const child = document.getElementById("child")!;

    child.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, cancelable: true })
    );
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));

    child.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );

    expect(onSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        element: child,
        label: "div.card"
      })
    );
  });

  it("resets to hovered element on ] key", () => {
    picker.start();
    const child = document.getElementById("child")!;

    child.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, cancelable: true })
    );
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "[", bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "]", bubbles: true }));

    child.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );

    expect(onSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        element: child,
        label: "div.card"
      })
    );
  });

  it("selects element under overlay with Alt+Click", () => {
    document.body.innerHTML = `
      <div id="underneath" class="content">Under overlay</div>
      <div id="overlay" style="position:fixed;inset:0;pointer-events:auto;z-index:9999"></div>
    `;
    const underneath = document.getElementById("underneath")!;
    const overlay = document.getElementById("overlay")!;

    const elementFromPoint = vi.fn();
    elementFromPoint.mockReturnValueOnce(overlay).mockReturnValueOnce(underneath);
    Object.defineProperty(document, "elementFromPoint", {
      value: elementFromPoint,
      configurable: true
    });

    picker = new ElementPicker(onSelected);
    picker.start();

    overlay.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, cancelable: true, clientX: 50, clientY: 50 })
    );
    overlay.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        altKey: true,
        clientX: 50,
        clientY: 50
      })
    );

    expect(onSelected).toHaveBeenCalledWith(
      expect.objectContaining({
        element: underneath,
        label: "div.content"
      })
    );
  });

  it("calls onFrameHoverActive when showing hover overlay", () => {
    const onFrameHoverActive = vi.fn();
    picker = new ElementPicker({ onSelected, onFrameHoverActive });
    picker.start();
    const child = document.getElementById("child")!;
    child.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, cancelable: true })
    );
    expect(onFrameHoverActive).toHaveBeenCalledTimes(1);
    picker.stop();
  });

  it("clearHoverOnly hides overlay without stopping picker", () => {
    picker.start();
    const child = document.getElementById("child")!;
    child.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, cancelable: true })
    );
    let box = document.querySelector("[data-element-capture-overlay=box]") as HTMLElement;
    expect(box.style.display).toBe("block");
    picker.clearHoverOnly();
    box = document.querySelector("[data-element-capture-overlay=box]") as HTMLElement;
    expect(box.style.display).toBe("none");
    child.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, cancelable: true })
    );
    box = document.querySelector("[data-element-capture-overlay=box]") as HTMLElement;
    expect(box.style.display).toBe("block");
    picker.stop();
  });

  it("does not select extension overlay elements", () => {
    const modalEl = document.createElement("div");
    modalEl.setAttribute("data-element-capture-modal", "true");
    modalEl.style.position = "absolute";
    modalEl.style.width = "100px";
    modalEl.style.height = "100px";
    document.body.appendChild(modalEl);

    picker.start();
    modalEl.dispatchEvent(
      new MouseEvent("mousemove", { bubbles: true, cancelable: true })
    );
    modalEl.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );

    expect(onSelected).not.toHaveBeenCalled();
  });
});
