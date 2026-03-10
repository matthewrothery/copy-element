import { isDefaultValue } from "./style-defaults";
import { VISUAL_STYLE_PROPERTIES } from "./style-properties";
import { applyInlineStyles } from "./style-inliner";
import type { StyleMap } from "./style-extractor";

type PseudoElementType = "::before" | "::after";

function parsePseudoContent(content: string): string | null {
  const normalized = content.trim();
  if (normalized.length === 0 || normalized === "none" || normalized === "normal") {
    return null;
  }

  const quotedMatch = normalized.match(/^(['"])([\s\S]*)\1$/);
  if (!quotedMatch) {
    return normalized;
  }

  return quotedMatch[2]
    .replace(/\\a\s?/gi, "\n")
    .replace(/\\(['"])/g, "$1")
    .replace(/\\\\/g, "\\");
}

function extractPseudoStyles(element: HTMLElement, pseudo: PseudoElementType): StyleMap {
  const computed = window.getComputedStyle(element, pseudo);
  const styles: StyleMap = {};

  for (const property of VISUAL_STYLE_PROPERTIES) {
    const value = computed.getPropertyValue(property).trim();
    if (value.length > 0 && !isDefaultValue(property, value)) {
      styles[property] = value;
    }
  }

  return styles;
}

export function buildPseudoElementClone(
  sourceElement: HTMLElement,
  pseudo: PseudoElementType,
  documentRef: Document
): HTMLElement | null {
  const computed = window.getComputedStyle(sourceElement, pseudo);
  const content = parsePseudoContent(computed.getPropertyValue("content"));
  if (content === null) {
    return null;
  }

  const pseudoNode = documentRef.createElement("span");
  const pseudoStyles = extractPseudoStyles(sourceElement, pseudo);
  applyInlineStyles(pseudoNode, pseudoStyles);

  if (content.length > 0) {
    pseudoNode.textContent = content;
  }

  pseudoNode.setAttribute("data-pseudo-element", pseudo);
  pseudoNode.setAttribute("aria-hidden", "true");
  return pseudoNode;
}
