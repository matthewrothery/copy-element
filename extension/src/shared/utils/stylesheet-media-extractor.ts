import { VISUAL_STYLE_PROPERTIES } from "./style-properties";

const ALLOWED_PROPERTIES = new Set(VISUAL_STYLE_PROPERTIES);

/**
 * Extracts @media and @container rules from page stylesheets that match the element.
 * Cross-origin stylesheets are skipped (cssRules access throws).
 */
export function extractMediaAndContainerRules(
  element: Element,
  rootId: string
): string {
  const mediaBlocks: Map<string, string[]> = new Map();
  const containerBlocks: Map<string, string[]> = new Map();

  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    collectMatchingRules(element, rules, rootId, mediaBlocks, containerBlocks);
  }

  const parts: string[] = [];
  for (const [query, decls] of mediaBlocks) {
    if (decls.length > 0) {
      parts.push(`@media ${query}{#${escapeId(rootId)}{${decls.join(";")}}}`);
    }
  }
  for (const [query, decls] of containerBlocks) {
    if (decls.length > 0) {
      parts.push(`@container ${query}{#${escapeId(rootId)}{${decls.join(";")}}}`);
    }
  }
  return parts.join("");
}

function collectMatchingRules(
  element: Element,
  rules: CSSRuleList,
  rootId: string,
  mediaBlocks: Map<string, string[]>,
  containerBlocks: Map<string, string[]>,
  mediaQuery = "",
  containerQuery = ""
): void {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSMediaRule) {
      const query = rule.media.mediaText;
      if (query) {
        collectMatchingRules(
          element,
          rule.cssRules,
          rootId,
          mediaBlocks,
          containerBlocks,
          query,
          containerQuery
        );
      }
    } else if (isContainerRule(rule)) {
      const query = (rule as { conditionText?: string }).conditionText ?? "";
      if (query) {
        collectMatchingRules(
          element,
          (rule as CSSGroupingRule).cssRules,
          rootId,
          mediaBlocks,
          containerBlocks,
          mediaQuery,
          query
        );
      }
    } else if (rule instanceof CSSStyleRule) {
      if (!selectorMatchesElement(rule.selectorText, element)) {
        continue;
      }
      const decls = extractAllowedDeclarations(rule.style);
      if (decls.length === 0) continue;

      if (containerQuery) {
        const key = containerQuery;
        const list = containerBlocks.get(key) ?? [];
        list.push(...decls);
        containerBlocks.set(key, list);
      } else if (mediaQuery) {
        const key = mediaQuery;
        const list = mediaBlocks.get(key) ?? [];
        list.push(...decls);
        mediaBlocks.set(key, list);
      }
    }
  }
}

function isContainerRule(rule: CSSRule): boolean {
  const CONTAINER_RULE = 15;
  return rule.type === CONTAINER_RULE;
}

function selectorMatchesElement(selector: string, element: Element): boolean {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^-/, "");
}

function extractAllowedDeclarations(style: CSSStyleDeclaration): string[] {
  const result: string[] = [];
  for (let i = 0; i < style.length; i++) {
    const prop = style[i];
    const cssProp = prop.startsWith("--") ? prop : camelToKebab(prop);
    if (ALLOWED_PROPERTIES.has(cssProp)) {
      const value = style.getPropertyValue(prop).replace(/!important\s*$/gi, "").trim();
      if (value) {
        result.push(`${cssProp}:${value}`);
      }
    }
  }
  return result;
}

function escapeId(id: string): string {
  return CSS.escape(id);
}
