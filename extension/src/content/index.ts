import { cloneElementTreeWithInlineStyles } from "../shared/utils/dom-cloner";
import { serializeElementToHtml } from "../shared/utils/html-serializer";
import { htmlToJsx } from "../shared/utils/jsx-converter";
import { generateThumbnail } from "../shared/utils/thumbnail-generator";
import { ElementPicker } from "./element-picker";

let picker: ElementPicker | null = null;

function ensurePicker(): ElementPicker {
  if (!picker) {
    picker = new ElementPicker((result) => {
      try {
        const cloned = cloneElementTreeWithInlineStyles(result.element);
        const html = serializeElementToHtml(cloned);
        const jsx = htmlToJsx(html);
        void (async () => {
          let thumbnail: string | undefined;
          try {
            thumbnail = await generateThumbnail(result.element);
          } catch (thumbnailError) {
            console.warn("Thumbnail generation failed, using fallback.", thumbnailError);
          }

          try {
            await chrome.runtime.sendMessage({
              type: "ELEMENT_CAPTURED",
              payload: {
                html,
                jsx,
                width: result.width,
                height: result.height,
                elementLabel: result.label,
                thumbnail
              }
            });
          } catch (err) {
            console.error("Element capture failed: could not reach extension. Try again.", err);
          }
        })();
      } catch (error) {
        console.error("Failed to capture element", error);
      } finally {
        picker?.stop();
      }
    });
  }

  return picker;
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
  }
});
