/**
 * Shared zoom/pan constants and helpers for preview viewports.
 * Used by capture-confirmation-modal (content script) and SnippetPreview (library).
 */

export const SCALE_MIN = 0.25;
export const SCALE_MAX = 2;
export const ZOOM_OUT_FACTOR = 0.8;
export const ZOOM_IN_FACTOR = 1.25;

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeFitScale(
  frameWidth: number,
  frameHeight: number,
  contentWidth: number,
  contentHeight: number
): number {
  const width = Math.max(contentWidth, 1);
  const height = Math.max(contentHeight, 1);
  const scaleW = frameWidth / width;
  const scaleH = frameHeight / height;
  return Math.min(scaleW, scaleH, 1);
}

export function getDistance(a: Touch, b: Touch): number {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

export function getMidpoint(a: Touch, b: Touch): { x: number; y: number } {
  return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}
