/**
 * Elements that should be skipped during element picker selection.
 * Includes our extension UI and SnipCSS-labeled elements (when both extensions run).
 */

const SNIPCSS_CLASS_PATTERN = /snipcss\d+-\d+-\d+-\d+/;

const EXTENSION_SELECTORS =
  "[data-element-capture-overlay], [data-element-capture-modal], [data-element-capture-toast]";

/**
 * Returns true if the element or any of its ancestors should be skipped
 * during element picker selection.
 */
export function shouldSkipElement(element: Element | null): boolean {
  if (!element) {
    return true;
  }

  if (element.closest(EXTENSION_SELECTORS)) {
    return true;
  }

  const className = typeof element.className === "string" ? element.className : "";
  if (SNIPCSS_CLASS_PATTERN.test(className)) {
    return true;
  }

  if (element.closest("[class*='snipcss']")) {
    return true;
  }

  return false;
}

const OVERLAY_POSITIONS = new Set(["fixed", "sticky"]);

/**
 * Returns true if the element uses a position that typically creates
 * overlay-like blocking behavior (fixed or sticky).
 */
export function isOverlayPosition(element: Element): boolean {
  const position = window.getComputedStyle(element).position;
  return OVERLAY_POSITIONS.has(position);
}
