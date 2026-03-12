import { SVG_NS } from "../constants";
import { replaceAssetsWithPlaceholders } from "./asset-replacer";

const SVG_PRESERVE_ATTRS = new Set([
  "viewbox",
  "viewBox",
  "xmlns",
  "xmlns:xlink",
  "preserveaspectratio",
  "preserveAspectRatio",
  "fill",
  "stroke",
  "href",
  "xlink:href",
  "cx",
  "cy",
  "r",
  "x",
  "y",
  "width",
  "height",
  "d",
  "transform",
  "id"
]);

function shouldSkipTag(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  return tagName === "script" || tagName === "noscript";
}

function shouldRemoveAttribute(name: string, element: Element): boolean {
  if (element.namespaceURI === SVG_NS) {
    const lower = name.toLowerCase();
    if (SVG_PRESERVE_ATTRS.has(name) || SVG_PRESERVE_ATTRS.has(lower)) {
      return false;
    }
  }
  const lower = name.toLowerCase();
  if (lower.startsWith("on")) {
    return true;
  }
  if (lower === "data-testid") {
    return true;
  }
  if (lower.startsWith("data-react")) {
    return true;
  }
  if (lower.startsWith("ng-") || lower.startsWith("data-ng-") || lower.startsWith("x-ng-")) {
    return true;
  }
  return false;
}

function sanitizeAttributes(clone: Element): void {
  const toRemove: string[] = [];
  for (const attr of Array.from(clone.attributes)) {
    if (shouldRemoveAttribute(attr.name, clone)) {
      toRemove.push(attr.name);
    }
  }
  toRemove.forEach((name) => clone.removeAttribute(name));
}

/**
 * Recursively sanitizes the cloned tree.
 * Removes event handlers, framework attributes, and skipped tags.
 */
function sanitizeTree(clone: Element): void {
  if (clone.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  sanitizeAttributes(clone);

  // Process children
  const children = Array.from(clone.children);
  for (const child of children) {
    if (shouldSkipTag(child)) {
      child.remove();
      continue;
    }
    sanitizeTree(child);
  }

  // Clear input/textarea values
  if (clone instanceof HTMLInputElement || clone instanceof HTMLTextAreaElement) {
    clone.textContent = "";
  }
}

/**
 * Clones an element tree, preserving class names and structure.
 * Sanitizes the clone by removing event handlers and framework attributes.
 * Does NOT inline styles - styles are extracted separately via stylesheet extraction.
 */
export function cloneElementTreeWithInlineStyles(
  element: HTMLElement,
  baseUrl: string
): HTMLElement {
  const clonedRoot = element.cloneNode(true) as HTMLElement;
  sanitizeTree(clonedRoot);
  return replaceAssetsWithPlaceholders(clonedRoot);
}
