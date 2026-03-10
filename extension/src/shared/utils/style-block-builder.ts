import { extractVisualStyles } from "./style-extractor";
import { styleMapToInlineString } from "./style-inliner";

/**
 * Builds a base CSS rule block for the root element from computed styles.
 * Used as the foundation for the snippet style block (merged with @media rules).
 */
export function buildBaseStyleBlock(rootElement: Element, rootId: string): string {
  const styles = extractVisualStyles(rootElement);
  const declarations = styleMapToInlineString(styles);
  if (declarations.length === 0) {
    return "";
  }
  const selector = `#${escapeSelectorId(rootId)}`;
  return `${selector}{${declarations}}`;
}

function escapeSelectorId(id: string): string {
  return CSS.escape(id);
}
