import { nanoid } from "nanoid";
import type { CapturedElementData, Snippet } from "../shared/types/snippet";

const Z_INDEX = 2147483647;
const FONT_STACK = "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif";

export type CopyFormat = "html" | "jsx";

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
  const title = `${capture.elementLabel} - ${domain}`;
  return {
    id: nanoid(),
    title,
    sourceUrl,
    html: capture.html,
    jsx: capture.jsx,
    thumbnail: getThumbnail(capture),
    createdAt: Date.now(),
    width: capture.width,
    height: capture.height
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
    const style = document.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; }
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(17, 24, 39, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: ${FONT_STACK};
      }
      .modal {
        width: 320px;
        max-height: 90vh;
        overflow-y: auto;
        background: #ffffff;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
        padding: 12px;
      }
      .modal h2 {
        margin: 0 0 12px;
        font-size: 16px;
        color: #111827;
      }
      .preview {
        max-height: 180px;
        overflow: auto;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 8px;
        background: #f8fafc;
      }
      .preview img {
        max-width: 100%;
        height: auto;
        display: block;
      }
      .meta {
        margin: 8px 0 0;
        font-size: 12px;
        color: #6b7280;
      }
      .format-toggle {
        display: flex;
        gap: 0;
        margin-top: 12px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        overflow: hidden;
      }
      .format-toggle button {
        flex: 1;
        border: 0;
        padding: 6px 12px;
        font-size: 12px;
        cursor: pointer;
        background: #ffffff;
        color: #6b7280;
      }
      .format-toggle button.active {
        background: #3b82f6;
        color: #ffffff;
      }
      .actions {
        margin-top: 12px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      .actions button {
        min-height: 32px;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        background: #ffffff;
        cursor: pointer;
        font-size: 12px;
        padding: 0 12px;
        font-family: ${FONT_STACK};
      }
      .actions button.primary {
        background: #3b82f6;
        color: #ffffff;
        border-color: #3b82f6;
      }
      .actions .spacer { flex: 1; }
      .toast {
        position: fixed;
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        background: #111827;
        color: #ffffff;
        font-size: 12px;
        border-radius: 999px;
        padding: 6px 12px;
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
      iframe.srcdoc = capture.html;
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
    htmlBtn.setAttribute("aria-label", "Copy as HTML");
    const jsxBtn = document.createElement("button");
    jsxBtn.textContent = "JSX";
    jsxBtn.setAttribute("aria-label", "Copy as JSX");

    const updateFormatButtons = (): void => {
      htmlBtn.classList.toggle("active", this.copyFormat === "html");
      jsxBtn.classList.toggle("active", this.copyFormat === "jsx");
    };

    htmlBtn.addEventListener("click", () => {
      this.copyFormat = "html";
      updateFormatButtons();
    });
    jsxBtn.addEventListener("click", () => {
      this.copyFormat = "jsx";
      updateFormatButtons();
    });
    updateFormatButtons();
    formatToggle.appendChild(htmlBtn);
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
