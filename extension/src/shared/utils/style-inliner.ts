import type { StyleMap } from "./style-extractor";

export function styleMapToInlineString(styleMap: StyleMap): string {
  return Object.entries(styleMap)
    .filter(([, value]) => value.trim().length > 0)
    .map(([property, value]) => `${property}:${value}`)
    .join(";");
}

export function applyInlineStyles(element: HTMLElement, styleMap: StyleMap): void {
  const styleString = styleMapToInlineString(styleMap);
  if (styleString.length === 0) {
    element.removeAttribute("style");
    return;
  }

  element.setAttribute("style", styleString);
}
