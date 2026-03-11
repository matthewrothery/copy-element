import type { StyleMap } from "./style-extractor";

const INHERITED_PROPERTIES = new Set([
  "color",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-transform",
  "text-decoration",
  "visibility"
]);

const MARGIN_PROPS = ["margin-top", "margin-right", "margin-bottom", "margin-left"] as const;
const PADDING_PROPS = ["padding-top", "padding-right", "padding-bottom", "padding-left"] as const;
const BORDER_PROPS = ["border-top", "border-right", "border-bottom", "border-left"] as const;

function combineBoxSides(
  map: StyleMap,
  longhand: readonly string[],
  shorthand: string
): { value: string; remove: string[] } | null {
  const values = longhand.map((p) => map[p]?.trim()).filter(Boolean);
  if (values.length !== 4) return null;

  const [t, r, b, l] = values;
  let value: string;
  if (t === r && r === b && b === l) {
    value = t!;
  } else if (t === b && l === r) {
    value = `${t} ${r}`;
  } else if (l === r) {
    value = `${t} ${r} ${b}`;
  } else {
    value = `${t} ${r} ${b} ${l}`;
  }
  return { value, remove: [...longhand] };
}

function combineBorderSides(map: StyleMap): { value: string; remove: string[] } | null {
  const values = BORDER_PROPS.map((p) => map[p]?.trim()).filter(Boolean);
  if (values.length !== 4) return null;

  const [top, right, bottom, left] = values;
  if (top === right && right === bottom && bottom === left) {
    return { value: top!, remove: [...BORDER_PROPS] };
  }
  return null;
}

/**
 * Combines longhand properties (margin, padding, border) into shorthand where possible.
 * Returns a new StyleMap with longhand removed when shorthand is used.
 */
export function minimizeStyleMap(map: StyleMap): StyleMap {
  const result = { ...map };

  const margin = combineBoxSides(result, MARGIN_PROPS, "margin");
  if (margin && !result.margin) {
    result.margin = margin.value;
    margin.remove.forEach((p) => delete result[p]);
  }

  const padding = combineBoxSides(result, PADDING_PROPS, "padding");
  if (padding && !result.padding) {
    result.padding = padding.value;
    padding.remove.forEach((p) => delete result[p]);
  }

  const border = combineBorderSides(result);
  if (border && !result.border) {
    result.border = border.value;
    border.remove.forEach((p) => delete result[p]);
  }

  return result;
}

function normalizeValueForComparison(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Removes inherited properties from child styles when they match the parent's computed value.
 * Reduces output size when children inherit without overriding.
 */
export function removeRedundantInheritedStyles(
  childStyles: StyleMap,
  parentComputed: CSSStyleDeclaration
): StyleMap {
  const result = { ...childStyles };
  for (const prop of INHERITED_PROPERTIES) {
    const childValue = result[prop];
    if (childValue === undefined) continue;
    const parentValue = parentComputed.getPropertyValue(prop).trim();
    if (parentValue && normalizeValueForComparison(childValue) === normalizeValueForComparison(parentValue)) {
      delete result[prop];
    }
  }
  return result;
}
