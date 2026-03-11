/**
 * Extracts CSS rules from page stylesheets that match captured elements.
 * Preserves original class-based styling instead of inlining computed styles.
 */

export interface ExtractedStylesheet {
  cssText: string;
  usedFontFamilies: Set<string>;
}

/**
 * Collects all elements in a subtree (including the root).
 */
function collectAllElements(root: Element): Element[] {
  const elements: Element[] = [root];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    elements.push(node as Element);
  }
  return elements;
}

/**
 * Checks if a selector matches any of the captured elements.
 * Handles pseudo-elements by stripping them for matching.
 */
function selectorMatchesAnyElement(selector: string, elements: Element[]): boolean {
  // Strip pseudo-elements and pseudo-classes for matching
  // We want to keep rules with ::before, ::after, :hover, etc.
  const baseSelector = selector
    .replace(/::(before|after|first-line|first-letter|selection|placeholder)/g, "")
    .replace(/:(hover|focus|active|visited|link|disabled|checked|enabled|first-child|last-child|nth-child\([^)]+\)|nth-of-type\([^)]+\))/g, "")
    .trim();

  if (!baseSelector) {
    return false;
  }

  try {
    return elements.some((el) => el.matches(baseSelector));
  } catch (e) {
    // Invalid selector, skip it
    return false;
  }
}

/**
 * Extracts font-family values from CSS text.
 */
function extractFontFamilies(cssText: string): Set<string> {
  const fontFamilies = new Set<string>();
  const fontFamilyRegex = /font-family\s*:\s*([^;]+)/gi;
  let match: RegExpExecArray | null;

  while ((match = fontFamilyRegex.exec(cssText)) !== null) {
    const value = match[1].trim();
    // Split by comma and clean up each font name
    const fonts = value.split(",").map((f) => f.trim().replace(/['"]/g, ""));
    fonts.forEach((font) => {
      if (font && font !== "inherit" && font !== "initial" && font !== "unset") {
        fontFamilies.add(font);
      }
    });
  }

  return fontFamilies;
}

/**
 * Processes a single CSS rule and adds it to the output if it matches.
 */
function processStyleRule(
  rule: CSSStyleRule,
  elements: Element[],
  collectedRules: string[],
  fontFamilies: Set<string>
): void {
  const selector = rule.selectorText;
  if (selectorMatchesAnyElement(selector, elements)) {
    const cssText = rule.cssText;
    collectedRules.push(cssText);
    
    // Extract font families from this rule
    const ruleFonts = extractFontFamilies(cssText);
    ruleFonts.forEach((font) => fontFamilies.add(font));
  }
}

/**
 * Recursively processes CSS rules, including those in @media, @container, and @supports.
 */
function processRuleList(
  rules: CSSRuleList,
  elements: Element[],
  collectedRules: string[],
  fontFamilies: Set<string>,
  mediaWrapper?: string
): void {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    if (rule instanceof CSSStyleRule) {
      if (mediaWrapper) {
        // If we're inside a media query, we need to wrap the rule
        const selector = rule.selectorText;
        if (selectorMatchesAnyElement(selector, elements)) {
          // We'll collect these separately and wrap them later
          const cssText = rule.cssText;
          collectedRules.push(cssText);
          
          const ruleFonts = extractFontFamilies(cssText);
          ruleFonts.forEach((font) => fontFamilies.add(font));
        }
      } else {
        processStyleRule(rule, elements, collectedRules, fontFamilies);
      }
    } else if (rule instanceof CSSMediaRule) {
      // Process media query rules
      const mediaRules: string[] = [];
      const mediaFonts = new Set<string>();
      processRuleList(rule.cssRules, elements, mediaRules, mediaFonts);
      
      if (mediaRules.length > 0) {
        // Wrap matched rules in the media query
        const mediaBlock = `@media ${rule.conditionText} {\n${mediaRules.join("\n")}\n}`;
        collectedRules.push(mediaBlock);
        mediaFonts.forEach((font) => fontFamilies.add(font));
      }
    } else if (rule.constructor.name === "CSSSupportsRule") {
      // Handle @supports rules (common for feature detection)
      const supportsRule = rule as any;
      const supportsRules: string[] = [];
      const supportsFonts = new Set<string>();
      processRuleList(supportsRule.cssRules, elements, supportsRules, supportsFonts);
      
      if (supportsRules.length > 0) {
        const supportsBlock = `@supports ${supportsRule.conditionText} {\n${supportsRules.join("\n")}\n}`;
        collectedRules.push(supportsBlock);
        supportsFonts.forEach((font) => fontFamilies.add(font));
      }
    } else if (rule.constructor.name === "CSSContainerRule") {
      // Handle @container rules (similar to media queries)
      const containerRule = rule as any;
      const containerRules: string[] = [];
      const containerFonts = new Set<string>();
      processRuleList(containerRule.cssRules, elements, containerRules, containerFonts);
      
      if (containerRules.length > 0) {
        const containerBlock = `@container ${containerRule.conditionText} {\n${containerRules.join("\n")}\n}`;
        collectedRules.push(containerBlock);
        containerFonts.forEach((font) => fontFamilies.add(font));
      }
    }
  }
}

/**
 * Extracts CSS rules from page stylesheets that match the captured element tree.
 */
export function extractMatchingRules(rootElement: Element): ExtractedStylesheet {
  const elements = collectAllElements(rootElement);
  const collectedRules: string[] = [];
  const fontFamilies = new Set<string>();

  // Walk through all stylesheets
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];

    try {
      // Skip cross-origin stylesheets (CORS restriction)
      if (!sheet.cssRules) {
        continue;
      }

      // Check if stylesheet has a media attribute
      const sheetMedia = sheet.media?.mediaText;
      const hasMediaCondition = sheetMedia && sheetMedia !== "" && sheetMedia !== "all";

      if (hasMediaCondition) {
        // Collect rules separately and wrap in @media block
        const mediaRules: string[] = [];
        const mediaFonts = new Set<string>();
        processRuleList(sheet.cssRules, elements, mediaRules, mediaFonts);
        
        if (mediaRules.length > 0) {
          const mediaBlock = `@media ${sheetMedia} {\n${mediaRules.join("\n")}\n}`;
          collectedRules.push(mediaBlock);
          mediaFonts.forEach((font) => fontFamilies.add(font));
        }
      } else {
        // Process normally
        processRuleList(sheet.cssRules, elements, collectedRules, fontFamilies);
      }
    } catch (e) {
      // Cross-origin stylesheet or other access error, skip it
      console.warn("Could not access stylesheet:", sheet.href, e);
      continue;
    }
  }

  // Also extract font families from inline styles on captured elements
  elements.forEach((el) => {
    if (el instanceof HTMLElement && el.style.fontFamily) {
      const inlineFonts = extractFontFamilies(`font-family: ${el.style.fontFamily}`);
      inlineFonts.forEach((font) => fontFamilies.add(font));
    }
  });

  return {
    cssText: collectedRules.join("\n\n"),
    usedFontFamilies: fontFamilies
  };
}
