import { cloneElementTreeWithInlineStyles } from "../shared/utils/dom-cloner";
import { serializeElementToHtml } from "../shared/utils/html-serializer";
import { htmlToJsx } from "../shared/utils/jsx-converter";
import { ElementPicker } from "./element-picker";

let picker: ElementPicker | null = null;

function ensurePicker(): ElementPicker {
  if (!picker) {
    picker = new ElementPicker((result) => {
      try {
        const cloned = cloneElementTreeWithInlineStyles(result.element);
        const html = serializeElementToHtml(cloned);
        const jsx = htmlToJsx(html);

        void chrome.runtime.sendMessage({
          type: "ELEMENT_CAPTURED",
          payload: {
            html,
            jsx,
            width: result.width,
            height: result.height,
            elementLabel: result.label
          }
        });
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
