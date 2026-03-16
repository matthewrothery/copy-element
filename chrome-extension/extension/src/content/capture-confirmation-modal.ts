import { nanoid } from "nanoid";
import type { CapturedElementData, Snippet } from "../shared/types/snippet";
import { buildPreviewForCapture } from "../shared/utils/preview-srcdoc-builder";
import { generateSnippetName } from "../shared/utils/snippet-name";
import { TOKENS_CSS } from "../shared/tokens-css";
import {
  clamp,
  computeFitScale,
  getDistance,
  getMidpoint,
  SCALE_MAX,
  SCALE_MIN,
  ZOOM_IN_FACTOR,
  ZOOM_OUT_FACTOR
} from "../shared/utils/preview-zoom-pan";

const Z_INDEX = 2147483647;

export type CopyFormat = "html" | "html-inline" | "jsx";

export interface CaptureConfirmationCallbacks {
  onCopyCode: (format: CopyFormat) => void;
  onCopyPrompt: () => void;
  onCopyMcp: () => void;
  onCaptureAnother: () => void;
  onGoToLibrary: () => void;
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
        padding: var(--space-4);
      }
      .modal {
        width: min(900px, calc(100vw - 48px));
        max-height: min(88vh, 820px);
        overflow-y: auto;
        background: var(--color-surface);
        border-radius: var(--radius-2);
        border: 1px solid var(--color-border);
        padding: var(--space-4);
        box-shadow: var(--shadow-lg);
      }
      .modal h2 {
        margin: 0;
        font-size: var(--text-heading);
        font-weight: var(--font-weight-semibold);
        color: var(--color-text-primary);
      }
      .subhead {
        margin: var(--space-2) 0 0;
        color: var(--color-text-secondary);
        font-size: var(--text-caption);
      }
      .preview-shell {
        margin-top: var(--space-4);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-2);
        background: var(--color-surface-alt);
        overflow: hidden;
      }
      .preview-toolbar {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        border-bottom: 1px solid var(--color-border);
        padding: var(--space-2);
      }
      .preview-toolbar button {
        min-height: 32px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-1_5);
        background: var(--color-surface);
        color: var(--color-text-primary);
        cursor: pointer;
        font-size: var(--text-caption);
        padding: 0 var(--space-3);
      }
      .preview-toolbar button:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
      }
      .zoom-label {
        margin-left: auto;
        color: var(--color-text-muted);
        font-size: var(--text-caption);
      }
      .preview-viewport {
        position: relative;
        height: 520px;
        overflow: hidden;
        touch-action: none;
      }
      .preview-content {
        position: absolute;
        top: 0;
        left: 0;
        transform-origin: 0 0;
        user-select: none;
      }
      .preview-content iframe {
        width: 100%;
        height: 100%;
        display: block;
        border: 0;
        pointer-events: none;
      }
      .meta-grid {
        margin-top: var(--space-4);
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-4);
      }
      .meta {
        margin: 0;
        font-size: var(--text-caption);
        color: var(--color-text-muted);
      }
      .meta-label {
        color: var(--color-text-primary);
        font-weight: var(--font-weight-medium);
      }
      .capture-status {
        margin-top: var(--space-3);
        display: flex;
        flex-direction: row;
        gap: var(--space-2);
      }
      .capture-status-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-1_5);
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-caption);
      }
      .capture-status-mark {
        width: 18px;
        height: 18px;
        border-radius: var(--radius-full);
        border: 1px solid var(--color-border);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
      }
      .capture-status-mark.checked {
        border-color: var(--color-accent);
        background: var(--color-accent);
        color: var(--color-text-inverse);
      }
      .capture-status-label {
        color: var(--color-text-primary);
      }
      .capture-status-help {
        margin-left: auto;
        min-height: 24px;
        min-width: 24px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-full);
        background: var(--color-surface);
        color: var(--color-text-muted);
        cursor: help;
        font-size: var(--text-caption);
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
      .copy-actions,
      .primary-actions {
        margin-top: var(--space-3);
        display: flex;
        gap: var(--space-2);
        flex-wrap: wrap;
      }
      .copy-actions button,
      .primary-actions button {
        min-height: 32px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-1_5);
        background: var(--color-surface);
        color: var(--color-text-primary);
        cursor: pointer;
        font-size: var(--text-caption);
        padding: 0 var(--space-4);
        font-family: var(--font-sans);
      }
      .copy-actions button:focus-visible,
      .primary-actions button:focus-visible {
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
      }
      .primary-actions button.primary {
        background: var(--color-accent);
        color: var(--color-text-inverse);
        border-color: var(--color-accent);
      }
      .primary-actions button.primary:hover {
        background: var(--color-accent-hover);
        border-color: var(--color-accent-hover);
      }
      .primary-actions .spacer {
        flex: 1;
      }
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

    const subhead = document.createElement("p");
    subhead.className = "subhead";
    subhead.textContent = "Review the capture, choose a copy format, then save or continue capturing.";
    modal.appendChild(subhead);

    const previewShell = document.createElement("div");
    previewShell.className = "preview-shell";

    const previewToolbar = document.createElement("div");
    previewToolbar.className = "preview-toolbar";

    const fitBtn = document.createElement("button");
    fitBtn.type = "button";
    fitBtn.textContent = "Fit";

    const hundredBtn = document.createElement("button");
    hundredBtn.type = "button";
    hundredBtn.textContent = "100%";

    const zoomOutBtn = document.createElement("button");
    zoomOutBtn.type = "button";
    zoomOutBtn.textContent = "−";

    const zoomInBtn = document.createElement("button");
    zoomInBtn.type = "button";
    zoomInBtn.textContent = "+";

    const zoomLabel = document.createElement("span");
    zoomLabel.className = "zoom-label";
    zoomLabel.setAttribute("aria-live", "polite");

    previewToolbar.appendChild(fitBtn);
    previewToolbar.appendChild(hundredBtn);
    previewToolbar.appendChild(zoomOutBtn);
    previewToolbar.appendChild(zoomInBtn);
    previewToolbar.appendChild(zoomLabel);
    previewShell.appendChild(previewToolbar);

    const previewViewport = document.createElement("div");
    previewViewport.className = "preview-viewport";
    previewShell.appendChild(previewViewport);

    const contentWidth = Math.max(capture.width, 1);
    const contentHeight = Math.max(capture.height, 1);

    const previewContent = document.createElement("div");
    previewContent.className = "preview-content";
    previewContent.style.width = `${contentWidth}px`;
    previewContent.style.height = `${contentHeight}px`;

    const iframe = document.createElement("iframe");
    iframe.sandbox.add("allow-same-origin");
    iframe.title = "Captured element preview";
    iframe.srcdoc = buildPreviewForCapture({
      html: capture.html,
      styleBlock: capture.styleBlock,
      width: capture.width,
      height: capture.height,
      sourceUrl: window.location.href,
      renderContext: capture.renderContext,
      externalFontLinks: capture.externalFontLinks
    });
    previewContent.appendChild(iframe);

    previewViewport.appendChild(previewContent);

    const metaGrid = document.createElement("div");
    metaGrid.className = "meta-grid";

    const metaLabel = document.createElement("p");
    metaLabel.className = "meta";
    const metaLabelTitle = document.createElement("span");
    metaLabelTitle.className = "meta-label";
    metaLabelTitle.textContent = "Element";
    metaLabel.appendChild(metaLabelTitle);
    metaLabel.append(document.createTextNode(` ${capture.elementLabel}`));
    metaGrid.appendChild(metaLabel);

    const metaSize = document.createElement("p");
    metaSize.className = "meta";
    const metaSizeTitle = document.createElement("span");
    metaSizeTitle.className = "meta-label";
    metaSizeTitle.textContent = "Size";
    metaSize.appendChild(metaSizeTitle);
    metaSize.append(document.createTextNode(` ${capture.width} × ${capture.height}`));
    metaGrid.appendChild(metaSize);

    modal.appendChild(previewShell);
    modal.appendChild(metaGrid);

    const statusList = document.createElement("div");
    statusList.className = "capture-status";

    const hasMediaQueries = /@media|@container/.test(capture.styleBlock ?? "");
    const hasStyles = Boolean(capture.styleBlock && capture.styleBlock.trim().length > 0);
    const hasShadowDom = Boolean(capture.hasShadowDom);

    const addStatus = (label: string, checked: boolean, tooltip: string): void => {
      const item = document.createElement("div");
      item.className = "capture-status-item";

      const mark = document.createElement("span");
      mark.className = `capture-status-mark${checked ? " checked" : ""}`;
      mark.textContent = checked ? "✓" : "○";

      const text = document.createElement("span");
      text.className = "capture-status-label";
      text.textContent = label;

      const help = document.createElement("button");
      help.type = "button";
      help.className = "capture-status-help";
      help.textContent = "?";
      help.title = tooltip;
      help.setAttribute("aria-label", `${label} info`);

      item.appendChild(mark);
      item.appendChild(text);
      item.appendChild(help);
      statusList.appendChild(item);
    };

    addStatus(
      "Media queries",
      hasMediaQueries,
      "Includes responsive @media or @container rules so the element can adapt at different sizes."
    );
    addStatus(
      "Styles",
      hasStyles,
      "Includes extracted CSS rules, fonts, variables, and other style dependencies used by this element."
    );
    addStatus(
      "Shadow DOM",
      hasShadowDom,
      "Indicates whether Shadow DOM was detected for this element or within its subtree."
    );

    modal.appendChild(statusList);

    const formatToggle = document.createElement("div");
    formatToggle.className = "format-toggle";

    const htmlBtn = document.createElement("button");
    htmlBtn.type = "button";
    htmlBtn.textContent = "HTML";
    htmlBtn.setAttribute("aria-label", "Copy code as HTML with style block");

    const inlineBtn = document.createElement("button");
    inlineBtn.type = "button";
    inlineBtn.textContent = "Inline";
    inlineBtn.setAttribute("aria-label", "Copy code as inline HTML");

    const jsxBtn = document.createElement("button");
    jsxBtn.type = "button";
    jsxBtn.textContent = "JSX";
    jsxBtn.setAttribute("aria-label", "Copy code as JSX");

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

    const copyActions = document.createElement("div");
    copyActions.className = "copy-actions";

    const copyCodeBtn = document.createElement("button");
    copyCodeBtn.type = "button";
    copyCodeBtn.textContent = "Copy code";
    copyCodeBtn.addEventListener("click", () => {
      this.callbacks.onCopyCode(this.copyFormat);
    });

    const copyPromptBtn = document.createElement("button");
    copyPromptBtn.type = "button";
    copyPromptBtn.textContent = "Copy prompt";
    copyPromptBtn.addEventListener("click", () => {
      this.callbacks.onCopyPrompt();
    });

    const copyMcpBtn = document.createElement("button");
    copyMcpBtn.type = "button";
    copyMcpBtn.textContent = "Copy MCP";
    copyMcpBtn.addEventListener("click", () => {
      this.callbacks.onCopyMcp();
    });

    copyActions.appendChild(copyCodeBtn);
    copyActions.appendChild(copyPromptBtn);
    copyActions.appendChild(copyMcpBtn);
    modal.appendChild(copyActions);

    const primaryActions = document.createElement("div");
    primaryActions.className = "primary-actions";

    let cleanupPreviewEvents: (() => void) | null = null;

    const close = (): void => {
      cleanupPreviewEvents?.();
      cleanupPreviewEvents = null;
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
    cancelBtn.type = "button";
    cancelBtn.textContent = "Close";
    cancelBtn.addEventListener("click", () => {
      close();
      this.callbacks.onCancel();
    });

    const captureAnotherBtn = document.createElement("button");
    captureAnotherBtn.type = "button";
    captureAnotherBtn.className = "primary";
    captureAnotherBtn.textContent = "Capture another";
    captureAnotherBtn.addEventListener("click", () => {
      close();
      this.callbacks.onCaptureAnother();
    });

    const goToLibraryBtn = document.createElement("button");
    goToLibraryBtn.type = "button";
    goToLibraryBtn.textContent = "Go to library";
    goToLibraryBtn.addEventListener("click", () => {
      close();
      this.callbacks.onGoToLibrary();
    });

    const spacer = document.createElement("span");
    spacer.className = "spacer";

    primaryActions.appendChild(cancelBtn);
    primaryActions.appendChild(spacer);
    primaryActions.appendChild(captureAnotherBtn);
    primaryActions.appendChild(goToLibraryBtn);
    modal.appendChild(primaryActions);

    backdrop.appendChild(modal);
    this.shadow.appendChild(backdrop);
    document.body.appendChild(this.host);

    let scale = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let startPanX = 0;
    let startPanY = 0;
    let pinchStartDistance = 0;
    let pinchStartScale = 1;

    const updateTransform = (): void => {
      previewContent.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
      zoomLabel.textContent = `${Math.round(scale * 100)}%`;
    };

    const fitToView = (): void => {
      const viewportW = previewViewport.clientWidth;
      const viewportH = previewViewport.clientHeight;
      if (viewportW <= 0 || viewportH <= 0) {
        return;
      }
      scale = computeFitScale(viewportW, viewportH, contentWidth, contentHeight);
      panX = (viewportW - contentWidth * scale) / 2;
      panY = (viewportH - contentHeight * scale) / 2;
      updateTransform();
    };

    const zoomAtPoint = (newScale: number, clientX: number, clientY: number): void => {
      const rect = previewViewport.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const worldX = (x - panX) / scale;
      const worldY = (y - panY) / scale;
      scale = clamp(newScale, SCALE_MIN, SCALE_MAX);
      panX = x - worldX * scale;
      panY = y - worldY * scale;
      updateTransform();
    };

    fitBtn.addEventListener("click", fitToView);
    hundredBtn.addEventListener("click", () => {
      const rect = previewViewport.getBoundingClientRect();
      zoomAtPoint(1, rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
    zoomOutBtn.addEventListener("click", () => {
      const rect = previewViewport.getBoundingClientRect();
      zoomAtPoint(scale * ZOOM_OUT_FACTOR, rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
    zoomInBtn.addEventListener("click", () => {
      const rect = previewViewport.getBoundingClientRect();
      zoomAtPoint(scale * ZOOM_IN_FACTOR, rect.left + rect.width / 2, rect.top + rect.height / 2);
    });

    const handleWheel = (e: WheelEvent): void => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? ZOOM_OUT_FACTOR : ZOOM_IN_FACTOR;
      zoomAtPoint(scale * factor, e.clientX, e.clientY);
    };

    const handleMouseDown = (e: MouseEvent): void => {
      if (e.button !== 0) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      startPanX = panX;
      startPanY = panY;
    };

    const handleMouseMove = (e: MouseEvent): void => {
      if (!isDragging) return;
      panX = startPanX + (e.clientX - dragStartX);
      panY = startPanY + (e.clientY - dragStartY);
      updateTransform();
    };

    const stopDrag = (): void => {
      isDragging = false;
    };

    const handleTouchStart = (e: TouchEvent): void => {
      if (e.touches.length === 2) {
        pinchStartDistance = getDistance(e.touches[0], e.touches[1]);
        pinchStartScale = scale;
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        isDragging = true;
        dragStartX = t.clientX;
        dragStartY = t.clientY;
        startPanX = panX;
        startPanY = panY;
      }
    };

    const handleTouchMove = (e: TouchEvent): void => {
      e.preventDefault();
      if (e.touches.length === 2 && pinchStartDistance > 0) {
        const distance = getDistance(e.touches[0], e.touches[1]);
        const midpoint = getMidpoint(e.touches[0], e.touches[1]);
        const nextScale = pinchStartScale * (distance / pinchStartDistance);
        zoomAtPoint(nextScale, midpoint.x, midpoint.y);
        return;
      }
      if (e.touches.length === 1 && isDragging) {
        const t = e.touches[0];
        panX = startPanX + (t.clientX - dragStartX);
        panY = startPanY + (t.clientY - dragStartY);
        updateTransform();
      }
    };

    const handleTouchEnd = (): void => {
      if (isDragging) {
        isDragging = false;
      }
      if (pinchStartDistance > 0) {
        pinchStartDistance = 0;
      }
    };

    previewViewport.addEventListener("wheel", handleWheel, { passive: false });
    previewViewport.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", stopDrag);
    previewViewport.addEventListener("touchstart", handleTouchStart, { passive: true });
    previewViewport.addEventListener("touchmove", handleTouchMove, { passive: false });
    previewViewport.addEventListener("touchend", handleTouchEnd);
    previewViewport.addEventListener("touchcancel", handleTouchEnd);

    cleanupPreviewEvents = () => {
      previewViewport.removeEventListener("wheel", handleWheel);
      previewViewport.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDrag);
      previewViewport.removeEventListener("touchstart", handleTouchStart);
      previewViewport.removeEventListener("touchmove", handleTouchMove);
      previewViewport.removeEventListener("touchend", handleTouchEnd);
      previewViewport.removeEventListener("touchcancel", handleTouchEnd);
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        fitToView();
      });
    });
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
