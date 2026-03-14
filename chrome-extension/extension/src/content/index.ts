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
import type { CapturedElementData } from "../shared/types/snippet";
import type {
  ExtractCssViaCdpPayload,
  RuntimeResponse
} from "../shared/types/messages";
import {
  buildSnippetFromCapture,
  CaptureConfirmationModal,
  type CopyFormat
} from "./capture-confirmation-modal";
import { buildCopyHtml } from "../shared/utils/preview-srcdoc-builder";
import { ElementPicker } from "./element-picker";
import { TOKEN_VALUES } from "../shared/token-values";
import { showConfetti } from "./confetti";

const TOAST_Z_INDEX = 2147483648;
const CAPTURE_ATTR = "data-element-capture-id";
const SAVES_THIS_MONTH_KEY = "element-armory-saves-this-month";

interface SavesThisMonth {
  monthKey: string;
  count: number;
}

function getCurrentMonthKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

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
let modal: CaptureConfirmationModal | null = null;

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

function ensurePicker(): ElementPicker {
  if (!picker) {
    picker = new ElementPicker({
      onSelected: (result) => {
      void (async () => {
        try {
          // Stop pickers in other frames so only this capture is active
          chrome.runtime.sendMessage({ type: "STOP_OTHER_PICKERS" }).catch(() => {});

          picker?.hideOverlayForScreenshot();
          await new Promise<void>((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => r()))
          );
          const viewportRect = getElementRectInTopViewport(result.element);

          let thumbnail: string | undefined;
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

          const baseUrl = window.location.href;
          const cloned = cloneElementTreeWithInlineStyles(result.element, baseUrl);
          const rootId = `snippet-root-${nanoid()}`;
          cloned.setAttribute("id", rootId);
          cloned.setAttribute("data-snippet-root", "true");
          processImageUrls(cloned, baseUrl);
          await inlineSvgSprites(cloned, baseUrl);
          const html = serializeElementToHtml(cloned);
          const jsx = htmlToJsx(html);

          const renderContext = buildRenderContextFromElement(result.element);

          // Add temporary selectors for CDP; clone was created before so snippet HTML stays clean
          const { selectors, cleanup } = addTempCaptureSelectors(result.element);

          let cssText: string;
          let fontFaces: string;
          let keyframesCss: string;
          let layerOrder: string[];
          let variableDefinitions: ExtractCssViaCdpPayload["variableDefinitions"] | undefined;
          let variableUsageContexts: ExtractCssViaCdpPayload["variableUsageContexts"] | undefined;

          try {
            const cdpResponse = (await chrome.runtime.sendMessage({
              type: "EXTRACT_CSS_VIA_CDP",
              payload: { selectors, baseUrl }
            })) as RuntimeResponse<ExtractCssViaCdpPayload>;

            if (cdpResponse.ok) {
              const p = cdpResponse.payload;
              const isEmpty = !p.cssText || !p.cssText.trim();
              if (isEmpty) {
                throw new Error("CDP returned empty CSS (e.g. iframe or no match); using in-page fallback");
              }
              cssText = p.cssText;
              fontFaces = p.fontFacesCss;
              keyframesCss = p.keyframesCss;
              layerOrder = p.layerOrder;
              variableDefinitions = p.variableDefinitions;
              variableUsageContexts = p.variableUsageContexts;
            } else {
              throw new Error(cdpResponse.error);
            }
          } catch {
            // Fallback to in-page extraction when CDP fails (e.g. debugger attached elsewhere, or iframe capture)
            const extracted = await extractMatchingRules(result.element);
            cssText = extracted.cssText;
            layerOrder = extracted.layerOrder;
            fontFaces = await extractUsedFontFaces(
              extracted.usedFontFamilies,
              baseUrl
            );
            keyframesCss = await extractUsedKeyframes(
              extracted.usedAnimationNames
            );
            variableDefinitions = undefined;
            variableUsageContexts = undefined;
          } finally {
            cleanup();
          }

          // Extract :root block for CSS variables used in matched rules
          const inlineStyleUsageContexts = collectInlineStyleUsageContexts(result.element);
          const mergedUsageContexts =
            variableUsageContexts && variableUsageContexts.length > 0
              ? [...variableUsageContexts, ...inlineStyleUsageContexts]
              : [{ cssText }, ...inlineStyleUsageContexts];
          const varDefinitionsBlock = await extractUsedCssVariableDefinitions(
            result.element,
            cssText,
            {
              definitions: variableDefinitions,
              usageContexts: mergedUsageContexts,
              layerOrder,
              rootSelector: `#${rootId}`
            }
          );

          // Extract external font links (Google Fonts, etc.)
          const { stylesheets: externalFontLinks, preloads: fontPreloads } =
            extractAllFontLinks();

          const layerOrderDeclaration =
            layerOrder.length > 0 ? `@layer ${layerOrder.join(", ")};` : "";

          // Combine font-faces, keyframes, variable definitions, and CSS rules
          const styleBlock = [
            layerOrderDeclaration,
            fontFaces,
            keyframesCss,
            varDefinitionsBlock,
            cssText
          ]
            .filter(Boolean)
            .join("\n\n");

          const capture: CapturedElementData = {
            html,
            jsx,
            width: result.width,
            height: result.height,
            elementLabel: result.label,
            thumbnail,
            renderContext,
            rootId,
            styleBlock: styleBlock || undefined,
            externalFontLinks: [...fontPreloads, ...externalFontLinks],
            hasShadowDom: hasShadowDomInSubtree(result.element)
          };

          picker?.stop();

          if (modal) {
            modal.destroy();
          }

          modal = new CaptureConfirmationModal({
            onSave: () => {
              handleSave(capture);
            },
            onSaveAndCaptureAnother: () => {
              handleSaveAndCaptureAnother(capture);
            },
            onCopy: (format: CopyFormat) => {
              handleCopy(capture, format);
            },
            onCancel: () => {
              modal?.destroy();
              modal = null;
            }
          });

          modal.show(capture);
        } catch (error) {
          console.error("Failed to capture element", error);
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

async function handleSave(capture: CapturedElementData): Promise<void> {
  try {
    const snippet = buildSnippetFromCapture(capture);
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
  } finally {
    modal?.destroy();
    modal = null;
  }
}

async function handleSaveAndCaptureAnother(capture: CapturedElementData): Promise<void> {
  try {
    const snippet = buildSnippetFromCapture(capture);
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
  } finally {
    modal?.destroy();
    modal = null;
    picker?.start();
  }
}

async function handleCopy(capture: CapturedElementData, format: CopyFormat): Promise<void> {
  const value =
    format === "html" || format === "html-inline"
      ? buildCopyHtml(buildSnippetFromCapture(capture), {
          includeStyleBlock: format !== "html-inline"
        })
      : capture.jsx;
  const ok = await copyToClipboard(value);
  if (ok && modal) {
    modal.showToast("Copied to clipboard");
  } else if (!ok) {
    showPageToast("Failed to copy");
  }
}

chrome.runtime.onMessage.addListener((message: { type?: string }) => {
  if (!message?.type) {
    return;
  }

  if (message.type === "START_CAPTURE") {
    if (isDomUsable()) {
      ensurePicker().start();
    }
    return;
  }

  if (message.type === "CANCEL_CAPTURE") {
    picker?.stop();
    modal?.destroy();
    modal = null;
    return;
  }

  if (message.type === "CLEAR_FRAME_HOVER") {
    picker?.clearHoverOnly();
  }
});
