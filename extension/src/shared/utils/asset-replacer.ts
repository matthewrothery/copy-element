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
  const selectors = "img,svg,video,canvas,iframe";
  const assets = Array.from(root.querySelectorAll(selectors));

  assets.forEach((asset) => {
    const placeholder = createPlaceholderForElement(asset, root.ownerDocument);
    asset.replaceWith(placeholder);
  });

  const styledNodes = Array.from(root.querySelectorAll<HTMLElement>("[style]"));
  styledNodes.forEach((node) => {
    const inlineStyle = node.getAttribute("style");
    if (!inlineStyle || !inlineStyle.includes("background-image")) {
      return;
    }

    const sanitizedStyle = inlineStyle.replace(/background-image\s*:[^;]+;?/gi, "");
    node.setAttribute("style", `${sanitizedStyle};background:${PLACEHOLDER_COLOR}`.replace(/;;/g, ";"));
  });

  return root;
}
