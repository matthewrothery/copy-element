import { CaptureOverlay } from "./capture-overlay";

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

  public stop(): void {
    if (!this.active) {
      return;
    }
    this.active = false;
    this.currentHover = null;
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
    if (!target || target.closest("[data-element-capture-overlay]")) {
      return;
    }

    this.currentHover = target;
    this.overlay.showForElement(target);
  }

  private handleClick(event: MouseEvent): void {
    if (!this.active) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const target = this.currentHover;
    if (!target) {
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

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      this.stop();
    }
  }
}
