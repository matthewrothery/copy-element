import { nanoid } from "nanoid";
import { cloneElementTreeWithInlineStyles } from "../shared/utils/dom-cloner";
import { serializeElementToHtml } from "../shared/utils/html-serializer";
import { inlineSvgSprites } from "../shared/utils/svg-sprite-inliner";
import { htmlToJsx } from "../shared/utils/jsx-converter";
import { buildRenderContextFromElement } from "../shared/utils/parent-layout-extractor";
import { buildBaseStyleBlock } from "../shared/utils/style-block-builder";
import { extractMediaAndContainerRules } from "../shared/utils/stylesheet-media-extractor";
import { generateThumbnail } from "../shared/utils/thumbnail-generator";
import type { CapturedElementData } from "../shared/types/snippet";
import {
  buildSnippetFromCapture,
  CaptureConfirmationModal,
  type CopyFormat
} from "./capture-confirmation-modal";
import { ElementPicker } from "./element-picker";

const TOAST_Z_INDEX = 2147483648;

let picker: ElementPicker | null = null;
let modal: CaptureConfirmationModal | null = null;

function showPageToast(message: string): void {
  const existing = document.querySelector("[data-element-capture-toast]");
  if (existing) {
    existing.remove();
  }

  const toast = document.createElement("div");
  toast.setAttribute("data-element-capture-toast", "true");
  toast.style.cssText = `
    position: fixed;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    background: #111827;
    color: #ffffff;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;
    border-radius: 999px;
    padding: 6px 12px;
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
    picker = new ElementPicker((result) => {
      void (async () => {
        try {
          const cloned = cloneElementTreeWithInlineStyles(result.element);
          const rootId = `snippet-root-${nanoid()}`;
          cloned.setAttribute("id", rootId);
          cloned.setAttribute("data-snippet-root", "true");
          await inlineSvgSprites(cloned, window.location.href);
          const html = serializeElementToHtml(cloned);
          const jsx = htmlToJsx(html);

          let thumbnail: string | undefined;
          try {
            thumbnail = await generateThumbnail(result.element);
          } catch (thumbnailError) {
            console.warn("Thumbnail generation failed, using fallback.", thumbnailError);
          }

          const renderContext = buildRenderContextFromElement(result.element);

          const baseBlock = buildBaseStyleBlock(result.element, rootId);
          const mediaBlock = extractMediaAndContainerRules(result.element, rootId);
          const styleBlock = [baseBlock, mediaBlock].filter(Boolean).join("");

          const capture: CapturedElementData = {
            html,
            jsx,
            width: result.width,
            height: result.height,
            elementLabel: result.label,
            thumbnail,
            renderContext,
            rootId,
            styleBlock: styleBlock || undefined
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
    });
  }

  return picker;
}

async function handleSave(capture: CapturedElementData): Promise<void> {
  try {
    const snippet = buildSnippetFromCapture(capture);
    await chrome.runtime.sendMessage({ type: "SAVE_SNIPPET", payload: snippet });
    showPageToast("Snippet saved");
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
    await chrome.runtime.sendMessage({ type: "SAVE_SNIPPET", payload: snippet });
    showPageToast("Snippet saved");
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
    format === "html"
      ? capture.styleBlock
        ? `<style>${capture.styleBlock}</style>${capture.html}`
        : capture.html
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
    ensurePicker().start();
    return;
  }

  if (message.type === "CANCEL_CAPTURE") {
    picker?.stop();
    modal?.destroy();
    modal = null;
  }
});
