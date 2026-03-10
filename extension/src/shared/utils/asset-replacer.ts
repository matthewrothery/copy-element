const PLACEHOLDER_COLOR = "#d1d5db";

function createPlaceholderForElement(source: Element, documentRef: Document): HTMLDivElement {
  const rect = source.getBoundingClientRect();
  const placeholder = documentRef.createElement("div");
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  placeholder.setAttribute(
    "style",
    [
      `width:${width}px`,
      `height:${height}px`,
      `background:${PLACEHOLDER_COLOR}`,
      "display:block",
      "border-radius:4px"
    ].join(";")
  );
  placeholder.setAttribute("data-placeholder", "asset");
  return placeholder;
}

export function replaceAssetsWithPlaceholders(root: HTMLElement): HTMLElement {
  const selectors = "video,canvas,iframe";
  const assets = Array.from(root.querySelectorAll(selectors));

  assets.forEach((asset) => {
    const placeholder = createPlaceholderForElement(asset, root.ownerDocument);
    asset.replaceWith(placeholder);
  });

  return root;
}
