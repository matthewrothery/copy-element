import type { ParentLayoutContext, RenderContext } from "../types/snippet";
import { getLayoutDisplayKind } from "./parent-layout-extractor";

const CONTEXT_KEY_TO_CSS: Record<keyof ParentLayoutContext, string> = {
  display: "display",
  flexDirection: "flex-direction",
  flexWrap: "flex-wrap",
  justifyContent: "justify-content",
  alignItems: "align-items",
  alignContent: "align-content",
  gap: "gap",
  columnGap: "column-gap",
  rowGap: "row-gap",
  gridTemplateColumns: "grid-template-columns",
  gridTemplateRows: "grid-template-rows",
  gridAutoFlow: "grid-auto-flow",
  width: "width",
  minWidth: "min-width",
  maxWidth: "max-width",
  height: "height",
  minHeight: "min-height",
  maxHeight: "max-height"
};

function escapeStyleAttrValue(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

/**
 * Returns true when a layout wrapper is needed to preserve flex/grid context.
 * No wrapper when parentLayout is absent or when display is block.
 */
export function needsLayoutWrapper(renderContext: RenderContext | undefined): boolean {
  const parent = renderContext?.parentLayout;
  if (!parent?.display) return false;

  const kind = getLayoutDisplayKind(parent.display);
  return kind === "flex" || kind === "grid";
}

/**
 * Builds minimal inline style string for the layout wrapper div.
 * Only includes properties present in context; display is always included.
 */
export function buildLayoutWrapperStyle(parentLayout: ParentLayoutContext): string {
  const parts: string[] = [];

  for (const [key, cssProp] of Object.entries(CONTEXT_KEY_TO_CSS) as Array<
    [keyof ParentLayoutContext, string]
  >) {
    const value = parentLayout[key];
    if (value != null && value !== "") {
      parts.push(`${cssProp}:${escapeStyleAttrValue(value)}`);
    }
  }

  return parts.join(";");
}
