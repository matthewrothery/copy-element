import type {
  InheritedTextContext,
  ParentLayoutContext,
  RenderContext
} from "../types/snippet";
import { getLayoutDisplayKind } from "./parent-layout-extractor";
import { isDefaultValue } from "./style-defaults";

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

const INHERITED_TEXT_KEY_TO_CSS: Record<keyof InheritedTextContext, string> = {
  color: "color",
  fontFamily: "font-family",
  fontSize: "font-size",
  fontWeight: "font-weight",
  lineHeight: "line-height",
  letterSpacing: "letter-spacing",
  textTransform: "text-transform",
  direction: "direction"
};

/**
 * Returns true when a layout wrapper is needed to preserve flex/grid context.
 * No wrapper when parentLayout is absent or when display is block.
 */
export function needsLayoutWrapper(renderContext: RenderContext | undefined): boolean {
  const parent = renderContext?.parentLayout;
  if (parent?.display) {
    const kind = getLayoutDisplayKind(parent.display);
    if (kind === "flex" || kind === "grid") {
      return true;
    }
  }

  const hasInheritedText = Boolean(
    renderContext?.inheritedText && Object.keys(renderContext.inheritedText).length > 0
  );
  const hasVisibleBackground = Boolean(renderContext?.visibleBackgroundColor);

  return hasInheritedText || hasVisibleBackground;
}

/**
 * Builds minimal inline style string for the layout wrapper div.
 * Includes layout + inherited visual context while omitting defaults where safe.
 */
export function buildLayoutWrapperStyle(
  parentLayout?: ParentLayoutContext,
  inheritedText?: InheritedTextContext,
  visibleBackgroundColor?: string
): string {
  const parts: string[] = [];

  if (parentLayout) {
    for (const [key, cssProp] of Object.entries(CONTEXT_KEY_TO_CSS) as Array<
      [keyof ParentLayoutContext, string]
    >) {
      const value = parentLayout[key];
      if (value != null && value !== "") {
        parts.push(`${cssProp}:${value}`);
      }
    }
  }

  if (inheritedText) {
    for (const [key, cssProp] of Object.entries(INHERITED_TEXT_KEY_TO_CSS) as Array<
      [keyof InheritedTextContext, string]
    >) {
      const value = inheritedText[key];
      if (value && !isDefaultValue(cssProp, value)) {
        parts.push(`${cssProp}:${value}`);
      }
    }
  }

  if (visibleBackgroundColor && !isDefaultValue("background-color", visibleBackgroundColor)) {
    parts.push(`background-color:${visibleBackgroundColor}`);
  }

  return parts.join(";");
}
