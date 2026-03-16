/**
 * Shared constants for the extension.
 * Use createSvgElement or createElementNS(SVG_NS, tagName) for any SVG element creation.
 */

export const SVG_NS = "http://www.w3.org/2000/svg";

/** Placeholder for Copy Tailwind until Phase 8 converter is implemented. */
export const TAILWIND_COPY_PLACEHOLDER = "<!-- Tailwind conversion coming soon -->";

/** DataTransfer type for snippet drag-and-drop in Library. */
export const DRAG_TYPE_SNIPPET = "application/x-element-armory-snippet";

/** DataTransfer type for folder drag-and-drop in Library. */
export const DRAG_TYPE_FOLDER = "application/x-element-armory-folder";

/**
 * Creates an SVG element with the correct namespace.
 * Use this for any programmatic SVG element creation.
 */
export function createSvgElement(doc: Document, tagName: string): Element {
  return doc.createElementNS(SVG_NS, tagName);
}
