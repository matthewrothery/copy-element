import type { CapturedElementData } from "../shared/types/snippet";

export function buildFallbackThumbnail(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" fill="#f8fafc"/><rect x="16" y="16" width="168" height="88" fill="#e5e7eb" rx="8"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export function getCaptureThumbnail(capture: CapturedElementData): string {
  if (capture.thumbnail && capture.thumbnail.trim().length > 0) {
    return capture.thumbnail;
  }

  return buildFallbackThumbnail();
}
