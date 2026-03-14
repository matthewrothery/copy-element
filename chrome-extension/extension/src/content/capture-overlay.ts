import { TOKEN_VALUES } from "../shared/token-values";

export class CaptureOverlay {
  private readonly boxElement: HTMLDivElement;
  private readonly tooltipElement: HTMLDivElement;

  public constructor() {
    this.boxElement = document.createElement("div");
    this.tooltipElement = document.createElement("div");
    this.boxElement.setAttribute("data-element-capture-overlay", "box");
    this.tooltipElement.setAttribute("data-element-capture-overlay", "tooltip");

    this.boxElement.style.position = "fixed";
    this.boxElement.style.pointerEvents = "none";
    this.boxElement.style.zIndex = "2147483646";
    this.boxElement.style.border = `2px solid ${TOKEN_VALUES.overlayBorder}`;
    this.boxElement.style.background = TOKEN_VALUES.overlayHighlight;
    this.boxElement.style.borderRadius = TOKEN_VALUES.overlayRadius;
    this.boxElement.style.boxShadow = TOKEN_VALUES.overlayShadow;
    this.boxElement.style.transition = "left 120ms ease, top 120ms ease, width 120ms ease, height 120ms ease";
    this.boxElement.style.display = "none";

    this.tooltipElement.style.position = "fixed";
    this.tooltipElement.style.pointerEvents = "none";
    this.tooltipElement.style.zIndex = "2147483647";
    this.tooltipElement.style.padding = `${TOKEN_VALUES.space1} ${TOKEN_VALUES.space2}`;
    this.tooltipElement.style.borderRadius = TOKEN_VALUES.radiusSm;
    this.tooltipElement.style.fontSize = TOKEN_VALUES.textXs;
    this.tooltipElement.style.fontFamily = TOKEN_VALUES.fontSans;
    this.tooltipElement.style.color = TOKEN_VALUES.tooltipText;
    this.tooltipElement.style.background = TOKEN_VALUES.tooltipBg;
    this.tooltipElement.style.border = `1px solid ${TOKEN_VALUES.tooltipBorder}`;
    this.tooltipElement.style.boxShadow = "0 8px 16px -8px rgba(24, 29, 39, 0.55)";
    this.tooltipElement.style.display = "none";
    this.tooltipElement.style.maxWidth = "280px";
    this.tooltipElement.style.overflow = "hidden";
    this.tooltipElement.style.textOverflow = "ellipsis";
    this.tooltipElement.style.whiteSpace = "nowrap";

    document.body.appendChild(this.boxElement);
    document.body.appendChild(this.tooltipElement);
  }

  public showForElement(element: Element, options?: { isOverlay?: boolean }): void {
    const rect = element.getBoundingClientRect();
    this.boxElement.style.display = "block";
    this.boxElement.style.left = `${rect.left}px`;
    this.boxElement.style.top = `${rect.top}px`;
    this.boxElement.style.width = `${rect.width}px`;
    this.boxElement.style.height = `${rect.height}px`;

    const label = `${element.tagName.toLowerCase()}${element.className ? `.${String(element.className).split(" ").join(".")}` : ""}`;
    let text = `${label}  ${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    if (options?.isOverlay) {
      text += " · Alt+Click to select underneath";
    }
    this.tooltipElement.textContent = text;
    this.tooltipElement.style.display = "block";

    const TOOLTIP_GAP = 8;
    const MIN_SPACE_ABOVE = 40;
    const hasSpaceAbove = rect.top >= MIN_SPACE_ABOVE;

    this.tooltipElement.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - 288))}px`;
    if (hasSpaceAbove) {
      this.tooltipElement.style.top = `${rect.top - TOOLTIP_GAP}px`;
      this.tooltipElement.style.transform = "translateY(-100%)";
    } else {
      this.tooltipElement.style.top = `${rect.bottom + TOOLTIP_GAP}px`;
      this.tooltipElement.style.transform = "";
    }
  }

  public hide(): void {
    this.boxElement.style.display = "none";
    this.tooltipElement.style.display = "none";
  }

  public destroy(): void {
    this.boxElement.remove();
    this.tooltipElement.remove();
  }
}
