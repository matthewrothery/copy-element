import { isExtensionUiElement } from "../constants";

const PSEUDO_ID_ATTR = "data-ea-id";
const PSEUDO_PROPS = [
  "content", "display", "position", "width", "height", "top", "right", "bottom", "left",
  "margin", "padding", "background-color", "background", "border", "border-radius",
  "color", "font-size", "font-weight", "font-family", "opacity", "transform",
  "z-index", "box-shadow", "overflow",
];
const SKIP_CONTENT = new Set(["", "none", "normal"]);

export function stampPseudoIds(root: Element): () => void {
  const elements = [root, ...root.querySelectorAll("*")].filter(
    (el) => !isExtensionUiElement(el)
  );
  elements.forEach((el, i) => el.setAttribute(PSEUDO_ID_ATTR, String(i)));
  return () => elements.forEach((el) => el.removeAttribute(PSEUDO_ID_ATTR));
}

export interface PseudoRule {
  selector: string;
  declarations: string;
}

export function extractPseudoElementRules(root: Element): PseudoRule[] {
  const rules: PseudoRule[] = [];
  const elements = [root, ...root.querySelectorAll("*")].filter(
    (el) => !isExtensionUiElement(el)
  );
  for (const el of elements) {
    const id = el.getAttribute(PSEUDO_ID_ATTR);
    if (!id) continue;
    for (const pseudo of ["::before", "::after"] as const) {
      const cs = window.getComputedStyle(el, pseudo);
      if (SKIP_CONTENT.has(cs.content)) continue;
      const declarations = PSEUDO_PROPS
        .map((p) => {
          const v = cs.getPropertyValue(p);
          return v ? `  ${p}: ${v};` : "";
        })
        .filter(Boolean)
        .join("\n");
      if (!declarations) continue;
      rules.push({ selector: `[${PSEUDO_ID_ATTR}="${id}"]${pseudo}`, declarations });
    }
  }
  return rules;
}
