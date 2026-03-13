import type { CssVariableDefinition } from "./css-var-definition-index";
import { collectVariableDefinitionsFromDocument } from "./css-var-definition-index";

/**
 * Extracts CSS custom property definitions used in extracted rules and emits
 * a :root block with computed values so snippets render correctly when
 * variable definitions live on unmatched selectors (e.g. body.web, :root).
 */

const MAX_VAR_RESOLUTION_DEPTH = 24;

/**
 * Collects custom property names referenced in CSS text via var(--name), including nested fallbacks.
 * Returns a set of names including the leading -- (e.g. "--typo-copy").
 */
export function collectVarNamesFromCss(cssText: string): Set<string> {
  const names = new Set<string>();
  const regex = /var\s*\(/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(cssText)) !== null) {
    const openParen = cssText.indexOf("(", match.index);
    if (openParen < 0) {
      break;
    }

    let depth = 1;
    let i = openParen + 1;
    while (i < cssText.length && depth > 0) {
      const ch = cssText[i];
      if (ch === "(") {
        depth++;
      } else if (ch === ")") {
        depth--;
      }
      i++;
    }
    if (depth !== 0) {
      continue;
    }

    const args = cssText.slice(openParen + 1, i - 1).trim();
    if (args.startsWith("--")) {
      const varNameMatch = args.match(/^(--[\w-]+)/);
      if (varNameMatch) {
        names.add(varNameMatch[1]);
      }
    }
  }

  return names;
}

function groupDefinitionsByVar(
  definitions: CssVariableDefinition[]
): Map<string, CssVariableDefinition[]> {
  const map = new Map<string, CssVariableDefinition[]>();
  for (const def of definitions) {
    const existing = map.get(def.name) ?? [];
    existing.push(def);
    map.set(def.name, existing);
  }
  return map;
}

function collectMediaOrder(definitions: CssVariableDefinition[]): string[] {
  const order: string[] = [];
  for (const def of definitions) {
    if (!def.media) {
      continue;
    }
    if (!order.includes(def.media)) {
      order.push(def.media);
    }
  }
  return order;
}

export interface ExtractCssVariableOptions {
  definitions?: CssVariableDefinition[];
  usageContexts?: Array<{
    cssText: string;
    media?: string;
    layerPath?: string;
  }>;
  layerOrder?: string[];
  rootSelector?: string;
}

function declarationsToBlock(selector: string, declarations: Map<string, string>): string {
  const lines: string[] = [];
  for (const [name, value] of declarations) {
    lines.push(`${name}: ${value}`);
  }
  return `${selector} {\n  ${lines.join(";\n  ")};\n}`;
}

interface VarUsageContext {
  cssText: string;
  media?: string;
  layerPath?: string;
}

interface SelectedVarDefinition {
  name: string;
  value: string;
  media?: string;
  layerPath?: string;
  sourceOrder: number;
}

function getDefinitionIdentity(def: { name: string; media?: string }): string {
  return `${def.name}@@${def.media ?? ""}`;
}

function getLayerCandidates(layerPath?: string): Array<string | undefined> {
  const candidates: Array<string | undefined> = [];
  if (layerPath) {
    const parts = layerPath.split(".");
    for (let i = parts.length; i >= 1; i--) {
      candidates.push(parts.slice(0, i).join("."));
    }
  }
  candidates.push(undefined);
  return candidates;
}

function getPreferredLayerForUsage(
  definitions: CssVariableDefinition[],
  usageLayerPath?: string
): string | undefined | null {
  const layerCandidates = getLayerCandidates(usageLayerPath);
  for (const candidate of layerCandidates) {
    if (definitions.some((def) => def.layerPath === candidate)) {
      return candidate;
    }
  }
  return null;
}

function selectLatestDefinitionPerMedia(definitions: CssVariableDefinition[]): SelectedVarDefinition[] {
  const selectedByMedia = new Map<string, CssVariableDefinition>();
  for (const def of definitions) {
    const mediaKey = def.media ?? "";
    const existing = selectedByMedia.get(mediaKey);
    if (!existing || def.sourceOrder > existing.sourceOrder) {
      selectedByMedia.set(mediaKey, def);
    }
  }

  return Array.from(selectedByMedia.values())
    .sort((a, b) => a.sourceOrder - b.sourceOrder)
    .map((def) => ({
      name: def.name,
      value: def.value,
      media: def.media,
      layerPath: def.layerPath,
      sourceOrder: def.sourceOrder
    }));
}

function selectDefinitionsForUsage(
  definitions: CssVariableDefinition[],
  usageLayerPath?: string
): SelectedVarDefinition[] {
  if (definitions.length === 0) {
    return [];
  }
  const preferredLayer = getPreferredLayerForUsage(definitions, usageLayerPath);
  if (preferredLayer !== null) {
    const inLayer = definitions.filter((def) => def.layerPath === preferredLayer);
    if (inLayer.length > 0) {
      return selectLatestDefinitionPerMedia(inLayer);
    }
  }

  // Fallback to unlayered definitions when no compatible layer match exists.
  const unlayered = definitions.filter((def) => !def.layerPath);
  if (unlayered.length > 0) {
    return selectLatestDefinitionPerMedia(unlayered);
  }

  return [];
}

function selectDefinitionsMatchingComputedValue(
  definitions: CssVariableDefinition[],
  computedValue: string,
  usageLayerPath?: string
): SelectedVarDefinition[] {
  const normalizedComputed = computedValue.trim();
  if (!normalizedComputed || definitions.length === 0) {
    return [];
  }

  const exactMatches = definitions.filter((def) => def.value.trim() === normalizedComputed);
  if (exactMatches.length === 0) {
    return [];
  }

  const preferredLayer = getPreferredLayerForUsage(exactMatches, usageLayerPath);
  if (preferredLayer !== null) {
    const inLayer = exactMatches.filter((def) => def.layerPath === preferredLayer);
    if (inLayer.length > 0) {
      return selectLatestDefinitionPerMedia(inLayer);
    }
  }

  const unlayered = exactMatches.filter((def) => !def.layerPath);
  if (unlayered.length > 0) {
    return selectLatestDefinitionPerMedia(unlayered);
  }

  return selectLatestDefinitionPerMedia(exactMatches);
}

function selectorAppliesToRoot(rootElement: Element, selector: string): boolean {
  const selectors = selector
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (selectors.length === 0) {
    return false;
  }

  for (const part of selectors) {
    try {
      if (part === ":root" || part === "html") {
        if (document.documentElement.matches(part)) {
          return true;
        }
        continue;
      }
      if (part === "body") {
        if (document.body?.matches(part)) {
          return true;
        }
        continue;
      }
      if (rootElement.closest(part)) {
        return true;
      }
    } catch {
      // Ignore invalid selectors and continue checking others.
    }
  }

  return false;
}

function getOrderedLayers(
  declarationsByLayer: Map<string, unknown>,
  layerOrder: string[]
): string[] {
  const declared = Array.from(declarationsByLayer.keys());
  const ordered = [
    ...layerOrder.filter((layer) => declarationsByLayer.has(layer)),
    ...declared.filter((layer) => !layerOrder.includes(layer))
  ];
  return ordered;
}

/**
 * Returns a :root { --name: value; ... } block for all variables used in
 * cssText that have a computed value on rootElement. Variables inherit, so
 * the root of the captured subtree is sufficient. Returns "" if none.
 */
export async function extractUsedCssVariableDefinitions(
  rootElement: Element,
  cssText: string,
  options: ExtractCssVariableOptions = {}
): Promise<string> {
  const usageContexts: VarUsageContext[] =
    options.usageContexts && options.usageContexts.length > 0
      ? options.usageContexts
      : [{ cssText }];

  const hasVarUsage = usageContexts.some((context) => collectVarNamesFromCss(context.cssText).size > 0);
  if (!hasVarUsage) {
    return "";
  }

  const computed = window.getComputedStyle(rootElement);
  const definitions = options.definitions ?? (await collectVariableDefinitionsFromDocument());
  const defByName = groupDefinitionsByVar(definitions);
  const rootDeclarations = new Map<string, SelectedVarDefinition>();
  const layerDeclarations = new Map<string, Map<string, SelectedVarDefinition>>();
  const unresolvedRootFallback = new Map<string, string>();

  const maxDepth = MAX_VAR_RESOLUTION_DEPTH;
  for (const usageContext of usageContexts) {
    const initialVars = collectVarNamesFromCss(usageContext.cssText);
    if (initialVars.size === 0) {
      continue;
    }

    const visited = new Set<string>();
    let frontier = new Set(initialVars);
    for (let depth = 0; depth < maxDepth && frontier.size > 0; depth++) {
      const next = new Set<string>();
      for (const varName of frontier) {
        if (visited.has(varName)) {
          continue;
        }
        visited.add(varName);

        const defs =
          (defByName.get(varName) ?? []).filter((def) =>
            selectorAppliesToRoot(rootElement, def.selector)
          );
        let selected = selectDefinitionsForUsage(defs, usageContext.layerPath);
        if (selected.length === 0) {
          const computedValue = computed.getPropertyValue(varName).trim();
          if (computedValue) {
            selected = selectDefinitionsMatchingComputedValue(
              defs,
              computedValue,
              usageContext.layerPath
            );
          }
          if (selected.length === 0 && computedValue) {
            unresolvedRootFallback.set(varName, computedValue);
            for (const ref of collectVarNamesFromCss(computedValue)) {
              if (!visited.has(ref)) {
                next.add(ref);
              }
            }
          }
          if (selected.length === 0) {
            continue;
          }
        }

        for (const selectedDef of selected) {
          if (selectedDef.layerPath) {
            const byName = layerDeclarations.get(selectedDef.layerPath) ?? new Map<string, SelectedVarDefinition>();
            const identity = getDefinitionIdentity(selectedDef);
            const existing = byName.get(identity);
            if (!existing || selectedDef.sourceOrder > existing.sourceOrder) {
              byName.set(identity, selectedDef);
            }
            layerDeclarations.set(selectedDef.layerPath, byName);
          } else {
            const identity = getDefinitionIdentity(selectedDef);
            const existing = rootDeclarations.get(identity);
            if (!existing || selectedDef.sourceOrder > existing.sourceOrder) {
              rootDeclarations.set(identity, selectedDef);
            }
          }

          for (const ref of collectVarNamesFromCss(selectedDef.value)) {
            if (!visited.has(ref)) {
              next.add(ref);
            }
          }
        }
      }
      frontier = next;
    }
  }

  const rootSelector = options.rootSelector?.trim();
  const layerOrder = options.layerOrder ?? [];

  const parts: string[] = [];
  const rootBaseBlock = new Map<string, string>();
  const rootMediaBlocks = new Map<string, Map<string, string>>();
  for (const def of rootDeclarations.values()) {
    if (def.media) {
      const mediaDecls = rootMediaBlocks.get(def.media) ?? new Map<string, string>();
      mediaDecls.set(def.name, def.value);
      rootMediaBlocks.set(def.media, mediaDecls);
    } else {
      rootBaseBlock.set(def.name, def.value);
    }
  }
  if (rootBaseBlock.size > 0) {
    parts.push(declarationsToBlock(":root", rootBaseBlock));
  }

  const rootMediaOrder = collectMediaOrder(
    Array.from(rootDeclarations.values()).map((def) => ({
      name: def.name,
      value: def.value,
      selector: ":root",
      media: def.media,
      layerPath: def.layerPath,
      sourceOrder: def.sourceOrder
    }))
  );
  for (const media of rootMediaOrder) {
    const mediaDecls = rootMediaBlocks.get(media);
    if (!mediaDecls || mediaDecls.size === 0) {
      continue;
    }
    parts.push(`@media ${media} {\n${declarationsToBlock(":root", mediaDecls)}\n}`);
  }

  const orderedLayers = getOrderedLayers(layerDeclarations, layerOrder);
  for (const layerPath of orderedLayers) {
    const declarations = layerDeclarations.get(layerPath);
    if (!declarations || declarations.size === 0) {
      continue;
    }

    const layerBaseBlock = new Map<string, string>();
    const layerMediaBlocks = new Map<string, Map<string, string>>();
    for (const def of declarations.values()) {
      if (def.media) {
        const mediaDecls = layerMediaBlocks.get(def.media) ?? new Map<string, string>();
        mediaDecls.set(def.name, def.value);
        layerMediaBlocks.set(def.media, mediaDecls);
      } else {
        layerBaseBlock.set(def.name, def.value);
      }
    }

    if (layerBaseBlock.size > 0) {
      parts.push(`@layer ${layerPath} {\n${declarationsToBlock(":root", layerBaseBlock)}\n}`);
    }

    const layerMediaOrder = collectMediaOrder(
      Array.from(declarations.values()).map((def) => ({
        name: def.name,
        value: def.value,
        selector: ":root",
        media: def.media,
        layerPath: def.layerPath,
        sourceOrder: def.sourceOrder
      }))
    );
    for (const media of layerMediaOrder) {
      const mediaDecls = layerMediaBlocks.get(media);
      if (!mediaDecls || mediaDecls.size === 0) {
        continue;
      }
      parts.push(`@media ${media} {\n@layer ${layerPath} {\n${declarationsToBlock(":root", mediaDecls)}\n}\n}`);
    }
  }

  if (rootSelector && unresolvedRootFallback.size > 0) {
    parts.push(declarationsToBlock(rootSelector, unresolvedRootFallback));
  } else if (!rootSelector && unresolvedRootFallback.size > 0) {
    if (rootBaseBlock.size === 0) {
      parts.unshift(declarationsToBlock(":root", unresolvedRootFallback));
    } else {
      for (const [name, value] of unresolvedRootFallback) {
        if (!rootBaseBlock.has(name)) {
          rootBaseBlock.set(name, value);
        }
      }
      parts[0] = declarationsToBlock(":root", rootBaseBlock);
    }
  }

  if (parts.length === 0) {
    return "";
  }
  return parts.join("\n\n");
}
