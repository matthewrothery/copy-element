import type { Snippet } from "../shared/types/snippet";
import { TOKENS_CSS } from "../shared/tokens-css";

const Z_INDEX = 2147483647;
const TOAST_DURATION_MS = 2000;

export interface PostCaptureBarCallbacks {
  onCopyPrompt: () => void;
  onOpenLibrary: () => void;
  onCaptureAnother: () => void;
  onDelete: (snippetId: string) => void;
  onClose: () => void;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

/** Trash2-style icon as inline SVG (no external deps). */
function createTrashIcon(): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"
  );
  const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line1.setAttribute("x1", "10");
  line1.setAttribute("y1", "11");
  line1.setAttribute("x2", "10");
  line1.setAttribute("y2", "17");
  const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line2.setAttribute("x1", "14");
  line2.setAttribute("y1", "11");
  line2.setAttribute("x2", "14");
  line2.setAttribute("y2", "17");
  svg.appendChild(path);
  svg.appendChild(line1);
  svg.appendChild(line2);
  return svg;
}

/** X (close) icon as inline SVG. */
function createCloseIcon(): SVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "16");
  svg.setAttribute("height", "16");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line1.setAttribute("x1", "18");
  line1.setAttribute("y1", "6");
  line1.setAttribute("x2", "6");
  line1.setAttribute("y2", "18");
  const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line2.setAttribute("x1", "6");
  line2.setAttribute("y1", "6");
  line2.setAttribute("x2", "18");
  line2.setAttribute("y2", "18");
  svg.appendChild(line1);
  svg.appendChild(line2);
  return svg;
}

export class PostCaptureBar {
  private readonly host: HTMLDivElement;
  private readonly shadow: ShadowRoot;
  private readonly callbacks: PostCaptureBarCallbacks;
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private currentSnippetId: string | null = null;

  public constructor(callbacks: PostCaptureBarCallbacks) {
    this.callbacks = callbacks;
    this.host = document.createElement("div");
    this.host.setAttribute("data-element-capture-bar", "true");
    this.host.style.cssText = `position:fixed;bottom:20px;left:0;right:0;z-index:${Z_INDEX};pointer-events:none;`;
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
      .bar {
        position: relative;
        overflow: visible;
        font-family: var(--font-sans);
        background: var(--color-surface);
        border-top: 1px solid var(--color-border);
        box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
        padding: var(--space-4);
        padding-bottom: calc(var(--space-4) + env(safe-area-inset-bottom));
        transform: translateY(100%);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: transform 0.25s ease-out, opacity 0.25s ease-out, visibility 0.25s ease-out;
        max-width: 800px;
        width: calc(100% - 40px);
        margin: 0 auto;
      }
      .bar-close {
        position: absolute;
        top: -12px;
        right: -12px;
        min-width: 32px;
        min-height: 32px;
        padding: 0;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-full);
        background: var(--color-surface);
        color: var(--color-text-muted);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-md);
      }
      .bar-close:hover {
        color: var(--color-text-primary);
        background: var(--color-surface-alt);
      }
      .bar-close:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
      }
      .bar[aria-hidden="false"] {
        transform: translateY(0);
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }
      .bar-inner {
        max-width: none;
        margin: 0;
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }
      .bar-thumb {
        flex-shrink: 0;
        width: 60px;
        height: 60px;
        border-radius: var(--radius-2);
        overflow: hidden;
        background: var(--color-surface-alt);
      }
      .bar-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .bar-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }
      .bar-title {
        font-size: var(--text-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin: 0;
      }
      .bar-meta {
        font-size: var(--text-xs);
        color: var(--color-text-muted);
        margin: 0;
        line-height: 1.4;
      }
      .bar-actions {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-wrap: wrap;
      }
      .bar-actions button {
        min-height: 32px;
        padding: 0 var(--space-3);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-1_5);
        background: var(--color-surface);
        color: var(--color-text-primary);
        font-size: var(--text-caption);
        font-family: var(--font-sans);
        cursor: pointer;
        white-space: nowrap;
      }
      .bar-actions button:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
      }
      .bar-actions button.primary {
        background: var(--color-accent);
        color: var(--color-text-inverse);
        border-color: var(--color-accent);
      }
      .bar-actions button.primary:hover {
        background: var(--color-accent-hover);
        border-color: var(--color-accent-hover);
      }
      .bar-actions button.delete-btn {
        min-width: 32px;
        min-height: 32px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: var(--color-text-muted);
      }
      .bar-actions button.delete-btn:hover {
        color: var(--color-danger);
      }
      .toast {
        position: fixed;
        bottom: calc(var(--space-6) + env(safe-area-inset-bottom));
        left: 50%;
        transform: translateX(-50%);
        background: var(--color-surface-inverse);
        color: var(--color-text-inverse);
        font-size: var(--text-caption);
        border-radius: var(--radius-full);
        padding: var(--space-2) var(--space-4);
        z-index: ${Z_INDEX + 1};
      }
      @media screen and (min-width: 750px) {
        .bar {
          border-radius: var(--radius-3);
          border: 1px solid var(--color-border);
          padding: var(--space-4) var(--space-5);
          box-shadow: var(--shadow-lg);
        }
      }
    `;
    this.shadow.appendChild(style);
  }

  public show(snippet: Snippet): void {
    this.clearToast();

    let barEl = this.shadow.querySelector(".bar") as HTMLDivElement | null;
    if (!barEl) {
      barEl = document.createElement("div");
      barEl.className = "bar";
      barEl.setAttribute("aria-hidden", "true");
      barEl.setAttribute("role", "region");
      barEl.setAttribute("aria-label", "Capture saved");

      const closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "bar-close";
      closeBtn.setAttribute("aria-label", "Close");
      closeBtn.appendChild(createCloseIcon());
      closeBtn.addEventListener("click", () => this.callbacks.onClose());
      barEl.appendChild(closeBtn);

      const inner = document.createElement("div");
      inner.className = "bar-inner";

      const thumb = document.createElement("div");
      thumb.className = "bar-thumb";
      const img = document.createElement("img");
      img.alt = "";
      img.loading = "lazy";
      thumb.appendChild(img);
      inner.appendChild(thumb);

      const info = document.createElement("div");
      info.className = "bar-info";
      const titleEl = document.createElement("p");
      titleEl.className = "bar-title";
      const metaEl = document.createElement("p");
      metaEl.className = "bar-meta";
      info.appendChild(titleEl);
      info.appendChild(metaEl);
      inner.appendChild(info);

      const actions = document.createElement("div");
      actions.className = "bar-actions";

      const copyPromptBtn = document.createElement("button");
      copyPromptBtn.type = "button";
      copyPromptBtn.textContent = "Copy prompt";
      copyPromptBtn.addEventListener("click", () => this.callbacks.onCopyPrompt());

      const openLibraryBtn = document.createElement("button");
      openLibraryBtn.type = "button";
      openLibraryBtn.textContent = "Open Library";
      openLibraryBtn.addEventListener("click", () => this.callbacks.onOpenLibrary());

      const captureAnotherBtn = document.createElement("button");
      captureAnotherBtn.type = "button";
      captureAnotherBtn.className = "primary";
      captureAnotherBtn.textContent = "Capture another";
      captureAnotherBtn.addEventListener("click", () => this.callbacks.onCaptureAnother());

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "delete-btn";
      deleteBtn.setAttribute("aria-label", "Delete snippet");
      deleteBtn.appendChild(createTrashIcon());
      deleteBtn.addEventListener("click", () => {
        if (this.currentSnippetId) this.callbacks.onDelete(this.currentSnippetId);
      });

      actions.appendChild(copyPromptBtn);
      actions.appendChild(openLibraryBtn);
      actions.appendChild(captureAnotherBtn);
      actions.appendChild(deleteBtn);
      inner.appendChild(actions);

      barEl.appendChild(inner);
      this.shadow.appendChild(barEl);
      document.body.appendChild(this.host);
    }

    const thumbImg = barEl.querySelector(".bar-thumb img") as HTMLImageElement;
    const titleEl = barEl.querySelector(".bar-title") as HTMLParagraphElement;
    const metaEl = barEl.querySelector(".bar-meta") as HTMLParagraphElement;

    this.currentSnippetId = snippet.id;
    if (thumbImg) thumbImg.src = snippet.thumbnail;
    if (titleEl) titleEl.textContent = snippet.title;
    if (metaEl) metaEl.textContent = `${getDomain(snippet.sourceUrl)} · ${snippet.width} × ${snippet.height}`;

    barEl.setAttribute("aria-hidden", "true");
    void barEl.offsetHeight;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        barEl.setAttribute("aria-hidden", "false");
      });
    });
  }

  private clearToast(): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
    const existing = this.shadow.querySelector(".toast");
    if (existing) existing.remove();
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
    }, TOAST_DURATION_MS);
  }

  public destroy(): void {
    this.clearToast();
    this.host.remove();
  }
}
