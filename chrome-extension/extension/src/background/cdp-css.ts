/**
 * CDP-based CSS extraction for cross-origin stylesheets.
 * Uses Chrome DevTools Protocol to read stylesheet content without CORS.
 */
import {
  collectVariableDefinitionsFromCssText,
  type CssVariableDefinition
} from "../shared/utils/css-var-definition-index";

const FONT_FAMILY_REGEX = /font-family\s*:\s*([^;]+)/gi;
const ANIMATION_NAME_REGEX = /animation-name\s*:\s*([^;]+)/gi;
const FONT_FACE_BLOCK_REGEX = /@font-face\s*\{[^}]*\}/gi;
const FONT_FACE_FAMILY_REGEX = /font-family\s*:\s*['"]?([^'";]+)['"]?/i;
const KEYFRAMES_START_REGEX = /@keyframes\s+([^{\s]+)\s*\{/g;
const LAYER_STATEMENT_REGEX = /@layer\s+([^;]+);/g;
const DECLARATION_SPLIT_REGEX = /;(?![^(]*\))/;
const INHERITED_PROPERTY_ALLOWLIST = [
  "color",
  "font",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "font-variant",
  "font-stretch",
  "line-height",
  "letter-spacing",
  "word-spacing",
  "text-transform",
  "text-decoration",
  "text-rendering",
  "text-shadow",
  "white-space",
  "direction",
  "writing-mode"
];

export interface CdpCssResult {
  cssText: string;
  usedFontFamilies: Set<string>;
  usedAnimationNames: Set<string>;
  layerOrder: string[];
  fontFacesCss: string;
  keyframesCss: string;
  variableDefinitions: CssVariableDefinition[];
}

interface CdpRule {
  styleSheetId?: string;
  selectorList?: { text?: string };
  style?: { cssText?: string };
  media?: Array<{ text?: string }>;
  origin?: string;
  layers?: Array<{ name?: string }>;
}

interface CdpRuleMatch {
  rule: CdpRule;
}

interface CdpMatchedStylesResponse {
  matchedCSSRules?: CdpRuleMatch[];
  inherited?: Array<{ matchedCSSRules?: CdpRuleMatch[] }>;
  inlineStyle?: { cssText?: string };
}

export interface CollectedRule {
  selector: string;
  cssText: string;
  media?: string;
  styleSheetId?: string;
  layerPath?: string;
  inherited: boolean;
}

function sendCommand(tabId: number, method: string, params?: object): Promise<unknown> {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand({ tabId }, method, params ?? {}, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(result);
      }
    });
  });
}

function extractFontFamiliesFromCssText(cssText: string): Set<string> {
  const fontFamilies = new Set<string>();
  FONT_FAMILY_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FONT_FAMILY_REGEX.exec(cssText)) !== null) {
    const value = match[1].trim();
    const fonts = value.split(",").map((f) => f.trim().replace(/['"]/g, ""));
    fonts.forEach((font) => {
      if (font && font !== "inherit" && font !== "initial" && font !== "unset") {
        fontFamilies.add(font);
      }
    });
  }
  return fontFamilies;
}

function extractAnimationNamesFromCssText(cssText: string): Set<string> {
  const names = new Set<string>();
  ANIMATION_NAME_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ANIMATION_NAME_REGEX.exec(cssText)) !== null) {
    const value = match[1].trim();
    value.split(",").forEach((s) => {
      const name = s.trim();
      if (name && name !== "none") {
        names.add(name);
      }
    });
  }
  return names;
}

function extractFontFacesFromStylesheetText(
  cssText: string,
  usedFontFamilies: Set<string>,
  baseUrl: string
): string[] {
  const result: string[] = [];
  const normalize = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/\s+/g, " ");

  FONT_FACE_BLOCK_REGEX.lastIndex = 0;
  let block: RegExpExecArray | null;
  while ((block = FONT_FACE_BLOCK_REGEX.exec(cssText)) !== null) {
    const blockText = block[0];
    const familyMatch = blockText.match(FONT_FACE_FAMILY_REGEX);
    if (!familyMatch) continue;

    const fontFaceFamily = normalize(familyMatch[1]);
    const isUsed = [...usedFontFamilies].some((f) => normalize(f) === fontFaceFamily);
    if (!isUsed) continue;

    const absolutized = blockText.replace(
      /url\s*\(\s*(['"]?)([^'")\s]+)\1\s*\)/gi,
      (m, q, url) => {
        try {
          return `url(${q}${new URL(url, baseUrl).href}${q})`;
        } catch {
          return m;
        }
      }
    );
    result.push(absolutized);
  }
  return result;
}

function extractKeyframesFromStylesheetText(
  cssText: string,
  usedAnimationNames: Set<string>
): string[] {
  const result: string[] = [];
  KEYFRAMES_START_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = KEYFRAMES_START_REGEX.exec(cssText)) !== null) {
    const name = match[1].trim();
    if (!usedAnimationNames.has(name)) continue;

    const start = match.index + match[0].length;
    let depth = 1;
    let i = start;
    while (i < cssText.length && depth > 0) {
      if (cssText[i] === "{") depth++;
      else if (cssText[i] === "}") depth--;
      i++;
    }
    result.push(cssText.slice(match.index, i));
  }
  return result;
}

function extractLayerOrderFromStylesheetText(cssText: string): string[] {
  const layers: string[] = [];
  LAYER_STATEMENT_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = LAYER_STATEMENT_REGEX.exec(cssText)) !== null) {
    const names = match[1].split(",").map((n) => n.trim()).filter(Boolean);
    names.forEach((n) => {
      if (!layers.includes(n)) {
        layers.push(n);
      }
    });
  }
  return layers;
}

function isLikelyGlobalSelector(selector: string): boolean {
  const normalized = selector.trim();
  if (!normalized) {
    return true;
  }
  const parts = normalized.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) {
    return true;
  }
  return parts.some((part) => /^(?:\*|html|body|:root)(?:$|[\s>+~:[.#])/i.test(part));
}

function hasCombinator(selector: string): boolean {
  return /[\s>+~]/.test(selector);
}

function normalizeLayerPath(layers?: string[]): string | undefined {
  if (!layers || layers.length === 0) {
    return undefined;
  }
  const normalized = layers.map((value) => value.trim()).filter(Boolean);
  if (normalized.length === 0) {
    return undefined;
  }
  return normalized.join(".");
}

function filterInheritedDeclarations(cssText: string): string {
  const declarations = cssText
    .split(DECLARATION_SPLIT_REGEX)
    .map((raw) => raw.trim())
    .filter(Boolean);

  const kept: string[] = [];
  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(":");
    if (colonIndex <= 0) {
      continue;
    }
    const property = declaration.slice(0, colonIndex).trim().toLowerCase();
    if (INHERITED_PROPERTY_ALLOWLIST.includes(property)) {
      kept.push(declaration.endsWith(";") ? declaration : `${declaration};`);
    }
  }
  return kept.join(" ");
}

function normalizeRule(rule: CollectedRule): CollectedRule | null {
  const selector = rule.selector.trim();
  if (!selector) {
    return null;
  }

  const media = rule.media?.trim();
  const layerPath = rule.layerPath?.trim();
  const styleSheetId = rule.styleSheetId?.trim();

  if (!rule.inherited) {
    const cssText = rule.cssText.trim();
    if (!cssText) {
      return null;
    }
    return {
      selector,
      cssText,
      media: media || undefined,
      styleSheetId: styleSheetId || undefined,
      layerPath: layerPath || undefined,
      inherited: false
    };
  }

  if (isLikelyGlobalSelector(selector) || hasCombinator(selector)) {
    return null;
  }

  const filteredCssText = filterInheritedDeclarations(rule.cssText);
  if (!filteredCssText) {
    return null;
  }

  return {
    selector,
    cssText: filteredCssText,
    media: media || undefined,
    styleSheetId: styleSheetId || undefined,
    layerPath: layerPath || undefined,
    inherited: true
  };
}

function getRuleKey(rule: CollectedRule): string {
  return [
    rule.selector,
    rule.cssText,
    rule.media ?? "",
    rule.styleSheetId ?? "",
    rule.layerPath ?? "",
    rule.inherited ? "1" : "0"
  ].join("||");
}

export function normalizeAndDedupeRules(rules: CollectedRule[]): CollectedRule[] {
  const deduped = new Map<string, CollectedRule>();
  for (const rule of rules) {
    const normalized = normalizeRule(rule);
    if (!normalized) {
      continue;
    }
    const key = getRuleKey(normalized);
    if (!deduped.has(key)) {
      deduped.set(key, normalized);
    }
  }
  return Array.from(deduped.values());
}

function markLayerAndParentsUsed(layerPath: string, used: Set<string>): void {
  const parts = layerPath.split(".");
  for (let i = 1; i <= parts.length; i++) {
    used.add(parts.slice(0, i).join("."));
  }
}

export function buildUsedLayerOrder(
  rules: CollectedRule[],
  declaredLayerOrder: string[]
): string[] {
  const usedLayers = new Set<string>();
  const encounteredLayers: string[] = [];

  for (const rule of rules) {
    if (!rule.layerPath) {
      continue;
    }
    markLayerAndParentsUsed(rule.layerPath, usedLayers);
    if (!encounteredLayers.includes(rule.layerPath)) {
      encounteredLayers.push(rule.layerPath);
    }
  }

  const ordered: string[] = [];
  for (const layer of declaredLayerOrder) {
    if (usedLayers.has(layer) && !ordered.includes(layer)) {
      ordered.push(layer);
    }
  }
  for (const layer of encounteredLayers) {
    const parts = layer.split(".");
    for (let i = 1; i <= parts.length; i++) {
      const candidate = parts.slice(0, i).join(".");
      if (usedLayers.has(candidate) && !ordered.includes(candidate)) {
        ordered.push(candidate);
      }
    }
  }

  return ordered;
}

function renderRuleBlocks(rules: CollectedRule[]): string[] {
  return rules.map(({ selector, cssText }) => `${selector} {\n  ${cssText}\n}`);
}

function renderContextRules(rules: CollectedRule[], layerOrder: string[]): string {
  const unlayered: CollectedRule[] = [];
  const layerBuckets = new Map<string, CollectedRule[]>();
  const encounteredLayerOrder: string[] = [];

  for (const rule of rules) {
    if (!rule.layerPath) {
      unlayered.push(rule);
      continue;
    }
    if (!encounteredLayerOrder.includes(rule.layerPath)) {
      encounteredLayerOrder.push(rule.layerPath);
    }
    const existing = layerBuckets.get(rule.layerPath) ?? [];
    existing.push(rule);
    layerBuckets.set(rule.layerPath, existing);
  }

  const orderedLayers = [
    ...layerOrder.filter((layer) => layerBuckets.has(layer)),
    ...encounteredLayerOrder.filter((layer) => !layerOrder.includes(layer))
  ];

  const parts: string[] = [];
  if (unlayered.length > 0) {
    parts.push(renderRuleBlocks(unlayered).join("\n\n"));
  }

  for (const layer of orderedLayers) {
    const layerRules = layerBuckets.get(layer);
    if (!layerRules || layerRules.length === 0) {
      continue;
    }
    parts.push(`@layer ${layer} {\n${renderRuleBlocks(layerRules).join("\n\n")}\n}`);
  }

  return parts.join("\n\n");
}

export function buildCssFromRules(rules: CollectedRule[], layerOrder: string[]): string {
  const byMedia = new Map<string, CollectedRule[]>();
  const mediaOrder: string[] = [];

  for (const rule of rules) {
    const media = rule.media ?? "";
    const existing = byMedia.get(media) ?? [];
    existing.push(rule);
    byMedia.set(media, existing);
    if (!mediaOrder.includes(media)) {
      mediaOrder.push(media);
    }
  }

  const parts: string[] = [];
  for (const media of mediaOrder) {
    const mediaRules = byMedia.get(media) ?? [];
    if (mediaRules.length === 0) {
      continue;
    }
    const rendered = renderContextRules(mediaRules, layerOrder);
    if (!rendered) {
      continue;
    }
    if (!media) {
      parts.push(rendered);
    } else {
      parts.push(`@media ${media} {\n${rendered}\n}`);
    }
  }

  return parts.join("\n\n");
}

function collectRulesFromMatchedStyles(response: CdpMatchedStylesResponse): {
  rules: CollectedRule[];
  styleSheetIds: Set<string>;
} {
  const rules: CollectedRule[] = [];
  const styleSheetIds = new Set<string>();

  const processRuleMatch = (rm: CdpRuleMatch, inherited: boolean) => {
    const rule = rm.rule;
    if (rule.origin === "user-agent" || rule.origin === "inspector") {
      return;
    }

    const selector = rule.selectorList?.text?.trim();
    const cssText = rule.style?.cssText?.trim();
    if (!selector || !cssText) return;

    const styleSheetId = rule.style?.styleSheetId ?? rule.styleSheetId;
    if (styleSheetId) {
      styleSheetIds.add(styleSheetId);
    }

    const mediaText = rule.media?.[0]?.text;
    const layerPath = normalizeLayerPath(
      rule.layers?.map((layer) => layer.name ?? "").filter(Boolean)
    );

    rules.push({
      selector,
      cssText,
      media: mediaText && mediaText !== "screen" ? mediaText : undefined,
      styleSheetId,
      layerPath,
      inherited
    });
  };

  for (const rm of response.matchedCSSRules ?? []) {
    processRuleMatch(rm, false);
  }
  for (const inherited of response.inherited ?? []) {
    for (const rm of inherited.matchedCSSRules ?? []) {
      processRuleMatch(rm, true);
    }
  }

  return { rules, styleSheetIds };
}

export async function extractCssViaCdp(
  tabId: number,
  selectors: string[],
  baseUrl: string
): Promise<CdpCssResult> {
  await chrome.debugger.attach({ tabId }, "1.3").catch((e) => {
    throw new Error(`Debugger attach failed: ${(e as Error).message}`);
  });

  try {
    await sendCommand(tabId, "DOM.enable");
    await sendCommand(tabId, "CSS.enable");

    const doc = (await sendCommand(tabId, "DOM.getDocument")) as { root: { nodeId: number } };
    const rootNodeId = doc.root.nodeId;

    const allRules: CollectedRule[] = [];
    const allStyleSheetIds = new Set<string>();

    for (const selector of selectors) {
      const queryResult = (await sendCommand(tabId, "DOM.querySelector", {
        nodeId: rootNodeId,
        selector
      })) as { nodeId?: number } | null;

      if (!queryResult?.nodeId) continue;

      const matched = (await sendCommand(tabId, "CSS.getMatchedStylesForNode", {
        nodeId: queryResult.nodeId
      })) as CdpMatchedStylesResponse;

      const { rules, styleSheetIds } = collectRulesFromMatchedStyles(matched);
      allRules.push(...rules);
      styleSheetIds.forEach((id) => allStyleSheetIds.add(id));
    }

    const dedupedRules = normalizeAndDedupeRules(allRules);
    const usedStyleSheetIds = new Set(
      dedupedRules.map((rule) => rule.styleSheetId).filter(Boolean) as string[]
    );

    const declaredLayerOrder: string[] = [];
    const stylesheetTexts = new Map<string, string>();
    const variableDefinitions: CssVariableDefinition[] = [];
    let variableSourceOffset = 0;
    for (const styleSheetId of allStyleSheetIds) {
      try {
        const textResult = (await sendCommand(tabId, "CSS.getStyleSheetText", {
          styleSheetId
        })) as { text?: string };
        const text = textResult?.text ?? "";
        if (!text) {
          continue;
        }
        stylesheetTexts.set(styleSheetId, text);

        const sheetVarDefs = collectVariableDefinitionsFromCssText(text).map((def) => ({
          ...def,
          sourceOrder: def.sourceOrder + variableSourceOffset
        }));
        variableSourceOffset += sheetVarDefs.length;
        variableDefinitions.push(...sheetVarDefs);

        const sheetLayers = extractLayerOrderFromStylesheetText(text);
        for (const layer of sheetLayers) {
          if (!declaredLayerOrder.includes(layer)) {
            declaredLayerOrder.push(layer);
          }
        }
      } catch {
        // Skip stylesheets we can't read
      }
    }

    const layerOrder = buildUsedLayerOrder(dedupedRules, declaredLayerOrder);
    const cssText = buildCssFromRules(dedupedRules, layerOrder);

    const fontFamilies = new Set<string>();
    const animationNames = new Set<string>();
    for (const rule of dedupedRules) {
      extractFontFamiliesFromCssText(rule.cssText).forEach((fontFamily) => fontFamilies.add(fontFamily));
      extractAnimationNamesFromCssText(rule.cssText).forEach((animationName) => animationNames.add(animationName));
    }

    const fontFacesBlocks: string[] = [];
    const keyframesBlocks: string[] = [];
    const seenFontFaceBlocks = new Set<string>();
    const seenKeyframesBlocks = new Set<string>();

    for (const styleSheetId of usedStyleSheetIds) {
      const text = stylesheetTexts.get(styleSheetId);
      if (!text) {
        continue;
      }

      const extractedFontFaces = extractFontFacesFromStylesheetText(text, fontFamilies, baseUrl);
      for (const block of extractedFontFaces) {
        if (!seenFontFaceBlocks.has(block)) {
          seenFontFaceBlocks.add(block);
          fontFacesBlocks.push(block);
        }
      }

      const extractedKeyframes = extractKeyframesFromStylesheetText(text, animationNames);
      for (const block of extractedKeyframes) {
        if (!seenKeyframesBlocks.has(block)) {
          seenKeyframesBlocks.add(block);
          keyframesBlocks.push(block);
        }
      }
    }

    return {
      cssText,
      usedFontFamilies: fontFamilies,
      usedAnimationNames: animationNames,
      layerOrder,
      fontFacesCss: fontFacesBlocks.join("\n\n"),
      keyframesCss: keyframesBlocks.join("\n\n"),
      variableDefinitions
    };
  } finally {
    try {
      await chrome.debugger.detach({ tabId });
    } catch {
      // Ignore detach errors
    }
  }
}
