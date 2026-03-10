import { isDefaultValue } from "./style-defaults";
import { VISUAL_STYLE_PROPERTIES } from "./style-properties";

export type StyleMap = Record<string, string>;

export function extractVisualStyles(element: Element): StyleMap {
  const computed = window.getComputedStyle(element);
  const styles: StyleMap = {};

  for (const property of VISUAL_STYLE_PROPERTIES) {
    const value = computed.getPropertyValue(property).trim();
    if (value.length > 0 && !isDefaultValue(property, value)) {
      styles[property] = value;
    }
  }

  return styles;
}
