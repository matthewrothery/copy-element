/**
 * Parse a CSS length (e.g. "10px", "0") to a number in pixels.
 */
function parsePx(value: string): number {
  if (!value || value === "0") return 0;
  const num = parseFloat(value);
  return Number.isNaN(num) ? 0 : num;
}

/**
 * Content-area offset (border + padding) for the left edge of a frame element in the parent viewport.
 */
function frameContentOffsetLeft(frameEl: Element): number {
  const cs = frameEl.ownerDocument.defaultView?.getComputedStyle(frameEl);
  if (!cs) return 0;
  const border = parsePx(cs.getPropertyValue("border-left-width"));
  const padding = parsePx(cs.getPropertyValue("padding-left"));
  return border + padding;
}

/**
 * Content-area offset (border + padding) for the top edge of a frame element in the parent viewport.
 */
function frameContentOffsetTop(frameEl: Element): number {
  const cs = frameEl.ownerDocument.defaultView?.getComputedStyle(frameEl);
  if (!cs) return 0;
  const border = parsePx(cs.getPropertyValue("border-top-width"));
  const padding = parsePx(cs.getPropertyValue("padding-top"));
  return border + padding;
}

/**
 * Resolve the iframe element for window w from the parent document (contentWindow match).
 * Fallback to window.frameElement when parent search fails.
 */
function getFrameElement(w: Window): Element | null {
  try {
    const parent = w.parent;
    if (parent === w) return null;
    const frameElement = (w as Window & { frameElement?: Element }).frameElement;
    const iframes = parent.document.getElementsByTagName("iframe");
    for (let i = 0; i < iframes.length; i++) {
      const iframe = iframes[i];
      if (iframe.contentWindow === w) {
        return iframe;
      }
    }
    return frameElement ?? null;
  } catch {
    return (w as Window & { frameElement?: Element }).frameElement ?? null;
  }
}

/**
 * Map element rect to top-level viewport coordinates by walking the iframe chain.
 * Uses each iframe's content-area offset (border + padding) so element coords match the captured viewport.
 * Returns ok: false when cross-origin blocks access (do not use for thumbnail crop).
 */
export function getElementRectInTopViewport(element: Element): {
  cropLeft: number;
  cropTop: number;
  cropWidth: number;
  cropHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  ok: boolean;
} {
  const rect = element.getBoundingClientRect();
  let left = rect.left;
  let top = rect.top;
  const width = rect.width;
  const height = rect.height;
  let viewportWidth = window.innerWidth;
  let viewportHeight = window.innerHeight;
  try {
    let w: Window = window;
    while (w !== w.parent) {
      const frameEl = getFrameElement(w);
      if (!frameEl) break;
      const frameRect = frameEl.getBoundingClientRect();
      left += frameRect.left + frameContentOffsetLeft(frameEl);
      top += frameRect.top + frameContentOffsetTop(frameEl);
      w = w.parent;
      viewportWidth = w.innerWidth;
      viewportHeight = w.innerHeight;
    }
    return {
      cropLeft: left,
      cropTop: top,
      cropWidth: width,
      cropHeight: height,
      viewportWidth,
      viewportHeight,
      ok: true
    };
  } catch {
    return {
      cropLeft: rect.left,
      cropTop: rect.top,
      cropWidth: width,
      cropHeight: height,
      viewportWidth,
      viewportHeight,
      ok: false
    };
  }
}
