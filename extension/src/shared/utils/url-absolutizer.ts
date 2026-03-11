/**
 * URL absolutization utilities for portable snippet output.
 * Converts relative URLs to absolute so captured HTML works when pasted elsewhere.
 */

import type { StyleMap } from "./style-extractor";

const URL_PROPERTIES = new Set(["background-image", "list-style-image"]);

/**
 * Resolves a URL against a base URL. Returns the original string on failure.
 * Data URLs and blob URLs are returned unchanged.
 */
export function resolveUrl(url: string, baseUrl: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }
  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return trimmed;
  }
}

const URL_REGEX = /url\s*\(\s*["']?([^"')]+)["']?\s*\)/g;

/**
 * Parses url() in a CSS value, absolutizes each URL, leaves other content unchanged.
 * Handles gradients (linear-gradient, radial-gradient, etc.) and multiple urls.
 */
export function absolutizeUrlsInCssValue(value: string, baseUrl: string): string {
  return value.replace(URL_REGEX, (match, urlPart) => {
    const absolutized = resolveUrl(urlPart.trim(), baseUrl);
    return `url("${absolutized}")`;
  });
}

/**
 * Transforms style map for portability by absolutizing URLs in url-containing properties.
 */
export function transformStyleMapForPortability(
  styles: StyleMap,
  baseUrl: string
): StyleMap {
  const result: StyleMap = {};
  for (const [property, value] of Object.entries(styles)) {
    const kebab = property.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
    if (URL_PROPERTIES.has(kebab)) {
      result[property] = absolutizeUrlsInCssValue(value, baseUrl);
    } else {
      result[property] = value;
    }
  }
  return result;
}
