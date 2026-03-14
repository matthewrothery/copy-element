/**
 * Shared constants for the extension.
 * Use createSvgElement or createElementNS(SVG_NS, tagName) for any SVG element creation.
 */

export const SVG_NS = "http://www.w3.org/2000/svg";

/** Placeholder for Copy Tailwind until Phase 8 converter is implemented. */
export const TAILWIND_COPY_PLACEHOLDER = "<!-- Tailwind conversion coming soon -->";

/**
 * Creates an SVG element with the correct namespace.
 * Use this for any programmatic SVG element creation.
 */
export function createSvgElement(doc: Document, tagName: string): Element {
  return doc.createElementNS(SVG_NS, tagName);
}
