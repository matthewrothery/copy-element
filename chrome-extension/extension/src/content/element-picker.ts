import { extractElementName } from "../shared/utils/element-name-extractor";
import { CaptureOverlay } from "./capture-overlay";
import { isOverlayPosition, shouldSkipElement } from "./element-picker-skip";

export interface ElementSelectionResult {
  element: HTMLElement;
  label: string;
  width: number;
  height: number;
}

export type ElementSelectedHandler = (result: ElementSelectionResult) => void;

export interface ElementPickerOptions {
  onSelected: ElementSelectedHandler;
  /** Called when user presses Escape so the host can broadcast cancel to all frames. */
  onEscape?: () => void;
  /** Called when this frame shows a hover overlay so the host can tell other frames to clear. */
  onFrameHoverActive?: () => void;
}

export class ElementPicker {
  private readonly overlay: CaptureOverlay;
  private readonly onSelected: ElementSelectedHandler;
  private readonly onEscape: (() => void) | undefined;
  private readonly onFrameHoverActive: (() => void) | undefined;
  private active = false;
  private currentHover: HTMLElement | null = null;
  /** When set, overrides currentHover for display and capture (parent traversal). */
  private currentSelected: HTMLElement | null = null;

  public constructor(options: ElementPickerOptions | ElementSelectedHandler) {
    const opts = typeof options === "function" ? { onSelected: options } : options;
    this.overlay = new CaptureOverlay();
    this.onSelected = opts.onSelected;
    this.onEscape = opts.onEscape;
    this.onFrameHoverActive = opts.onFrameHoverActive;
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
  }

  public start(): void {
    if (this.active) {
      return;
    }
    this.active = true;
    document.addEventListener("mousemove", this.handleMouseMove, true);
    document.addEventListener("click", this.handleClick, true);
    document.addEventListener("keydown", this.handleKeyDown, true);
    document.documentElement.addEventListener("mouseleave", this.handleMouseLeave, true);
  }

  /** Hides the overlay so a viewport screenshot can capture the page without the highlight. */
  public hideOverlayForScreenshot(): void {
    this.overlay.hide();
  }

  /** Clear hover/selection overlay only; picker stays active. Used when another frame takes hover ownership. */
  public clearHoverOnly(): void {
    this.currentHover = null;
    this.currentSelected = null;
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
    document.documentElement.removeEventListener("mouseleave", this.handleMouseLeave, true);
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
    this.onFrameHoverActive?.();
  }

  /** Clear overlay when pointer leaves this frame (e.g. moved into iframe or out of window). */
  private handleMouseLeave(event: MouseEvent): void {
    if (!this.active) {
      return;
    }
    const related = event.relatedTarget as Node | null;
    if (related != null && document.contains(related)) {
      const el = related as HTMLElement;
      if (el.tagName !== "IFRAME" && el.tagName !== "FRAME") {
        return;
      }
    }
    this.currentHover = null;
    this.currentSelected = null;
    this.overlay.hide();
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
    let label: string;
    try {
      const extracted = extractElementName(target);
      label =
        extracted.displayName?.trim() ||
        `${target.tagName.toLowerCase()}${target.className ? `.${target.className.split(" ").join(".")}` : ""}`;
    } catch {
      label = `${target.tagName.toLowerCase()}${target.className ? `.${target.className.split(" ").join(".")}` : ""}`;
    }
    this.onSelected({
      element: target,
      label,
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
      this.onEscape?.();
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
        this.onFrameHoverActive?.();
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
