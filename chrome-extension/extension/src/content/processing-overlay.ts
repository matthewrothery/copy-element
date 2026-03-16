import { TOKEN_VALUES } from "../shared/token-values";

const Z_INDEX = 2147483647;

/** Design tokens for content script (no CSS variables). Aligned with shared design system. */
const SURFACE = "#ffffff";
const TEXT_PRIMARY = "#181d27";
const BORDER = "#e5e7eb";
const BACKDROP = "rgba(0, 0, 0, 0.12)";
const SHADOW = "0 12px 16px -4px rgba(10, 13, 18, 0.08)";

export class ProcessingOverlay {
  private readonly backdropElement: HTMLDivElement;
  private readonly cardElement: HTMLDivElement;
  private readonly spinnerElement: HTMLDivElement;

  public constructor() {
    this.backdropElement = document.createElement("div");
    this.backdropElement.setAttribute("data-element-capture-overlay", "processing-backdrop");

    this.backdropElement.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: ${Z_INDEX};
      background: ${BACKDROP};
      display: none;
      align-items: center;
      justify-content: center;
    `;

    this.cardElement = document.createElement("div");
    this.cardElement.setAttribute("data-element-capture-overlay", "processing-card");
    this.cardElement.setAttribute("role", "status");
    this.cardElement.setAttribute("aria-live", "polite");
    this.cardElement.setAttribute("aria-label", "Processing capture");

    this.cardElement.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: ${TOKEN_VALUES.space3};
      padding: ${TOKEN_VALUES.space3} ${TOKEN_VALUES.space3};
      min-width: 160px;
      background: ${SURFACE};
      border: 1px solid ${BORDER};
      border-radius: ${TOKEN_VALUES.overlayRadius};
      box-shadow: ${SHADOW};
      font-family: ${TOKEN_VALUES.fontSans};
      font-size: ${TOKEN_VALUES.textXs};
      color: ${TEXT_PRIMARY};
    `;

    this.spinnerElement = document.createElement("div");
    this.spinnerElement.setAttribute("aria-hidden", "true");
    this.spinnerElement.style.cssText = `
      width: 24px;
      height: 24px;
      border: 2px solid ${BORDER};
      border-top-color: ${TOKEN_VALUES.overlayBorder};
      border-radius: ${TOKEN_VALUES.radiusFull};
      animation: element-capture-spin 0.7s linear infinite;
    `;

    const label = document.createElement("span");
    label.textContent = "Processing capture...";
    label.style.cssText = `white-space: nowrap;`;

    this.cardElement.appendChild(this.spinnerElement);
    this.cardElement.appendChild(label);

    this.backdropElement.appendChild(this.cardElement);

    this.injectKeyframes();
    document.body.appendChild(this.backdropElement);
  }

  private injectKeyframes(): void {
    if (document.querySelector("[data-element-capture-overlay='processing-styles']")) {
      return;
    }
    const style = document.createElement("style");
    style.setAttribute("data-element-capture-overlay", "processing-styles");
    style.textContent = `
      @keyframes element-capture-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  public show(): void {
    this.backdropElement.style.display = "flex";
  }

  public hide(): void {
    this.backdropElement.style.display = "none";
  }

  public destroy(): void {
    this.backdropElement.remove();
    // Keyframes style is left in document so a recreated overlay still animates
  }
}
