import { nanoid } from "nanoid";
import type { CapturedElementData, Snippet } from "../shared/types/snippet";
import { buildPreviewForCapture } from "../shared/utils/preview-srcdoc-builder";
import { generateSnippetName } from "../shared/utils/snippet-name";
import { TOKENS_CSS } from "../shared/tokens-css";

const Z_INDEX = 2147483647;

export type CopyFormat = "html" | "html-inline" | "jsx";

export interface CaptureConfirmationCallbacks {
  onSave: () => void;
  onSaveAndCaptureAnother: () => void;
  onCopy: (format: CopyFormat) => void;
  onCancel: () => void;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

function getThumbnail(capture: CapturedElementData): string {
  if (capture.thumbnail && capture.thumbnail.trim().length > 0) {
    return capture.thumbnail;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#f8fafc"/><rect x="16" y="16" width="168" height="88" fill="#e5e7eb" rx="8"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function buildSnippetFromCapture(capture: CapturedElementData): Snippet {
  const sourceUrl = window.location.href;
  const domain = getDomain(sourceUrl);
  const title = `${generateSnippetName()} - ${domain}`;
  return {
    id: nanoid(),
    title,
    sourceUrl,
    html: capture.html,
    jsx: capture.jsx,
    thumbnail: getThumbnail(capture),
    createdAt: Date.now(),
    width: capture.width,
    height: capture.height,
    renderContext: capture.renderContext,
    styleBlock: capture.styleBlock,
    rootId: capture.rootId,
    externalFontLinks: capture.externalFontLinks
  };
}

export class CaptureConfirmationModal {
  private readonly host: HTMLDivElement;
  private readonly shadow: ShadowRoot;
  private readonly callbacks: CaptureConfirmationCallbacks;
  private copyFormat: CopyFormat = "html";
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  public constructor(callbacks: CaptureConfirmationCallbacks) {
    this.callbacks = callbacks;
    this.host = document.createElement("div");
    this.host.setAttribute("data-element-capture-modal", "true");
    this.host.style.cssText = `position:fixed;inset:0;z-index:${Z_INDEX};`;
    this.shadow = this.host.attachShadow({ mode: "closed" });
    this.injectStyles();
  }

  private injectStyles(): void {
    const tokensForShadow = TOKENS_CSS.replace(/:root\s*\{/g, ":host {");
    const tokenStyle = document.createElement("style");
    tokenStyle.textContent = tokensForShadow;
    this.shadow.appendChild(tokenStyle);

    const style = document.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; }
      .backdrop {
        position: fixed;
        inset: 0;
        background: var(--color-overlay);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-sans);
      }
      .modal {
        width: 320px;
        max-height: 90vh;
        overflow-y: auto;
        background: var(--color-surface);
        border-radius: var(--radius-2);
        border: 1px solid var(--color-border);
        padding: var(--space-4);
      }
      .modal h2 {
        margin: 0 0 var(--space-4);
        font-size: var(--text-md);
        color: var(--color-text-primary);
      }
      .shadow-warning {
        margin: 0 0 var(--space-4);
        font-size: var(--text-caption);
        color: var(--color-text-muted);
        padding: var(--space-2) var(--space-3);
        background: var(--color-accent-subtle);
        border-radius: var(--radius-1_5);
      }
      .preview {
        max-height: 240px;
        overflow: auto;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-2);
        padding: var(--space-3);
        background: var(--color-surface-alt);
      }
      .preview img {
        max-width: 100%;
        height: auto;
        display: block;
      }
      .meta {
        margin: var(--space-3) 0 0;
        font-size: var(--text-caption);
        color: var(--color-text-muted);
      }
      .format-toggle {
        display: flex;
        gap: 0;
        margin-top: var(--space-4);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-1_5);
        overflow: hidden;
      }
      .format-toggle button {
        flex: 1;
        border: 0;
        padding: var(--space-2) var(--space-4);
        font-size: var(--text-caption);
        cursor: pointer;
        background: var(--color-surface);
        color: var(--color-text-muted);
      }
      .format-toggle button:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: -2px;
      }
      .format-toggle button.active {
        background: var(--color-accent);
        color: var(--color-text-inverse);
      }
      .actions {
        margin-top: var(--space-4);
        display: flex;
        gap: var(--space-3);
        flex-wrap: wrap;
      }
      .actions button {
        min-height: 32px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-1_5);
        background: var(--color-surface);
        cursor: pointer;
        font-size: var(--text-caption);
        padding: 0 var(--space-4);
        font-family: var(--font-sans);
      }
      .actions button:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
      }
      .actions button.primary {
        background: var(--color-accent);
        color: var(--color-text-inverse);
        border-color: var(--color-accent);
      }
      .actions .spacer { flex: 1; }
      .toast {
        position: fixed;
        bottom: var(--space-4);
        left: 50%;
        transform: translateX(-50%);
        background: var(--color-surface-inverse);
        color: var(--color-text-inverse);
        font-size: var(--text-caption);
        border-radius: var(--radius-full);
        padding: var(--space-2) var(--space-4);
        z-index: ${Z_INDEX + 1};
      }
    `;
    this.shadow.appendChild(style);
  }

  public show(capture: CapturedElementData): void {
    this.clearToast();

    const oldBackdrop = this.shadow.querySelector(".backdrop");
    if (oldBackdrop) {
      oldBackdrop.remove();
    }

    const backdrop = document.createElement("div");
    backdrop.className = "backdrop";
    backdrop.setAttribute("role", "dialog");
    backdrop.setAttribute("aria-modal", "true");
    backdrop.setAttribute("aria-label", "Element captured");

    const modal = document.createElement("div");
    modal.className = "modal";

    const heading = document.createElement("h2");
    heading.textContent = "Element Captured";
    modal.appendChild(heading);

    if (capture.hasShadowDom) {
      const warning = document.createElement("p");
      warning.className = "shadow-warning";
      warning.textContent =
        "This element uses Shadow DOM. Captured output may not fully match the original.";
      warning.setAttribute("role", "status");
      modal.appendChild(warning);
    }

    const preview = document.createElement("div");
    preview.className = "preview";
    if (capture.thumbnail) {
      const img = document.createElement("img");
      img.src = capture.thumbnail;
      img.alt = "Preview";
      preview.appendChild(img);
    } else {
      const iframe = document.createElement("iframe");
      iframe.sandbox.add("allow-same-origin");
      iframe.style.cssText = "width:100%;height:120px;border:0;";
      iframe.srcdoc = buildPreviewForCapture({
        html: capture.html,
        styleBlock: capture.styleBlock,
        width: capture.width,
        height: capture.height,
        sourceUrl: window.location.href,
        renderContext: capture.renderContext,
        externalFontLinks: capture.externalFontLinks
      });
      preview.appendChild(iframe);
    }
    modal.appendChild(preview);

    const metaLabel = document.createElement("p");
    metaLabel.className = "meta";
    metaLabel.textContent = capture.elementLabel;
    modal.appendChild(metaLabel);

    const metaSize = document.createElement("p");
    metaSize.className = "meta";
    metaSize.textContent = `${capture.width} × ${capture.height}`;
    modal.appendChild(metaSize);

    const formatToggle = document.createElement("div");
    formatToggle.className = "format-toggle";
    const htmlBtn = document.createElement("button");
    htmlBtn.textContent = "HTML";
    htmlBtn.setAttribute("aria-label", "Copy as HTML with style block");
    const inlineBtn = document.createElement("button");
    inlineBtn.textContent = "Inline";
    inlineBtn.setAttribute("aria-label", "Copy as HTML inline only");
    const jsxBtn = document.createElement("button");
    jsxBtn.textContent = "JSX";
    jsxBtn.setAttribute("aria-label", "Copy as JSX");

    const updateFormatButtons = (): void => {
      htmlBtn.classList.toggle("active", this.copyFormat === "html");
      inlineBtn.classList.toggle("active", this.copyFormat === "html-inline");
      jsxBtn.classList.toggle("active", this.copyFormat === "jsx");
    };

    htmlBtn.addEventListener("click", () => {
      this.copyFormat = "html";
      updateFormatButtons();
    });
    inlineBtn.addEventListener("click", () => {
      this.copyFormat = "html-inline";
      updateFormatButtons();
    });
    jsxBtn.addEventListener("click", () => {
      this.copyFormat = "jsx";
      updateFormatButtons();
    });
    updateFormatButtons();
    formatToggle.appendChild(htmlBtn);
    formatToggle.appendChild(inlineBtn);
    formatToggle.appendChild(jsxBtn);
    modal.appendChild(formatToggle);

    const actions = document.createElement("div");
    actions.className = "actions";

    const close = (): void => {
      document.removeEventListener("keydown", handleKeyDown);
      this.host.remove();
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        close();
        this.callbacks.onCancel();
      }
    };

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        close();
        this.callbacks.onCancel();
      }
    });

    document.addEventListener("keydown", handleKeyDown);

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.setAttribute("aria-label", "Cancel");
    cancelBtn.addEventListener("click", () => {
      close();
      this.callbacks.onCancel();
    });

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy";
    copyBtn.setAttribute("aria-label", "Copy to clipboard");
    copyBtn.addEventListener("click", () => {
      this.callbacks.onCopy(this.copyFormat);
    });

    const saveAndCaptureBtn = document.createElement("button");
    saveAndCaptureBtn.textContent = "Save & Capture another";
    saveAndCaptureBtn.setAttribute("aria-label", "Save and capture another element");
    saveAndCaptureBtn.addEventListener("click", () => {
      close();
      this.callbacks.onSaveAndCaptureAnother();
    });

    const saveBtn = document.createElement("button");
    saveBtn.className = "primary";
    saveBtn.textContent = "Save";
    saveBtn.setAttribute("aria-label", "Save to library");
    saveBtn.addEventListener("click", () => {
      close();
      this.callbacks.onSave();
    });

    const spacer = document.createElement("span");
    spacer.className = "spacer";

    actions.appendChild(cancelBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(saveAndCaptureBtn);
    actions.appendChild(spacer);
    actions.appendChild(saveBtn);
    modal.appendChild(actions);

    backdrop.appendChild(modal);
    this.shadow.appendChild(backdrop);
    document.body.appendChild(this.host);
  }

  private clearToast(): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
    const existing = this.shadow.querySelector(".toast");
    if (existing) {
      existing.remove();
    }
  }

  public showToast(message: string): void {
    this.clearToast();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toast.setAttribute("role", "status");
    this.shadow.appendChild(toast);
    this.toastTimeoutId = setTimeout(() => {
      toast.remove();
      this.toastTimeoutId = null;
    }, 2000);
  }

  public destroy(): void {
    this.clearToast();
    this.host.remove();
  }
}
