import type { ParentLayoutContext } from "../types/snippet";

const LAYOUT_DISPLAYS = new Set([
  "flex",
  "inline-flex",
  "grid",
  "inline-grid"
]);

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

/**
 * Extracts minimal layout CSS from a parent element for preview fidelity.
 */
export function extractParentLayoutContext(parent: Element): ParentLayoutContext {
  const computed = window.getComputedStyle(parent);
  const ctx: ParentLayoutContext = {
    display: computed.getPropertyValue("display").trim() || "flex"
  };

  for (const [cssProp, contextKey] of Object.entries(CSS_TO_CONTEXT_KEY)) {
    const value = computed.getPropertyValue(cssProp).trim();
    if (value.length > 0) {
      ctx[contextKey] = value;
    }
  }

  return ctx;
}

/**
 * Builds render context from the selected element if it has a layout parent.
 */
export function buildRenderContextFromElement(element: Element): { parentLayout: ParentLayoutContext } | undefined {
  const layoutParent = findNearestLayoutParent(element);
  if (!layoutParent) return undefined;

  const parentLayout = extractParentLayoutContext(layoutParent);
  return { parentLayout };
}
