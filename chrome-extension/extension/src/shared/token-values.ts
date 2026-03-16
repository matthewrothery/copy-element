/**
 * Raw token values for use in JS contexts (content script, capture overlay)
 * where CSS variables are not available.
 */
export const TOKEN_VALUES = {
  overlayHighlight: "rgba(59, 130, 246, 0.08)",
  overlayBorder: "#3b82f6",
  overlayShadow: "0 0 0 1px rgba(59, 130, 246, 0.24), 0 12px 20px -12px rgba(24, 29, 39, 0.5)",
  overlayRadius: "8px",
  tooltipBg: "#181d27",
  tooltipText: "#ffffff",
  tooltipBorder: "#252b37",
  toastBg: "#252b37",
  toastText: "#ffffff",
  fontSans: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  radiusSm: "8px",
  radiusFull: "9999px",
  space1: "4px",
  space2: "8px",
  space3: "12px",
  textXs: "12px"
} as const;
