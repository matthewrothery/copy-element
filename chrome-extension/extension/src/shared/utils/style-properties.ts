/**
 * Minimal property set from competitor analysis (DIVMAGIC_SNIPCSS_COMPARISON.md §8).
 * Used as the default whitelist for style extraction.
 */
export const CORE_VISUAL_PROPERTIES: string[] = [
  "display",
  "position",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "font-family",
  "font-size",
  "font-weight",
  "line-height",
  "letter-spacing",
  "text-align",
  "text-transform",
  "text-decoration",
  "color",
  "background",
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "background-repeat",
  "border",
  "border-top",
  "border-right",
  "border-bottom",
  "border-left",
  "box-sizing",
  "border-radius",
  "box-shadow",
  "opacity",
  "visibility",
  "width",
  "height",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "overflow",
  "overflow-x",
  "overflow-y",
  "flex",
  "flex-direction",
  "flex-wrap",
  "flex-grow",
  "flex-shrink",
  "flex-basis",
  "justify-content",
  "align-items",
  "align-self",
  "align-content",
  "order",
  "gap",
  "column-gap",
  "row-gap",
  "grid",
  "grid-area",
  "grid-auto-flow",
  "grid-column",
  "grid-row",
  "grid-template-columns",
  "grid-template-rows",
  "transform"
];

/**
 * Optional properties for extended/exact copy mode (dom-capture.mdc).
 * Not included in default extraction.
 */
export const EXTENDED_PROPERTIES: string[] = [
  "font",
  "vertical-align",
  "white-space",
  "word-wrap",
  "word-break",
  "text-shadow",
  "text-overflow",
  "outline",
  "resize",
  "filter",
  "clip-path",
  "object-fit",
  "object-position"
];

/**
 * Properties used by the style extractor. Defaults to minimal core set.
 */
export const VISUAL_STYLE_PROPERTIES: string[] = CORE_VISUAL_PROPERTIES;
