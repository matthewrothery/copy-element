import { replaceAssetsWithPlaceholders } from "./asset-replacer";
import { buildPseudoElementClone } from "./pseudo-element-extractor";
import { extractVisualStyles } from "./style-extractor";
import { applyInlineStyles } from "./style-inliner";

function shouldSkipTag(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  return tagName === "script" || tagName === "noscript";
}

function cloneWithInlineStyles(source: Element, documentRef: Document): HTMLElement {
  const clone = documentRef.createElement(source.tagName.toLowerCase());
  const sourceElement = source as HTMLElement;
  const sourceStyles = extractVisualStyles(source);

  applyInlineStyles(clone, sourceStyles);

  for (const attribute of Array.from(source.attributes)) {
    if (attribute.name.startsWith("on")) {
      continue;
    }
    if (attribute.name === "style") {
      continue;
    }
    clone.setAttribute(attribute.name, attribute.value);
  }

  const beforePseudo = buildPseudoElementClone(sourceElement, "::before", documentRef);
  if (beforePseudo) {
    clone.appendChild(beforePseudo);
  }

  const textNodes = Array.from(source.childNodes).filter((node) => node.nodeType === Node.TEXT_NODE);
  textNodes.forEach((node) => {
    const text = node.textContent ?? "";
    if (text.trim().length > 0) {
      clone.appendChild(documentRef.createTextNode(text));
    }
  });

  Array.from(source.children).forEach((child) => {
    if (shouldSkipTag(child)) {
      return;
    }

    const childClone = cloneWithInlineStyles(child, documentRef);
    clone.appendChild(childClone);
  });

  const afterPseudo = buildPseudoElementClone(sourceElement, "::after", documentRef);
  if (afterPseudo) {
    clone.appendChild(afterPseudo);
  }

  if (sourceElement instanceof HTMLInputElement || sourceElement instanceof HTMLTextAreaElement) {
    clone.textContent = "";
  }

  return clone;
}

export function cloneElementTreeWithInlineStyles(element: HTMLElement): HTMLElement {
  const clonedRoot = cloneWithInlineStyles(element, document);
  return replaceAssetsWithPlaceholders(clonedRoot);
}
