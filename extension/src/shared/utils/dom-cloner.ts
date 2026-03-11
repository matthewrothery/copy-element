import { SVG_NS } from "../constants";
import { replaceAssetsWithPlaceholders } from "./asset-replacer";
import { buildPseudoElementClone } from "./pseudo-element-extractor";
import { extractVisualStyles } from "./style-extractor";
import { applyInlineStyles } from "./style-inliner";
import {
  minimizeStyleMap,
  removeRedundantInheritedStyles
} from "./style-minimizer";
import { transformStyleMapForPortability } from "./url-absolutizer";

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

function isAbsoluteOrFixed(element: HTMLElement): boolean {
  const position =
    element.style.position || window.getComputedStyle(element).getPropertyValue("position").trim();
  return position === "absolute" || position === "fixed";
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

function sanitizeAndApplyStyles(
  original: Element,
  clone: Element,
  documentRef: Document,
  parent: Element | null,
  baseUrl: string
): void {
  if (original.nodeType !== Node.ELEMENT_NODE || clone.nodeType !== Node.ELEMENT_NODE) {
    return;
  }

  const originalEl = original as HTMLElement;
  const cloneEl = clone as HTMLElement;

  sanitizeAttributes(cloneEl);

  const sourceStyles = extractVisualStyles(originalEl);
  let portableStyles = transformStyleMapForPortability(sourceStyles, baseUrl);
  portableStyles = minimizeStyleMap(portableStyles);
  if (parent) {
    const parentComputed = window.getComputedStyle(parent);
    portableStyles = removeRedundantInheritedStyles(portableStyles, parentComputed);
  }
  applyInlineStyles(cloneEl, portableStyles);

  const origChildren = Array.from(original.childNodes);
  const cloneChildren = Array.from(clone.childNodes);

  // Text nodes are preserved in clone but not processed (no getComputedStyle).
  // They inherit typography and color from their parent element.
  const beforePseudo = buildPseudoElementClone(originalEl, "::before", documentRef);
  const afterPseudo = buildPseudoElementClone(originalEl, "::after", documentRef);

  const hasAbsolutePseudo =
    (beforePseudo && isAbsoluteOrFixed(beforePseudo)) ||
    (afterPseudo && isAbsoluteOrFixed(afterPseudo));
  if (hasAbsolutePseudo) {
    const clonePosition =
      cloneEl.style.position || window.getComputedStyle(cloneEl).getPropertyValue("position").trim();
    if (clonePosition === "static" || !clonePosition) {
      cloneEl.style.position = "relative";
    }
  }

  if (beforePseudo) {
    cloneEl.insertBefore(beforePseudo, cloneEl.firstChild);
  }

  for (let i = 0; i < origChildren.length; i++) {
    const origChild = origChildren[i];
    const cloneChild = cloneChildren[i];

    if (origChild.nodeType === Node.ELEMENT_NODE) {
      const origElement = origChild as Element;
      if (shouldSkipTag(origElement)) {
        cloneChild.remove();
        continue;
      }
      sanitizeAndApplyStyles(origElement, cloneChild as Element, documentRef, originalEl, baseUrl);
    }
  }

  if (afterPseudo) {
    cloneEl.appendChild(afterPseudo);
  }

  if (originalEl instanceof HTMLInputElement || originalEl instanceof HTMLTextAreaElement) {
    cloneEl.textContent = "";
  }
}

export function cloneElementTreeWithInlineStyles(
  element: HTMLElement,
  baseUrl: string
): HTMLElement {
  const clonedRoot = element.cloneNode(true) as HTMLElement;
  sanitizeAndApplyStyles(element, clonedRoot, document, null, baseUrl);
  return replaceAssetsWithPlaceholders(clonedRoot);
}
