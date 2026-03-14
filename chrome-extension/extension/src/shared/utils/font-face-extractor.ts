import { getAccessibleCssRules } from "./stylesheet-access";

/**
 * Extracts @font-face rules for fonts used in captured elements.
 * Converts relative URLs to absolute URLs for portability.
 */

/**
 * Normalizes font family names for comparison.
 * Removes quotes and normalizes whitespace.
 */
function normalizeFontFamily(fontFamily: string): string {
  return fontFamily
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Checks if a font-face family matches any of the used fonts.
 */
function fontFaceMatchesUsedFonts(
  fontFaceFamily: string,
  usedFontFamilies: Set<string>
): boolean {
  const normalizedFontFace = normalizeFontFamily(fontFaceFamily);
  
  for (const usedFont of usedFontFamilies) {
    const normalizedUsed = normalizeFontFamily(usedFont);
    if (normalizedFontFace === normalizedUsed) {
      return true;
    }
  }
  
  return false;
}

/**
 * Converts relative URLs in @font-face src to absolute URLs.
 */
function absolutizeFontFaceSrc(cssText: string, baseUrl: string): string {
  // Match url() in src property
  return cssText.replace(
    /url\s*\(\s*(['"]?)([^'")\s]+)\1\s*\)/gi,
    (match, quote, url) => {
      try {
        const absoluteUrl = new URL(url, baseUrl).href;
        return `url(${quote}${absoluteUrl}${quote})`;
      } catch (e) {
        // If URL parsing fails, return original
        return match;
      }
    }
  );
}

/**
 * Extracts the font-family value from a @font-face rule.
 */
function extractFontFamilyFromRule(rule: CSSFontFaceRule): string | null {
  const style = rule.style;
  const fontFamily = style.getPropertyValue("font-family");
  return fontFamily || null;
}

/**
 * Recursively processes CSS rules to find @font-face declarations.
 * Handles nested rules like @supports, @media, @layer.
 */
function processRulesForFontFaces(
  rules: CSSRuleList,
  usedFontFamilies: Set<string>,
  baseUrl: string,
  fontFaceRules: string[],
  wrapper?: string
): void {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    if (rule instanceof CSSFontFaceRule) {
      const fontFamily = extractFontFamilyFromRule(rule);
      
      if (fontFamily && fontFaceMatchesUsedFonts(fontFamily, usedFontFamilies)) {
        const cssText = absolutizeFontFaceSrc(rule.cssText, baseUrl);
        
        if (wrapper) {
          // If inside a conditional block, we need to wrap it
          fontFaceRules.push(`${wrapper} {\n${cssText}\n}`);
        } else {
          fontFaceRules.push(cssText);
        }
      }
    } else if (rule instanceof CSSMediaRule) {
      // Recursively process @media rules
      processRulesForFontFaces(
        rule.cssRules,
        usedFontFamilies,
        baseUrl,
        fontFaceRules,
        `@media ${rule.conditionText}`
      );
    } else if (rule.constructor.name === "CSSSupportsRule") {
      // Handle @supports rules (common for variable fonts)
      const supportsRule = rule as any;
      processRulesForFontFaces(
        supportsRule.cssRules,
        usedFontFamilies,
        baseUrl,
        fontFaceRules,
        `@supports ${supportsRule.conditionText}`
      );
    } else if (rule.constructor.name === "CSSLayerBlockRule") {
      // Handle @layer rules
      const layerRule = rule as any;
      const layerName = layerRule.name || "";
      processRulesForFontFaces(
        layerRule.cssRules,
        usedFontFamilies,
        baseUrl,
        fontFaceRules,
        layerName ? `@layer ${layerName}` : "@layer"
      );
    } else if (rule.constructor.name === "CSSLayerStatementRule") {
      // No-op: @layer statements only declare order, they do not contain @font-face rules.
      continue;
    }
  }
}

/**
 * Extracts @font-face rules for fonts used in the captured elements.
 * Returns CSS text with absolute URLs.
 * Recursively searches nested rules like @supports, @media, @layer.
 */
export async function extractUsedFontFaces(
  usedFontFamilies: Set<string>,
  baseUrl: string
): Promise<string> {
  if (usedFontFamilies.size === 0) {
    return "";
  }

  const fontFaceRules: string[] = [];

  // Walk through all stylesheets
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i] as CSSStyleSheet;
    let cleanup: (() => void) | undefined;

    try {
      const accessible = await getAccessibleCssRules(sheet);
      if (!accessible) {
        console.warn("Could not access stylesheet for font-face extraction:", sheet.href);
        continue;
      }
      cleanup = accessible.cleanup;

      // Recursively process all rules
      processRulesForFontFaces(accessible.rules, usedFontFamilies, baseUrl, fontFaceRules);
    } catch (e) {
      // Cross-origin stylesheet or other access error, skip it
      console.warn("Could not access stylesheet for font-face extraction:", sheet.href, e);
      continue;
    } finally {
      cleanup?.();
    }
  }

  return fontFaceRules.join("\n\n");
}
