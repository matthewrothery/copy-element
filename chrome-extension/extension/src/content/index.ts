import { nanoid } from "nanoid";
import { cloneElementTreeWithInlineStyles } from "../shared/utils/dom-cloner";
import { processImageUrls } from "../shared/utils/image-url-processor";
import { hasShadowDomInSubtree } from "../shared/utils/shadow-dom-detector";
import { serializeElementToHtml } from "../shared/utils/html-serializer";
import { inlineSvgSprites } from "../shared/utils/svg-sprite-inliner";
import { htmlToJsx } from "../shared/utils/jsx-converter";
import { buildRenderContextFromElement } from "../shared/utils/parent-layout-extractor";
import { extractMatchingRules } from "../shared/utils/stylesheet-rule-extractor";
import { extractUsedCssVariableDefinitions } from "../shared/utils/css-var-definition-extractor";
import { extractUsedFontFaces } from "../shared/utils/font-face-extractor";
import { extractUsedKeyframes } from "../shared/utils/keyframes-extractor";
import { extractAllFontLinks } from "../shared/utils/external-font-link-extractor";
import { cropViewportToThumbnail } from "../shared/utils/viewport-thumbnail-crop";
import { getElementRectInTopViewport } from "../shared/utils/viewport-coord-mapper";
import { freezeAnimations } from "../shared/utils/animation-freeze";
import { scrollToRevealElement, scrollPageToTriggerContent } from "../shared/utils/scroll-reveal";
import { stampPseudoIds, extractPseudoElementRules } from "../shared/utils/pseudo-element-extractor";
import type { CapturedElementData } from "../shared/types/snippet";
import type {
  CaptureMode,
  ExtractCssViaCdpPayload,
  RuntimeResponse
} from "../shared/types/messages";
import { buildSnippetFromCapture } from "../shared/utils/snippet-from-capture";
import { PostCaptureBar } from "./post-capture-bar";
import { ProcessingOverlay } from "./processing-overlay";
import { buildSnippetPrompt } from "../shared/utils/prompt-builder";
import { ElementPicker } from "./element-picker";
import {
  getCurrentMonthKey,
  SAVES_THIS_MONTH_KEY,
  type SavesThisMonth
} from "../shared/usage";
import { TOKEN_VALUES } from "../shared/token-values";
import { showConfetti } from "./confetti";

const TOAST_Z_INDEX = 2147483648;
const CAPTURE_ATTR = "data-element-capture-id";
/** Minimum time the processing overlay is shown so it doesn't flash on quick captures. */
const MIN_PROCESSING_OVERLAY_MS = 500;

/**
 * Records this save in storage and returns whether to show confetti (first 5 saves of the month).
 */
async function recordSaveAndShouldShowConfetti(): Promise<boolean> {
  const monthKey = getCurrentMonthKey();
  const result = await chrome.storage.local.get(SAVES_THIS_MONTH_KEY);
  const stored = result[SAVES_THIS_MONTH_KEY] as SavesThisMonth | undefined;
  const count =
    stored?.monthKey === monthKey ? stored.count + 1 : 1;
  await chrome.storage.local.set({
    [SAVES_THIS_MONTH_KEY]: { monthKey, count }
  });
  return count <= 5;
}

function collectAllElements(root: Element): Element[] {
  const elements: Element[] = [root];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    elements.push(node as Element);
  }
  return elements;
}

function addTempCaptureSelectors(root: Element): { selectors: string[]; cleanup: () => void } {
  const prefix = nanoid(8);
  const elements = collectAllElements(root);
  const selectors: string[] = [];

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const value = `${prefix}-${i}`;
    el.setAttribute(CAPTURE_ATTR, value);
    selectors.push(`[${CAPTURE_ATTR}="${value}"]`);
  }

  const cleanup = () => {
    for (const el of elements) {
      el.removeAttribute(CAPTURE_ATTR);
    }
  };

  return { selectors, cleanup };
}

function collectInlineStyleUsageContexts(
  root: Element
): Array<{ cssText: string; media?: string; layerPath?: string }> {
  const contexts: Array<{ cssText: string; media?: string; layerPath?: string }> = [];
  const elements = collectAllElements(root);
  for (const element of elements) {
    const style = element.getAttribute("style")?.trim();
    if (!style) {
      continue;
    }
    contexts.push({ cssText: `:scope { ${style} }` });
  }
  return contexts;
}

let picker: ElementPicker | null = null;
let bar: PostCaptureBar | null = null;
let processingOverlay: ProcessingOverlay | null = null;
let processingOverlayShownAt: number | null = null;

/**
 * True if this frame's DOM is readable (same-origin or otherwise accessible).
 * Cross-origin iframes may have restricted access; skip starting the picker there.
 */
function isDomUsable(): boolean {
  try {
    if (!document.body) return false;
    void document.body.nodeType;
    return true;
  } catch {
    return false;
  }
}

function showPageToast(message: string): void {
  const existing = document.querySelector("[data-element-capture-toast]");
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.setAttribute("data-element-capture-toast", "true");
  toast.style.cssText = `
    position: fixed;
    bottom: ${TOKEN_VALUES.space3};
    left: 50%;
    transform: translateX(-50%);
    background: ${TOKEN_VALUES.toastBg};
    color: ${TOKEN_VALUES.toastText};
    font-size: ${TOKEN_VALUES.textXs};
    font-family: ${TOKEN_VALUES.fontSans};
    border-radius: ${TOKEN_VALUES.radiusFull};
    padding: ${TOKEN_VALUES.space1} ${TOKEN_VALUES.space3};
    box-shadow: 0 12px 20px -12px rgba(24, 29, 39, 0.7);
    z-index: ${TOAST_Z_INDEX};
  `;
  toast.textContent = message;
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2000);
}

async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      return ok;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}

interface PerformCaptureOptions {
  element: HTMLElement;
  width: number;
  height: number;
  label: string;
  /** Overrides the captureViewport preference for this capture. */
  viewportOverride?: string;
  /** Skip taking a viewport screenshot for thumbnail generation. */
  skipThumbnail?: boolean;
  /** Skip the scroll-to-reveal step (e.g. full-page captures that handle scrolling themselves). */
  skipScrollReveal?: boolean;
}

async function performCapture(opts: PerformCaptureOptions): Promise<void> {
  const { element, width, height, label, viewportOverride, skipThumbnail, skipScrollReveal } = opts;

  let thumbnail: string | undefined;
  if (!skipThumbnail) {
    const viewportRect = getElementRectInTopViewport(element);
    if (viewportRect.ok) {
      try {
        const response = (await chrome.runtime.sendMessage({
          type: "CAPTURE_VISIBLE_TAB"
        })) as RuntimeResponse<{ dataUrl: string }>;
        if (response.ok && response.payload.dataUrl) {
          thumbnail = await cropViewportToThumbnail(
            response.payload.dataUrl,
            {
              left: viewportRect.cropLeft,
              top: viewportRect.cropTop,
              width: viewportRect.cropWidth,
              height: viewportRect.cropHeight
            },
            viewportRect.viewportWidth,
            viewportRect.viewportHeight
          );
        }
      } catch (thumbnailError) {
        console.warn("Thumbnail generation failed, using fallback.", thumbnailError);
      }
    }
    // When viewportRect.ok is false (e.g. cross-origin iframe), skip thumbnail to avoid wrong crop
  }

  if (!processingOverlay) {
    processingOverlay = new ProcessingOverlay();
  }
  processingOverlayShownAt = Date.now();
  processingOverlay.show();

  const captureStart = Date.now();
  const elapsed = () => `${Date.now() - captureStart}ms`;

  const baseUrl = window.location.href;

  // Scroll the element into view (if not already visible) so IntersectionObserver-
  // driven animations and lazy images have a chance to initialize before freeze+clone.
  if (!skipScrollReveal) {
    await scrollToRevealElement(element);
    console.debug(`[EA] scroll reveal done (${elapsed()})`);
  }

  // Stamp pseudo IDs before cloning so the clone carries them in HTML
  const unstampPseudoIds = stampPseudoIds(element);
  const unfreezeAnimations = freezeAnimations();
  const cloned = cloneElementTreeWithInlineStyles(element, baseUrl);
  unfreezeAnimations();
  console.debug(`[EA] clone done (${elapsed()})`);

  const rootId = `snippet-root-${nanoid()}`;
  cloned.setAttribute("id", rootId);
  cloned.setAttribute("data-snippet-root", "true");
  processImageUrls(cloned, baseUrl);
  await inlineSvgSprites(cloned, baseUrl);
  console.debug(`[EA] svg sprites done (${elapsed()})`);
  const html = serializeElementToHtml(cloned);
  const jsx = htmlToJsx(html);

  const renderContext = buildRenderContextFromElement(element);

  const pseudoRules = extractPseudoElementRules(element);
  unstampPseudoIds();

  const pseudoCss = pseudoRules
    .map(({ selector, declarations }) => `${selector} {\n${declarations}\n}`)
    .join("\n\n");

  const prefsResult = await chrome.storage.local.get("element-armory-ui-preferences");
  const prefs = prefsResult["element-armory-ui-preferences"] as
    | Partial<{ captureTheme: string; captureViewport: string }>
    | undefined;
  const captureTheme = prefs?.captureTheme ?? "default";
  const captureViewport = viewportOverride ?? prefs?.captureViewport ?? "default";

  let cssText: string;
  let fontFaces: string;
  let keyframesCss: string;
  let layerOrder: string[];
  let variableDefinitions: ExtractCssViaCdpPayload["variableDefinitions"] | undefined;
  let variableUsageContexts: ExtractCssViaCdpPayload["variableUsageContexts"] | undefined;

  const needsEmulation = captureTheme !== "default" || captureViewport !== "default";

  if (needsEmulation) {
    const { selectors, cleanup } = addTempCaptureSelectors(element);
    console.debug(`[EA] selector count: ${selectors.length}, stamping done (${elapsed()})`);
    try {
      console.debug(`[EA] starting CDP extraction with emulation (${elapsed()})`);
      const cdpResponse = (await chrome.runtime.sendMessage({
        type: "EXTRACT_CSS_VIA_CDP",
        payload: {
          selectors,
          baseUrl,
          theme: captureTheme !== "default" ? (captureTheme as "light" | "dark") : undefined,
          viewport: captureViewport !== "default" ? captureViewport : undefined,
        }
      })) as RuntimeResponse<ExtractCssViaCdpPayload>;
      console.debug(`[EA] CDP extraction done (${elapsed()})`);

      if (cdpResponse.ok && cdpResponse.payload.cssText?.trim()) {
        const p = cdpResponse.payload;
        cssText = p.cssText;
        fontFaces = p.fontFacesCss;
        keyframesCss = p.keyframesCss;
        layerOrder = p.layerOrder;
        variableDefinitions = p.variableDefinitions;
        variableUsageContexts = p.variableUsageContexts;
      } else {
        throw new Error(cdpResponse.ok ? "CDP returned empty CSS" : cdpResponse.error);
      }
    } catch (cdpErr) {
      console.warn(`[EA] CDP emulation extraction failed, falling back (${elapsed()})`, cdpErr);
      const extracted = await extractMatchingRules(element);
      cssText = extracted.cssText;
      layerOrder = extracted.layerOrder;
      fontFaces = await extractUsedFontFaces(extracted.usedFontFamilies, baseUrl);
      keyframesCss = await extractUsedKeyframes(extracted.usedAnimationNames);
    } finally {
      cleanup();
    }
  } else {
    console.debug(`[EA] starting in-page extraction (${elapsed()})`);
    const extracted = await extractMatchingRules(element);
    console.debug(`[EA] in-page extraction done (${elapsed()})`);
    cssText = extracted.cssText;
    layerOrder = extracted.layerOrder;
    fontFaces = await extractUsedFontFaces(extracted.usedFontFamilies, baseUrl);
    keyframesCss = await extractUsedKeyframes(extracted.usedAnimationNames);
  }

  // Extract :root block for CSS variables used in matched rules
  console.debug(`[EA] starting CSS variable extraction (${elapsed()})`);
  const inlineStyleUsageContexts = collectInlineStyleUsageContexts(element);
  const mergedUsageContexts =
    variableUsageContexts && variableUsageContexts.length > 0
      ? [...variableUsageContexts, ...inlineStyleUsageContexts]
      : [{ cssText }, ...inlineStyleUsageContexts];
  const varDefinitionsBlock = await extractUsedCssVariableDefinitions(
    element,
    cssText,
    {
      definitions: variableDefinitions,
      usageContexts: mergedUsageContexts,
      layerOrder,
      rootSelector: `#${rootId}`
    }
  );
  console.debug(`[EA] CSS variable extraction done (${elapsed()})`);

  if (Date.now() - captureStart > 3000) {
    console.warn(`[EA] capture took ${elapsed()} — slow capture detected. Check the steps above for bottlenecks.`);
  }

  // Extract external font links (Google Fonts, etc.)
  const { stylesheets: externalFontLinks, preloads: fontPreloads } = extractAllFontLinks();

  const layerOrderDeclaration = layerOrder.length > 0 ? `@layer ${layerOrder.join(", ")};` : "";

  // Combine font-faces, keyframes, variable definitions, CSS rules, and pseudo-element rules
  const styleBlock = [
    layerOrderDeclaration,
    fontFaces,
    keyframesCss,
    varDefinitionsBlock,
    cssText,
    pseudoCss
  ]
    .filter(Boolean)
    .join("\n\n");

  const capture: CapturedElementData = {
    html,
    jsx,
    width,
    height,
    elementLabel: label,
    thumbnail,
    renderContext,
    rootId,
    styleBlock: styleBlock || undefined,
    externalFontLinks: [...fontPreloads, ...externalFontLinks],
    hasShadowDom: hasShadowDomInSubtree(element)
  };

  const snippet = buildSnippetFromCapture(capture);
  await autoSaveSnippet(snippet);

  // Keep overlay visible at least MIN_PROCESSING_OVERLAY_MS so it doesn't flash on quick captures
  if (processingOverlayShownAt !== null) {
    const ms = Date.now() - processingOverlayShownAt;
    const remaining = Math.max(0, MIN_PROCESSING_OVERLAY_MS - ms);
    if (remaining > 0) {
      await new Promise((r) => setTimeout(r, remaining));
    }
    processingOverlayShownAt = null;
  }
  processingOverlay?.hide();
  picker?.stop();

  if (bar) {
    bar.destroy();
  }

  bar = new PostCaptureBar({
    onCopyPrompt: () => { handleCopyPrompt(snippet); },
    onOpenLibrary: () => { handleGoToLibrary(); },
    onCaptureAnother: () => { handleCaptureAnother(); },
    onDelete: (snippetId: string) => { handleDeleteSnippet(snippetId); },
    onClose: () => { bar?.destroy(); bar = null; }
  });

  bar.show(snippet);
}

async function captureFullPage(mode: "page" | "mobile-page" | "desktop-page"): Promise<void> {
  if (!isDomUsable()) return;
  const viewportOverride =
    mode === "mobile-page" ? "phone" :
    mode === "desktop-page" ? "desktop" :
    undefined;
  const label =
    mode === "mobile-page" ? "Mobile Page" :
    mode === "desktop-page" ? "Desktop Page" :
    "Page";
  const element = document.body;
  let viewportWasSet = false;
  try {
    // For non-default viewport captures, set the viewport before scrolling and cloning
    // so that lazy-load triggers, page dimensions, and the DOM clone all reflect the
    // target viewport size. CDP emulation persists after the debugger detaches, so
    // subsequent in-page operations see the correct layout. CSS extraction teardown
    // will clear the override once it finishes.
    if (viewportOverride) {
      await chrome.runtime.sendMessage({
        type: "SET_VIEWPORT_EMULATION",
        payload: { viewport: viewportOverride },
      });
      viewportWasSet = true;
      // Wait for the page to reflow at the new viewport size before scrolling.
      await new Promise<void>((resolve) => setTimeout(resolve, 200));
    }
    // Scroll through the page to trigger lazy images and scroll-activated content
    // before freezing and cloning.
    await scrollPageToTriggerContent();
    await performCapture({
      element,
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      label,
      viewportOverride,
      skipThumbnail: true,
      skipScrollReveal: true,
    });
  } catch (error) {
    // If we set the viewport but the capture failed before CSS extraction could
    // tear it down, restore the viewport so the page isn't stuck at the wrong size.
    if (viewportWasSet) {
      chrome.runtime.sendMessage({ type: "CLEAR_VIEWPORT_EMULATION" }).catch(() => {});
    }
    console.error("Failed to capture page", error);
    processingOverlayShownAt = null;
    processingOverlay?.hide();
  }
}

function ensurePicker(): ElementPicker {
  if (!picker) {
    picker = new ElementPicker({
      onSelected: (result) => {
        chrome.runtime.sendMessage({ type: "STOP_OTHER_PICKERS" }).catch(() => {});
        picker?.hideOverlayForScreenshot();
        void (async () => {
          await new Promise<void>((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => r()))
          );
          try {
            await performCapture({
              element: result.element,
              width: result.width,
              height: result.height,
              label: result.label,
            });
          } catch (error) {
            console.error("Failed to capture element", error);
            processingOverlayShownAt = null;
            processingOverlay?.hide();
            picker?.stop();
          }
        })();
      },
      onEscape: () => {
        chrome.runtime.sendMessage({ type: "BROADCAST_CANCEL_CAPTURE" }).catch(() => {});
      },
      onFrameHoverActive: () => {
        chrome.runtime.sendMessage({ type: "FRAME_HOVER_ACTIVE" }).catch(() => {});
      }
    });
  }

  return picker;
}

async function autoSaveSnippet(snippet: ReturnType<typeof buildSnippetFromCapture>): Promise<void> {
  try {
    const saveResponse = (await chrome.runtime.sendMessage({
      type: "SAVE_SNIPPET",
      payload: snippet
    })) as RuntimeResponse<null>;
    if (saveResponse.ok) {
      if (await recordSaveAndShouldShowConfetti()) {
        showConfetti(TOAST_Z_INDEX);
      }
      showPageToast("Snippet saved");
    } else {
      showPageToast("Failed to save snippet");
    }
  } catch (err) {
    console.error("Failed to save snippet", err);
    showPageToast("Failed to save snippet");
  }
}

function handleCaptureAnother(): void {
  bar?.destroy();
  bar = null;
  picker?.start();
}

function handleGoToLibrary(): void {
  void chrome.runtime.sendMessage({ type: "OPEN_LIBRARY_TAB" }).catch(() => {});
  bar?.destroy();
  bar = null;
}

async function handleCopyPrompt(snippet: ReturnType<typeof buildSnippetFromCapture>): Promise<void> {
  const ok = await copyToClipboard(buildSnippetPrompt(snippet));
  if (ok && bar) {
    bar.showToast("Copied prompt");
  } else if (!ok) {
    showPageToast("Failed to copy prompt");
  }
}

async function handleDeleteSnippet(snippetId: string): Promise<void> {
  try {
    const response = (await chrome.runtime.sendMessage({
      type: "DELETE_SNIPPET",
      payload: { id: snippetId }
    })) as RuntimeResponse<null>;
    bar?.destroy();
    bar = null;
    if (response?.ok !== false) {
      showPageToast("Snippet removed");
    }
  } catch (err) {
    console.error("Failed to delete snippet", err);
    showPageToast("Failed to remove snippet");
  }
}

chrome.runtime.onMessage.addListener((message: { type?: string; mode?: CaptureMode }) => {
  if (!message?.type) {
    return;
  }

  if (message.type === "START_CAPTURE") {
    const mode = message.mode ?? "element";
    if (isDomUsable()) {
      if (mode === "page" || mode === "mobile-page" || mode === "desktop-page") {
        // Page-level captures run only in the top frame
        if (window === window.top) {
          void captureFullPage(mode);
        }
      } else {
        ensurePicker().start();
      }
    }
    return;
  }

  if (message.type === "CANCEL_CAPTURE") {
    picker?.stop();
    bar?.destroy();
    bar = null;
    return;
  }

  if (message.type === "CLEAR_FRAME_HOVER") {
    picker?.clearHoverOnly();
  }
});
