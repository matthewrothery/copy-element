import { getAccessibleCssRules } from "./stylesheet-access";

export interface CssVariableDefinition {
  name: string;
  value: string;
  selector: string;
  media?: string;
  layerPath?: string;
  sourceOrder: number;
}

function stripCssComments(cssText: string): string {
  return cssText.replace(/\/\*[\s\S]*?\*\//g, "");
}

function combineMedia(parentMedia: string | undefined, media: string): string {
  const trimmed = media.trim();
  if (!trimmed) {
    return parentMedia ?? "";
  }
  if (!parentMedia) {
    return trimmed;
  }
  return `(${parentMedia}) and (${trimmed})`;
}

function normalizeLayerName(layerName: string): string {
  return layerName.trim();
}

function joinLayerPath(parentLayerPath: string | undefined, layerName: string): string | undefined {
  const normalized = normalizeLayerName(layerName);
  if (!normalized) {
    return parentLayerPath;
  }
  if (!parentLayerPath) {
    return normalized;
  }
  return normalized.includes(".") ? normalized : `${parentLayerPath}.${normalized}`;
}

function splitDeclarations(blockText: string): string[] {
  const declarations: string[] = [];
  let buffer = "";
  let parenDepth = 0;
  let quote: "'" | "\"" | null = null;

  for (let i = 0; i < blockText.length; i++) {
    const ch = blockText[i];
    if (quote) {
      buffer += ch;
      if (ch === quote && blockText[i - 1] !== "\\") {
        quote = null;
      }
      continue;
    }

    if (ch === "'" || ch === "\"") {
      quote = ch;
      buffer += ch;
      continue;
    }
    if (ch === "(") {
      parenDepth++;
      buffer += ch;
      continue;
    }
    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      buffer += ch;
      continue;
    }
    if (ch === ";" && parenDepth === 0) {
      const trimmed = buffer.trim();
      if (trimmed) {
        declarations.push(trimmed);
      }
      buffer = "";
      continue;
    }
    buffer += ch;
  }

  const remaining = buffer.trim();
  if (remaining) {
    declarations.push(remaining);
  }
  return declarations;
}

function extractVarDeclarations(
  selectorText: string,
  declarationText: string,
  media: string | undefined,
  layerPath: string | undefined,
  sourceOrderRef: { value: number },
  out: CssVariableDefinition[]
): void {
  const selectors = selectorText
    .split(",")
    .map((selector) => selector.trim())
    .filter(Boolean);
  if (selectors.length === 0) {
    return;
  }

  const declarations = splitDeclarations(declarationText);
  for (const declaration of declarations) {
    const colonIndex = declaration.indexOf(":");
    if (colonIndex <= 0) {
      continue;
    }
    const prop = declaration.slice(0, colonIndex).trim();
    if (!prop.startsWith("--")) {
      continue;
    }
    const value = declaration.slice(colonIndex + 1).trim();
    if (!value) {
      continue;
    }
    for (const selector of selectors) {
      out.push({
        name: prop,
        value,
        selector,
        media: media || undefined,
        layerPath,
        sourceOrder: sourceOrderRef.value++
      });
    }
  }
}

function walkCssTextBlocks(
  cssText: string,
  media: string | undefined,
  layerPath: string | undefined,
  sourceOrderRef: { value: number },
  out: CssVariableDefinition[]
): void {
  const text = stripCssComments(cssText);
  let i = 0;

  while (i < text.length) {
    while (i < text.length && /\s/.test(text[i])) {
      i++;
    }
    if (i >= text.length) {
      break;
    }

    let preludeStart = i;
    while (i < text.length && text[i] !== "{" && text[i] !== ";") {
      i++;
    }
    if (i >= text.length) {
      break;
    }

    const prelude = text.slice(preludeStart, i).trim();
    if (!prelude) {
      i++;
      continue;
    }

    if (text[i] === ";") {
      i++;
      continue;
    }

    // text[i] === "{"
    const blockStart = i;
    i++;
    let depth = 1;
    while (i < text.length && depth > 0) {
      if (text[i] === "{") {
        depth++;
      } else if (text[i] === "}") {
        depth--;
      }
      i++;
    }
    const blockEnd = i - 1;
    if (blockEnd <= blockStart) {
      continue;
    }
    const blockContent = text.slice(blockStart + 1, blockEnd);

    if (prelude.startsWith("@media")) {
      const mediaCondition = prelude.replace(/^@media\s*/i, "").trim();
      walkCssTextBlocks(
        blockContent,
        combineMedia(media, mediaCondition),
        layerPath,
        sourceOrderRef,
        out
      );
      continue;
    }

    if (prelude.startsWith("@layer")) {
      const layerName = prelude.replace(/^@layer\s*/i, "").trim();
      const nextLayerPath = joinLayerPath(layerPath, layerName);
      walkCssTextBlocks(
        blockContent,
        media,
        nextLayerPath,
        sourceOrderRef,
        out
      );
      continue;
    }

    if (prelude.startsWith("@")) {
      // Recurse through other block at-rules (@supports, @layer, etc.) preserving current media.
      walkCssTextBlocks(blockContent, media, layerPath, sourceOrderRef, out);
      continue;
    }

    extractVarDeclarations(prelude, blockContent, media, layerPath, sourceOrderRef, out);
  }
}

export function collectVariableDefinitionsFromCssText(cssText: string): CssVariableDefinition[] {
  const out: CssVariableDefinition[] = [];
  walkCssTextBlocks(cssText, undefined, undefined, { value: 0 }, out);
  return out;
}

function collectVariableDefinitionsFromRuleList(
  rules: CSSRuleList,
  out: CssVariableDefinition[],
  sourceOrderRef: { value: number },
  media?: string,
  layerPath?: string
): void {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];
    if (rule instanceof CSSStyleRule) {
      const selectors = rule.selectorText
        .split(",")
        .map((selector) => selector.trim())
        .filter(Boolean);
      for (let j = 0; j < rule.style.length; j++) {
        const prop = rule.style[j];
        if (!prop.startsWith("--")) {
          continue;
        }
        const value = rule.style.getPropertyValue(prop).trim();
        if (!value) {
          continue;
        }
        for (const selector of selectors) {
          out.push({
            name: prop,
            value,
            selector,
            media,
            layerPath,
            sourceOrder: sourceOrderRef.value++
          });
        }
      }
    } else if (rule instanceof CSSMediaRule) {
      const nextMedia = combineMedia(media, rule.conditionText);
      collectVariableDefinitionsFromRuleList(
        rule.cssRules,
        out,
        sourceOrderRef,
        nextMedia || undefined,
        layerPath
      );
    } else if (rule.constructor.name === "CSSSupportsRule") {
      const supportsRule = rule as unknown as { cssRules: CSSRuleList };
      collectVariableDefinitionsFromRuleList(
        supportsRule.cssRules,
        out,
        sourceOrderRef,
        media,
        layerPath
      );
    } else if (rule.constructor.name === "CSSContainerRule") {
      const containerRule = rule as unknown as { cssRules: CSSRuleList };
      collectVariableDefinitionsFromRuleList(
        containerRule.cssRules,
        out,
        sourceOrderRef,
        media,
        layerPath
      );
    } else if (rule.constructor.name === "CSSLayerBlockRule") {
      const layerRule = rule as unknown as { cssRules: CSSRuleList; name?: string };
      const nextLayerPath = joinLayerPath(layerPath, layerRule.name ?? "");
      collectVariableDefinitionsFromRuleList(
        layerRule.cssRules,
        out,
        sourceOrderRef,
        media,
        nextLayerPath
      );
    }
  }
}

export async function collectVariableDefinitionsFromDocument(): Promise<CssVariableDefinition[]> {
  const out: CssVariableDefinition[] = [];
  const sourceOrderRef = { value: 0 };
  const sheets = Array.from(document.styleSheets) as CSSStyleSheet[];
  const accessResults = await Promise.all(
    sheets.map(async (sheet) => {
      try {
        const accessible = await getAccessibleCssRules(sheet);
        return { accessible };
      } catch {
        return { accessible: null };
      }
    })
  );

  const cleanups: Array<() => void> = [];
  try {
    for (const { accessible } of accessResults) {
      if (!accessible) {
        continue;
      }
      if (accessible.cleanup) {
        cleanups.push(accessible.cleanup);
      }
      collectVariableDefinitionsFromRuleList(
        accessible.rules,
        out,
        sourceOrderRef
      );
    }
  } finally {
    cleanups.forEach((cleanup) => cleanup());
  }

  return out;
}
