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
    this.boxElement.style.border = "2px solid #3b82f6";
    this.boxElement.style.background = "rgba(59,130,246,0.08)";
    this.boxElement.style.display = "none";

    this.tooltipElement.style.position = "fixed";
    this.tooltipElement.style.pointerEvents = "none";
    this.tooltipElement.style.zIndex = "2147483647";
    this.tooltipElement.style.padding = "4px 8px";
    this.tooltipElement.style.borderRadius = "6px";
    this.tooltipElement.style.fontSize = "12px";
    this.tooltipElement.style.fontFamily = "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif";
    this.tooltipElement.style.color = "#ffffff";
    this.tooltipElement.style.background = "#111827";
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
