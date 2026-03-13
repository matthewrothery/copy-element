import { getAccessibleCssRules } from "./stylesheet-access";

/**
 * Extracts @keyframes rules for animation names used in captured elements.
 * Walks all stylesheets and nested at-rules (@media, @supports, @layer).
 */

const KEYFRAMES_RULE_NAME = "CSSKeyframesRule";
const KEYFRAMES_RULE_TYPE = 7; // CSSRule.KEYFRAMES_RULE

function isKeyframesRule(rule: CSSRule): rule is CSSKeyframesRule {
  return (
    rule.type === KEYFRAMES_RULE_TYPE ||
    rule.constructor.name === KEYFRAMES_RULE_NAME
  );
}

/**
 * Recursively collects @keyframes rules whose name is in usedAnimationNames.
 * Output is at top level only (no wrapper preservation).
 */
function processRulesForKeyframes(
  rules: CSSRuleList,
  usedAnimationNames: Set<string>,
  keyframesRules: string[]
): void {
  for (let i = 0; i < rules.length; i++) {
    const rule = rules[i];

    if (isKeyframesRule(rule) && usedAnimationNames.has(rule.name)) {
      keyframesRules.push(rule.cssText);
    } else if (rule instanceof CSSMediaRule) {
      processRulesForKeyframes(rule.cssRules, usedAnimationNames, keyframesRules);
    } else if (rule.constructor.name === "CSSSupportsRule") {
      const supportsRule = rule as unknown as { cssRules: CSSRuleList };
      processRulesForKeyframes(
        supportsRule.cssRules,
        usedAnimationNames,
        keyframesRules
      );
    } else if (rule.constructor.name === "CSSLayerBlockRule") {
      const layerRule = rule as unknown as { cssRules: CSSRuleList };
      processRulesForKeyframes(
        layerRule.cssRules,
        usedAnimationNames,
        keyframesRules
      );
    } else if (rule.constructor.name === "CSSLayerStatementRule") {
      // No-op: @layer statements declare order and do not include keyframes.
      continue;
    }
  }
}

/**
 * Extracts @keyframes rules for animation names used in the captured elements.
 * Returns CSS text with all matching keyframes at top level.
 */
export async function extractUsedKeyframes(
  usedAnimationNames: Set<string>
): Promise<string> {
  if (usedAnimationNames.size === 0) {
    return "";
  }

  const keyframesRules: string[] = [];

  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i] as CSSStyleSheet;
    let cleanup: (() => void) | undefined;

    try {
      const accessible = await getAccessibleCssRules(sheet);
      if (!accessible) {
        console.warn("Could not access stylesheet for keyframes extraction:", sheet.href);
        continue;
      }
      cleanup = accessible.cleanup;
      processRulesForKeyframes(accessible.rules, usedAnimationNames, keyframesRules);
    } catch (e) {
      console.warn(
        "Could not access stylesheet for keyframes extraction:",
        sheet.href,
        e
      );
      continue;
    } finally {
      cleanup?.();
    }
  }

  return keyframesRules.join("\n\n");
}
