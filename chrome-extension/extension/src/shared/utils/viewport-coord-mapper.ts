/**
 * Map element rect to top-level viewport coordinates by walking the iframe chain.
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
      const frameEl = (w as Window & { frameElement?: Element }).frameElement;
      if (!frameEl) break;
      const frameRect = frameEl.getBoundingClientRect();
      left += frameRect.left;
      top += frameRect.top;
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
