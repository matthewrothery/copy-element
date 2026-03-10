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
    this.boxElement.style.display = "none";

    this.tooltipElement.style.position = "fixed";
    this.tooltipElement.style.pointerEvents = "none";
    this.tooltipElement.style.zIndex = "2147483647";
    this.tooltipElement.style.padding = `${TOKEN_VALUES.space1} ${TOKEN_VALUES.space2}`;
    this.tooltipElement.style.borderRadius = TOKEN_VALUES.radiusSm;
    this.tooltipElement.style.fontSize = "12px";
    this.tooltipElement.style.fontFamily = TOKEN_VALUES.fontSans;
    this.tooltipElement.style.color = TOKEN_VALUES.tooltipText;
    this.tooltipElement.style.background = TOKEN_VALUES.tooltipBg;
    this.tooltipElement.style.display = "none";

    document.body.appendChild(this.boxElement);
    document.body.appendChild(this.tooltipElement);
  }

  public showForElement(element: Element): void {
    const rect = element.getBoundingClientRect();
    this.boxElement.style.display = "block";
    this.boxElement.style.left = `${rect.left}px`;
    this.boxElement.style.top = `${rect.top}px`;
    this.boxElement.style.width = `${rect.width}px`;
    this.boxElement.style.height = `${rect.height}px`;

    const label = `${element.tagName.toLowerCase()}${element.className ? `.${String(element.className).split(" ").join(".")}` : ""}`;
    this.tooltipElement.textContent = `${label}  ${Math.round(rect.width)} x ${Math.round(rect.height)}`;
    this.tooltipElement.style.display = "block";
    this.tooltipElement.style.left = `${Math.max(8, rect.left)}px`;
    this.tooltipElement.style.top = `${Math.max(8, rect.top - 30)}px`;
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
