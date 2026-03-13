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

function isGlobalVarSelector(selector: string): boolean {
  const normalized = selector.trim().toLowerCase();
  return normalized === ":root" || normalized === "html" || normalized === "body" || normalized === "*";
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

function pickBestDefinition(
  defs: CssVariableDefinition[],
  media?: string
): CssVariableDefinition | undefined {
  const mediaMatched = defs.filter((def) => (media ? def.media === media : !def.media));
  if (mediaMatched.length === 0) {
    return undefined;
  }
  const globalDefs = mediaMatched.filter((def) => isGlobalVarSelector(def.selector));
  const candidates = globalDefs.length > 0 ? globalDefs : mediaMatched;
  return candidates.reduce((best, current) =>
    current.sourceOrder > best.sourceOrder ? current : best
  );
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

function resolveUsedVarClosure(
  initialVars: Set<string>,
  defByName: Map<string, CssVariableDefinition[]>,
  computed: CSSStyleDeclaration,
  maxDepth = MAX_VAR_RESOLUTION_DEPTH
): Set<string> {
  const usedVars = new Set(initialVars);
  let frontier = new Set(initialVars);

  for (let depth = 0; depth < maxDepth && frontier.size > 0; depth++) {
    const next = new Set<string>();
    for (const varName of frontier) {
      const defs = defByName.get(varName) ?? [];
      const values = defs.map((def) => def.value);
      const computedValue = computed.getPropertyValue(varName).trim();
      if (computedValue) {
        values.push(computedValue);
      }

      for (const value of values) {
        const refs = collectVarNamesFromCss(value);
        for (const ref of refs) {
          if (!usedVars.has(ref)) {
            usedVars.add(ref);
            next.add(ref);
          }
        }
      }
    }
    frontier = next;
  }

  return usedVars;
}

export interface ExtractCssVariableOptions {
  definitions?: CssVariableDefinition[];
  rootSelector?: string;
}

function declarationsToBlock(selector: string, declarations: Map<string, string>): string {
  const lines: string[] = [];
  for (const [name, value] of declarations) {
    lines.push(`${name}: ${value}`);
  }
  return `${selector} {\n  ${lines.join(";\n  ")};\n}`;
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
  const directVars = collectVarNamesFromCss(cssText);
  if (directVars.size === 0) {
    return "";
  }

  const computed = window.getComputedStyle(rootElement);
  const definitions = options.definitions ?? (await collectVariableDefinitionsFromDocument());
  const defByName = groupDefinitionsByVar(definitions);
  const usedVars = resolveUsedVarClosure(directVars, defByName, computed);
  const mediaOrder = collectMediaOrder(definitions);

  const rootDeclarations = new Map<string, string>();
  const rootSelectorDeclarations = new Map<string, string>();
  const mediaDeclarations = new Map<string, Map<string, string>>();

  for (const name of usedVars) {
    const defs = defByName.get(name) ?? [];
    const bestBase = pickBestDefinition(defs);
    if (bestBase) {
      rootDeclarations.set(name, bestBase.value);
    } else {
      const value = computed.getPropertyValue(name).trim();
      if (value.length > 0) {
        rootSelectorDeclarations.set(name, value);
      }
    }

    for (const media of mediaOrder) {
      const bestMedia = pickBestDefinition(defs, media);
      if (!bestMedia) {
        continue;
      }
      const existing = mediaDeclarations.get(media) ?? new Map<string, string>();
      existing.set(name, bestMedia.value);
      mediaDeclarations.set(media, existing);
    }
  }

  const rootSelector = options.rootSelector?.trim();
  if (!rootSelector) {
    for (const [name, value] of rootSelectorDeclarations) {
      if (!rootDeclarations.has(name)) {
        rootDeclarations.set(name, value);
      }
    }
    rootSelectorDeclarations.clear();
  }

  const parts: string[] = [];
  if (rootDeclarations.size > 0) {
    parts.push(declarationsToBlock(":root", rootDeclarations));
  }
  for (const media of mediaOrder) {
    const declarations = mediaDeclarations.get(media);
    if (!declarations || declarations.size === 0) {
      continue;
    }
    parts.push(`@media ${media} {\n${declarationsToBlock(":root", declarations)}\n}`);
  }
  if (rootSelector && rootSelectorDeclarations.size > 0) {
    parts.push(declarationsToBlock(rootSelector, rootSelectorDeclarations));
  }

  if (parts.length === 0) {
    return "";
  }
  return parts.join("\n\n");
}
