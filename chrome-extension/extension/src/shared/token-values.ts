/**
 * Raw token values for use in JS contexts (content script, capture overlay)
 * where CSS variables are not available.
 */
export const TOKEN_VALUES = {
  overlayHighlight: "rgba(59, 130, 246, 0.08)",
  overlayBorder: "#3b82f6",
  tooltipBg: "#181d27",
  tooltipText: "#ffffff",
  fontSans: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  radiusSm: "6px",
  space1: "4px",
  space2: "8px"
} as const;
