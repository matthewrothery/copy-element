/**
 * Extracts CSS rules from page stylesheets that match captured elements.
 * Preserves original class-based styling instead of inlining computed styles.
 */

export interface ExtractedStylesheet {
  cssText: string;
  usedFontFamilies: Set<string>;
  usedAnimationNames: Set<string>;
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
 * Extracts animation names from a CSS style (animation-name or animation shorthand).
 */
function extractAnimationNames(style: CSSStyleDeclaration): Set<string> {
  const names = new Set<string>();
  const value = style.getPropertyValue("animation-name").trim();
  if (!value) {
    return names;
  }
  value.split(",").forEach((s) => {
    const name = s.trim();
    if (name && name !== "none") {
      names.add(name);
    }
  });
  return names;
}

/**
 * Processes a single CSS rule and adds it to the output if it matches.
 */
function processStyleRule(
  rule: CSSStyleRule,
  elements: Element[],
  collectedRules: string[],
  fontFamilies: Set<string>,
  animationNames: Set<string>
): void {
  const selector = rule.selectorText;
  if (selectorMatchesAnyElement(selector, elements)) {
    const cssText = rule.cssText;
    collectedRules.push(cssText);

    const ruleFonts = extractFontFamilies(cssText);
    ruleFonts.forEach((font) => fontFamilies.add(font));

    const ruleAnimations = extractAnimationNames(rule.style);
    ruleAnimations.forEach((name) => animationNames.add(name));
  }
}

/**
 * Recursively processes CSS rules, including those in @media, @container, @supports, and @layer.
 */
function processRuleList(
  rules: CSSRuleList,
  elements: Element[],
  collectedRules: string[],
  fontFamilies: Set<string>,
  animationNames: Set<string>,
  mediaWrapper?: string
): void {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    if (rule instanceof CSSStyleRule) {
      if (mediaWrapper) {
        const selector = rule.selectorText;
        if (selectorMatchesAnyElement(selector, elements)) {
          const cssText = rule.cssText;
          collectedRules.push(cssText);
          const ruleFonts = extractFontFamilies(cssText);
          ruleFonts.forEach((font) => fontFamilies.add(font));
          const ruleAnimations = extractAnimationNames(rule.style);
          ruleAnimations.forEach((name) => animationNames.add(name));
        }
      } else {
        processStyleRule(rule, elements, collectedRules, fontFamilies, animationNames);
      }
    } else if (rule instanceof CSSMediaRule) {
      const mediaRules: string[] = [];
      const mediaFonts = new Set<string>();
      const mediaAnimations = new Set<string>();
      processRuleList(rule.cssRules, elements, mediaRules, mediaFonts, mediaAnimations);

      if (mediaRules.length > 0) {
        const mediaBlock = `@media ${rule.conditionText} {\n${mediaRules.join("\n")}\n}`;
        collectedRules.push(mediaBlock);
        mediaFonts.forEach((font) => fontFamilies.add(font));
        mediaAnimations.forEach((name) => animationNames.add(name));
      }
    } else if (rule.constructor.name === "CSSSupportsRule") {
      const supportsRule = rule as { conditionText: string; cssRules: CSSRuleList };
      const supportsRules: string[] = [];
      const supportsFonts = new Set<string>();
      const supportsAnimations = new Set<string>();
      processRuleList(
        supportsRule.cssRules,
        elements,
        supportsRules,
        supportsFonts,
        supportsAnimations
      );

      if (supportsRules.length > 0) {
        const supportsBlock = `@supports ${supportsRule.conditionText} {\n${supportsRules.join("\n")}\n}`;
        collectedRules.push(supportsBlock);
        supportsFonts.forEach((font) => fontFamilies.add(font));
        supportsAnimations.forEach((name) => animationNames.add(name));
      }
    } else if (rule.constructor.name === "CSSContainerRule") {
      const containerRule = rule as { conditionText: string; cssRules: CSSRuleList };
      const containerRules: string[] = [];
      const containerFonts = new Set<string>();
      const containerAnimations = new Set<string>();
      processRuleList(
        containerRule.cssRules,
        elements,
        containerRules,
        containerFonts,
        containerAnimations
      );

      if (containerRules.length > 0) {
        const containerBlock = `@container ${containerRule.conditionText} {\n${containerRules.join("\n")}\n}`;
        collectedRules.push(containerBlock);
        containerFonts.forEach((font) => fontFamilies.add(font));
        containerAnimations.forEach((name) => animationNames.add(name));
      }
    } else if (rule.constructor.name === "CSSLayerBlockRule") {
      const layerRule = rule as { name?: string; cssRules: CSSRuleList };
      const layerRules: string[] = [];
      const layerFonts = new Set<string>();
      const layerAnimations = new Set<string>();
      processRuleList(
        layerRule.cssRules,
        elements,
        layerRules,
        layerFonts,
        layerAnimations
      );

      if (layerRules.length > 0) {
        const layerName = layerRule.name ?? "";
        const layerBlock = layerName
          ? `@layer ${layerName} {\n${layerRules.join("\n")}\n}`
          : `@layer {\n${layerRules.join("\n")}\n}`;
        collectedRules.push(layerBlock);
        layerFonts.forEach((font) => fontFamilies.add(font));
        layerAnimations.forEach((name) => animationNames.add(name));
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
  const animationNames = new Set<string>();

  // Walk through all stylesheets
  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];

    try {
      if (!sheet.cssRules) {
        continue;
      }

      const sheetMedia = sheet.media?.mediaText;
      const hasMediaCondition = sheetMedia && sheetMedia !== "" && sheetMedia !== "all";

      if (hasMediaCondition) {
        const mediaRules: string[] = [];
        const mediaFonts = new Set<string>();
        const mediaAnimations = new Set<string>();
        processRuleList(sheet.cssRules, elements, mediaRules, mediaFonts, mediaAnimations);

        if (mediaRules.length > 0) {
          const mediaBlock = `@media ${sheetMedia} {\n${mediaRules.join("\n")}\n}`;
          collectedRules.push(mediaBlock);
          mediaFonts.forEach((font) => fontFamilies.add(font));
          mediaAnimations.forEach((name) => animationNames.add(name));
        }
      } else {
        processRuleList(sheet.cssRules, elements, collectedRules, fontFamilies, animationNames);
      }
    } catch (e) {
      console.warn("Could not access stylesheet:", sheet.href, e);
      continue;
    }
  }

  // Extract font families and animation names from inline styles on captured elements
  elements.forEach((el) => {
    if (el instanceof HTMLElement) {
      if (el.style.fontFamily) {
        const inlineFonts = extractFontFamilies(`font-family: ${el.style.fontFamily}`);
        inlineFonts.forEach((font) => fontFamilies.add(font));
      }
      const inlineAnimations = extractAnimationNames(el.style);
      inlineAnimations.forEach((name) => animationNames.add(name));
    }
  });

  return {
    cssText: collectedRules.join("\n\n"),
    usedFontFamilies: fontFamilies,
    usedAnimationNames: animationNames
  };
}
