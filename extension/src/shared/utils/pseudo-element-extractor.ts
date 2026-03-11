import { isDefaultValue } from "./style-defaults";
import { VISUAL_STYLE_PROPERTIES } from "./style-properties";
import { applyInlineStyles } from "./style-inliner";
import type { StyleMap } from "./style-extractor";

type PseudoElementType = "::before" | "::after";

type ParsedContent = { type: "text"; value: string } | { type: "url"; value: string } | null;

function parsePseudoContent(content: string): ParsedContent {
  const normalized = content.trim();
  if (normalized.length === 0 || normalized === "none" || normalized === "normal") {
    return null;
  }

  const urlMatch = normalized.match(/^url\s*\(\s*["']?([^"')]+)["']?\s*\)$/i);
  if (urlMatch) {
    return { type: "url", value: urlMatch[1].trim() };
  }

  const quotedMatch = normalized.match(/^(['"])([\s\S]*)\1$/);
  const text = quotedMatch
    ? quotedMatch[2]
        .replace(/\\a\s?/gi, "\n")
        .replace(/\\(['"])/g, "$1")
        .replace(/\\\\/g, "\\")
    : normalized;

  return { type: "text", value: text };
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
  const pseudoStyles = extractPseudoStyles(sourceElement, pseudo);
  const computed = window.getComputedStyle(sourceElement, pseudo);
  const content = parsePseudoContent(computed.getPropertyValue("content"));

  const hasVisualStyles = Object.keys(pseudoStyles).length > 0;
  if (content === null && !hasVisualStyles) {
    return null;
  }

  let pseudoNode: HTMLElement;
  if (content?.type === "url") {
    pseudoNode = documentRef.createElement("img");
    pseudoNode.setAttribute("src", content.value);
  } else {
    pseudoNode = documentRef.createElement("span");
    if (content?.type === "text" && content.value.length > 0) {
      pseudoNode.textContent = content.value;
    }
  }

  applyInlineStyles(pseudoNode, pseudoStyles);
  pseudoNode.setAttribute("data-pseudo-element", pseudo);
  pseudoNode.setAttribute("aria-hidden", "true");
  return pseudoNode;
}
