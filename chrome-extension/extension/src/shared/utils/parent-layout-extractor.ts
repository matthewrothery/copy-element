import type { InheritedTextContext, ParentLayoutContext, RenderContext } from "../types/snippet";
import { isDefaultValue } from "./style-defaults";

const LAYOUT_DISPLAYS = new Set([
  "flex",
  "inline-flex",
  "grid",
  "inline-grid"
]);

/** Display classification for layout parents. */
export type LayoutDisplayKind = "flex" | "grid";

const CSS_TO_CONTEXT_KEY: Record<string, keyof ParentLayoutContext> = {
  "flex-direction": "flexDirection",
  "flex-wrap": "flexWrap",
  "justify-content": "justifyContent",
  "align-items": "alignItems",
  "align-content": "alignContent",
  gap: "gap",
  "column-gap": "columnGap",
  "row-gap": "rowGap",
  "grid-template-columns": "gridTemplateColumns",
  "grid-template-rows": "gridTemplateRows",
  "grid-auto-flow": "gridAutoFlow",
  width: "width",
  "min-width": "minWidth",
  "max-width": "maxWidth",
  height: "height",
  "min-height": "minHeight",
  "max-height": "maxHeight"
};

const TRANSPARENT_COLOR_VALUES = new Set([
  "transparent",
  "rgba(0, 0, 0, 0)",
  "rgba(0,0,0,0)"
]);

const INHERITED_TEXT_PROP_MAP: Array<[string, keyof InheritedTextContext]> = [
  ["color", "color"],
  ["font-family", "fontFamily"],
  ["font-size", "fontSize"],
  ["font-weight", "fontWeight"],
  ["line-height", "lineHeight"],
  ["letter-spacing", "letterSpacing"],
  ["text-transform", "textTransform"],
  ["direction", "direction"]
];

function getComputedStyleValue(element: Element, property: string): string {
  const computed = window.getComputedStyle(element);
  return computed.getPropertyValue(property).trim();
}

function isLayoutParent(element: Element): boolean {
  const display = getComputedStyleValue(element, "display");
  return LAYOUT_DISPLAYS.has(display);
}

/**
 * Finds the nearest ancestor with flex or grid display.
 */
export function findNearestLayoutParent(element: Element): Element | null {
  let parent = element.parentElement;
  while (parent && parent !== document.body) {
    if (isLayoutParent(parent)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

function isTransparentColor(value: string): boolean {
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "");
  return (
    normalized.length === 0 ||
    TRANSPARENT_COLOR_VALUES.has(value.trim().toLowerCase()) ||
    normalized === "rgba(0,0,0,0)"
  );
}

function getAncestorChain(element: Element): Element[] {
  const chain: Element[] = [];
  let current: Element | null = element;

  while (current) {
    chain.push(current);
    if (current === document.documentElement) {
      break;
    }
    current = current.parentElement;
  }

  return chain;
}

function pickInheritedValue(
  chain: Element[],
  cssProperty: string,
  includeDefault: boolean
): string | undefined {
  for (const node of chain) {
    const value = getComputedStyleValue(node, cssProperty);
    if (value.length === 0) {
      continue;
    }
    if (includeDefault || !isDefaultValue(cssProperty, value)) {
      return value;
    }
  }
  return undefined;
}

function extractInheritedTextContext(element: Element): InheritedTextContext | undefined {
  const chain = getAncestorChain(element);
  const ctx: InheritedTextContext = {};

  for (const [cssProperty, contextKey] of INHERITED_TEXT_PROP_MAP) {
    if (cssProperty === "direction") {
      const direction = pickInheritedValue(chain, cssProperty, true);
      if (direction && direction !== "ltr") {
        ctx[contextKey] = direction;
      }
      continue;
    }

    const includeDefault =
      cssProperty === "color" ||
      cssProperty === "font-family" ||
      cssProperty === "font-size";
    const value = pickInheritedValue(chain, cssProperty, includeDefault);
    if (value) {
      ctx[contextKey] = value;
    }
  }

  return Object.keys(ctx).length > 0 ? ctx : undefined;
}

function resolveVisibleBackgroundColor(element: Element): string {
  const chainStart = element.parentElement ?? element;
  const chain = getAncestorChain(chainStart);

  for (const node of chain) {
    const bgColor = getComputedStyleValue(node, "background-color");
    if (!isTransparentColor(bgColor)) {
      return bgColor;
    }
  }

  return "#ffffff";
}

/**
 * Classifies layout display into flex or grid.
 */
export function getLayoutDisplayKind(display: string): LayoutDisplayKind {
  const d = display.trim().toLowerCase();
  return d === "grid" || d === "inline-grid" ? "grid" : "flex";
}

/**
 * Extracts minimal layout CSS from a parent element for preview fidelity.
 * Omits default values to keep context compact.
 */
export function extractParentLayoutContext(parent: Element): ParentLayoutContext {
  const computed = window.getComputedStyle(parent);
  const rawDisplay = computed.getPropertyValue("display").trim() || "flex";
  const ctx: ParentLayoutContext = { display: rawDisplay };

  for (const [cssProp, contextKey] of Object.entries(CSS_TO_CONTEXT_KEY)) {
    const value = computed.getPropertyValue(cssProp).trim();
    if (value.length > 0 && !isDefaultValue(cssProp, value)) {
      ctx[contextKey] = value;
    }
  }

  return ctx;
}

/**
 * Builds render context from the selected element including layout and ancestor visual context.
 */
export function buildRenderContextFromElement(element: Element): RenderContext | undefined {
  const layoutParent = findNearestLayoutParent(element);
  const parentLayout = layoutParent ? extractParentLayoutContext(layoutParent) : undefined;
  const inheritedText = extractInheritedTextContext(element);
  const visibleBackgroundColor = resolveVisibleBackgroundColor(element);

  if (!parentLayout && !inheritedText && !visibleBackgroundColor) {
    return undefined;
  }

  const renderContext: RenderContext = { visibleBackgroundColor };
  if (parentLayout) {
    renderContext.parentLayout = parentLayout;
  }
  if (inheritedText) {
    renderContext.inheritedText = inheritedText;
  }

  return renderContext;
}
