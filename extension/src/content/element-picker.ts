import { CaptureOverlay } from "./capture-overlay";
import { isOverlayPosition, shouldSkipElement } from "./element-picker-skip";

export interface ElementSelectionResult {
  element: HTMLElement;
  label: string;
  width: number;
  height: number;
}

export type ElementSelectedHandler = (result: ElementSelectionResult) => void;

export class ElementPicker {
  private readonly overlay: CaptureOverlay;
  private readonly onSelected: ElementSelectedHandler;
  private active = false;
  private currentHover: HTMLElement | null = null;
  /** When set, overrides currentHover for display and capture (parent traversal). */
  private currentSelected: HTMLElement | null = null;

  public constructor(onSelected: ElementSelectedHandler) {
    this.overlay = new CaptureOverlay();
    this.onSelected = onSelected;
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  public start(): void {
    if (this.active) {
      return;
    }
    this.active = true;
    document.addEventListener("mousemove", this.handleMouseMove, true);
    document.addEventListener("click", this.handleClick, true);
    document.addEventListener("keydown", this.handleKeyDown, true);
  }

  /** Hides the overlay so a viewport screenshot can capture the page without the highlight. */
  public hideOverlayForScreenshot(): void {
    this.overlay.hide();
  }

  public stop(): void {
    if (!this.active) {
      return;
    }
    this.active = false;
    this.currentHover = null;
    this.currentSelected = null;
    document.removeEventListener("mousemove", this.handleMouseMove, true);
    document.removeEventListener("click", this.handleClick, true);
    document.removeEventListener("keydown", this.handleKeyDown, true);
    this.overlay.hide();
  }

  public destroy(): void {
    this.stop();
    this.overlay.destroy();
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.active) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target || shouldSkipElement(target)) {
      return;
    }

    this.currentHover = target;
    this.currentSelected = null;
    this.overlay.showForElement(target, { isOverlay: isOverlayPosition(target) });
  }

  private handleClick(event: MouseEvent): void {
    if (!this.active) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const target = event.altKey
      ? this.getElementUnderOverlay(event.clientX, event.clientY)
      : this.currentSelected ?? this.currentHover;

    if (!target || shouldSkipElement(target)) {
      return;
    }

    const rect = target.getBoundingClientRect();
    this.onSelected({
      element: target,
      label: `${target.tagName.toLowerCase()}${target.className ? `.${target.className.split(" ").join(".")}` : ""}`,
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    });
  }

  /**
   * Alt+Click: get element underneath fixed/sticky overlays by temporarily
   * setting pointer-events: none on blocking elements.
   */
  private getElementUnderOverlay(clientX: number, clientY: number): HTMLElement | null {
    const modified: Array<{ el: HTMLElement; original: string }> = [];
    let el: Element | null = document.elementFromPoint(clientX, clientY);

    while (el && el !== document.body) {
      const htmlEl = el as HTMLElement;
      if (shouldSkipElement(el)) {
        el = el.parentElement;
        continue;
      }
      if (!isOverlayPosition(el)) {
        break;
      }
      const original = htmlEl.style.pointerEvents;
      htmlEl.style.pointerEvents = "none";
      modified.push({ el: htmlEl, original });
      el = document.elementFromPoint(clientX, clientY);
    }

    for (const { el: m, original } of modified) {
      m.style.pointerEvents = original;
    }

    return el && el !== document.body ? (el as HTMLElement) : null;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      this.stop();
      return;
    }

    const base = this.currentSelected ?? this.currentHover;
    if (!base) {
      return;
    }

    if (event.key === "ArrowUp" || event.key === "[") {
      event.preventDefault();
      let candidate = base.parentElement;
      while (candidate && candidate !== document.body && shouldSkipElement(candidate)) {
        candidate = candidate.parentElement;
      }
      if (candidate && candidate !== document.body) {
        this.currentSelected = candidate;
        this.overlay.showForElement(candidate, { isOverlay: isOverlayPosition(candidate) });
      }
      return;
    }

    if (event.key === "ArrowDown" || event.key === "]") {
      event.preventDefault();
      this.currentSelected = null;
      if (this.currentHover) {
        this.overlay.showForElement(this.currentHover, {
          isOverlay: isOverlayPosition(this.currentHover)
        });
      }
      return;
    }
  }
}
