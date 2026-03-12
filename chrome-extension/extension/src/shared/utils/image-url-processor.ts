/**
 * Processes img elements in a captured subtree: absolutizes URLs and optionally
 * replaces images with placeholder divs for portable snippet output.
 */

import { resolveUrl } from "./url-absolutizer";

const PLACEHOLDER_COLOR = "#d1d5db";

export interface ProcessImageUrlsOptions {
  replaceWithPlaceholder?: boolean;
}

function createPlaceholderForElement(
  source: HTMLImageElement,
  documentRef: Document
): HTMLDivElement {
  const rect = source.getBoundingClientRect();
  const placeholder = documentRef.createElement("div");
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  placeholder.setAttribute(
    "style",
    [
      `width:${width}px`,
      `height:${height}px`,
      `background:${PLACEHOLDER_COLOR}`,
      "display:block",
      "border-radius:4px"
    ].join(";")
  );
  placeholder.setAttribute("data-placeholder", "asset");
  return placeholder;
}

/**
 * Parses srcset attribute and absolutizes each URL.
 * Format: "url1 1x, url2 2x" or "url1 100w, url2 200w"
 */
function absolutizeSrcset(srcset: string, baseUrl: string): string {
  return srcset
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      const spaceIndex = trimmed.search(/\s/);
      const url = spaceIndex >= 0 ? trimmed.slice(0, spaceIndex).trim() : trimmed;
      const descriptor = spaceIndex >= 0 ? trimmed.slice(spaceIndex) : "";
      if (!url) return part;
      const absolutized = resolveUrl(url, baseUrl);
      return `${absolutized}${descriptor}`;
    })
    .join(", ");
}

/**
 * Processes all img elements in the root: absolutizes src/srcset, preserves alt.
 * When replaceWithPlaceholder is true, replaces img with placeholder divs.
 */
export function processImageUrls(
  root: HTMLElement,
  baseUrl: string,
  options?: ProcessImageUrlsOptions
): void {
  const imgs = Array.from(root.querySelectorAll("img"));

  for (const img of imgs) {
    if (options?.replaceWithPlaceholder) {
      const placeholder = createPlaceholderForElement(img, root.ownerDocument);
      img.replaceWith(placeholder);
      continue;
    }

    const src = img.getAttribute("src") ?? img.src ?? "";
    if (src) {
      img.setAttribute("src", resolveUrl(src, baseUrl));
    }

    const srcset = img.getAttribute("srcset");
    if (srcset) {
      img.setAttribute("srcset", absolutizeSrcset(srcset, baseUrl));
    }
  }
}
