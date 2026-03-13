import { getAccessibleCssRules } from "./stylesheet-access";

/**
 * Extracts CSS rules from page stylesheets that match captured elements.
 * Preserves original class-based styling instead of inlining computed styles.
 */

export interface ExtractedStylesheet {
  cssText: string;
  usedFontFamilies: Set<string>;
  usedAnimationNames: Set<string>;
  layerOrder: string[];
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

function normalizeLayerName(name: string): string {
  return name.trim();
}

function joinLayerName(parentLayer: string | undefined, layerName: string): string {
  const normalized = normalizeLayerName(layerName);
  if (!normalized) {
    return "";
  }
  if (!parentLayer) {
    return normalized;
  }
  return normalized.includes(".") ? normalized : `${parentLayer}.${normalized}`;
}

function markUsedLayerWithParents(layerName: string, usedLayerNames: Set<string>): void {
  const parts = layerName.split(".");
  for (let i = 1; i <= parts.length; i++) {
    usedLayerNames.add(parts.slice(0, i).join("."));
  }
}

function getLayerStatementNames(
  rule: CSSRule
): string[] {
  const statementRule = rule as { nameList?: ArrayLike<string> | string[] };
  if (statementRule.nameList && statementRule.nameList.length > 0) {
    return Array.from(statementRule.nameList).map(normalizeLayerName).filter(Boolean);
  }

  // Fallback for environments where nameList may be unavailable
  const match = rule.cssText.match(/^@layer\s+([^;]+);$/);
  if (!match) {
    return [];
  }

  return match[1]
    .split(",")
    .map((name) => normalizeLayerName(name))
    .filter(Boolean);
}

function getLayerBlockName(rule: { name?: string; cssText: string }): string {
  if (rule.name && rule.name.trim()) {
    return normalizeLayerName(rule.name);
  }

  const match = rule.cssText.match(/^@layer\s+([^{\s]+)\s*\{/);
  if (!match) {
    return "";
  }

  return normalizeLayerName(match[1]);
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
  usedLayerNames: Set<string>,
  layerOrder: string[],
  currentLayerName?: string
): void {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    if (rule instanceof CSSStyleRule) {
      const selector = rule.selectorText;
      if (selectorMatchesAnyElement(selector, elements)) {
        const cssText = rule.cssText;
        collectedRules.push(cssText);
        const ruleFonts = extractFontFamilies(cssText);
        ruleFonts.forEach((font) => fontFamilies.add(font));
        const ruleAnimations = extractAnimationNames(rule.style);
        ruleAnimations.forEach((name) => animationNames.add(name));

        if (currentLayerName) {
          markUsedLayerWithParents(currentLayerName, usedLayerNames);
        }
      }
    } else if (rule instanceof CSSMediaRule) {
      const mediaRules: string[] = [];
      const mediaFonts = new Set<string>();
      const mediaAnimations = new Set<string>();
      processRuleList(
        rule.cssRules,
        elements,
        mediaRules,
        mediaFonts,
        mediaAnimations,
        usedLayerNames,
        layerOrder,
        currentLayerName
      );

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
        supportsAnimations,
        usedLayerNames,
        layerOrder,
        currentLayerName
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
        containerAnimations,
        usedLayerNames,
        layerOrder,
        currentLayerName
      );

      if (containerRules.length > 0) {
        const containerBlock = `@container ${containerRule.conditionText} {\n${containerRules.join("\n")}\n}`;
        collectedRules.push(containerBlock);
        containerFonts.forEach((font) => fontFamilies.add(font));
        containerAnimations.forEach((name) => animationNames.add(name));
      }
    } else if (rule.constructor.name === "CSSLayerBlockRule") {
      const layerRule = rule as { name?: string; cssRules: CSSRuleList; cssText: string };
      const layerName = getLayerBlockName(layerRule);
      const effectiveLayerName = layerName
        ? joinLayerName(currentLayerName, layerName)
        : currentLayerName;

      if (effectiveLayerName && !layerOrder.includes(effectiveLayerName)) {
        layerOrder.push(effectiveLayerName);
      }

      processRuleList(
        layerRule.cssRules,
        elements,
        collectedRules,
        fontFamilies,
        animationNames,
        usedLayerNames,
        layerOrder,
        effectiveLayerName
      );
    } else if (rule.constructor.name === "CSSLayerStatementRule") {
      const statementLayerNames = getLayerStatementNames(rule)
        .map((name) => joinLayerName(currentLayerName, name))
        .filter(Boolean);

      statementLayerNames.forEach((layerName) => {
        if (!layerOrder.includes(layerName)) {
          layerOrder.push(layerName);
        }
      });
    }
  }
}

/**
 * Extracts CSS rules from page stylesheets that match the captured element tree.
 */
export async function extractMatchingRules(rootElement: Element): Promise<ExtractedStylesheet> {
  const elements = collectAllElements(rootElement);
  const collectedRules: string[] = [];
  const fontFamilies = new Set<string>();
  const animationNames = new Set<string>();
  const usedLayerNames = new Set<string>();
  const layerOrder: string[] = [];

  // Access all stylesheets in parallel
  const sheets = Array.from(document.styleSheets) as CSSStyleSheet[];
  const accessResults = await Promise.all(
    sheets.map(async (sheet) => {
      try {
        const accessible = await getAccessibleCssRules(sheet);
        return { sheet, accessible };
      } catch (e) {
        console.warn("Could not access stylesheet:", sheet.href, e);
        return { sheet, accessible: null };
      }
    })
  );

  const cleanups: Array<() => void> = [];

  try {
    for (const { sheet, accessible } of accessResults) {
      if (!accessible) {
        continue;
      }
      if (accessible.cleanup) {
        cleanups.push(accessible.cleanup);
      }
      const cssRules = accessible.rules;

      const sheetMedia = sheet.media?.mediaText;
      const hasMediaCondition =
        sheetMedia && sheetMedia !== "" && sheetMedia !== "all";

      if (hasMediaCondition) {
        const mediaRules: string[] = [];
        const mediaFonts = new Set<string>();
        const mediaAnimations = new Set<string>();
        processRuleList(
          cssRules,
          elements,
          mediaRules,
          mediaFonts,
          mediaAnimations,
          usedLayerNames,
          layerOrder
        );

        if (mediaRules.length > 0) {
          const mediaBlock = `@media ${sheetMedia} {\n${mediaRules.join("\n")}\n}`;
          collectedRules.push(mediaBlock);
          mediaFonts.forEach((font) => fontFamilies.add(font));
          mediaAnimations.forEach((name) => animationNames.add(name));
        }
      } else {
        processRuleList(
          cssRules,
          elements,
          collectedRules,
          fontFamilies,
          animationNames,
          usedLayerNames,
          layerOrder
        );
      }
    }
  } finally {
    cleanups.forEach((fn) => fn());
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
    usedAnimationNames: animationNames,
    layerOrder: layerOrder.filter((layerName) => usedLayerNames.has(layerName))
  };
}
