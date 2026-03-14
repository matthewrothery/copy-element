import { describe, expect, it } from "vitest";
import {
  buildCssFromRules,
  buildUsedLayerOrder,
  normalizeAndDedupeRules,
  type CollectedRule
} from "./cdp-css";

function makeRule(overrides: Partial<CollectedRule>): CollectedRule {
  return {
    selector: ".target",
    cssText: "color: red;",
    inherited: false,
    ...overrides
  };
}

describe("cdp-css helpers", () => {
  it("dedupes duplicate matched rules while preserving first-seen order", () => {
    const rules: CollectedRule[] = [
      makeRule({ selector: ".a", cssText: "color: red;" }),
      makeRule({ selector: ".a", cssText: "color: red;" }),
      makeRule({ selector: ".b", cssText: "display: grid;" }),
      makeRule({ selector: ".a", cssText: "color: red;" })
    ];

    const result = normalizeAndDedupeRules(rules);
    expect(result).toHaveLength(2);
    expect(result[0].selector).toBe(".a");
    expect(result[1].selector).toBe(".b");
  });

  it("drops noisy inherited global selectors and keeps safe inherited declarations", () => {
    const rules: CollectedRule[] = [
      makeRule({
        selector: "body",
        cssText: "font-family: Inter; color: black;",
        inherited: true
      }),
      makeRule({
        selector: ".theme",
        cssText: "color: rgb(10 10 10); margin: 12px; font-size: 16px;",
        inherited: true
      }),
      makeRule({
        selector: ".parent .child",
        cssText: "color: purple;",
        inherited: true
      })
    ];

    const result = normalizeAndDedupeRules(rules);
    expect(result).toHaveLength(1);
    expect(result[0].selector).toBe(".theme");
    expect(result[0].cssText).toContain("color: rgb(10 10 10);");
    expect(result[0].cssText).toContain("font-size: 16px;");
    expect(result[0].cssText).not.toContain("margin");
  });

  it("builds used layer order from declarations and encountered layer paths", () => {
    const rules: CollectedRule[] = [
      makeRule({ selector: ".x", cssText: "color: blue;", layerPath: "app.components" }),
      makeRule({ selector: ".y", cssText: "display: flex;", layerPath: "utilities" })
    ];

    const layerOrder = buildUsedLayerOrder(rules, ["reset", "app", "app.components", "theme"]);
    expect(layerOrder).toEqual(["app", "app.components", "utilities"]);
  });

  it("renders nested media and layer blocks without flattening layer semantics", () => {
    const rules: CollectedRule[] = [
      makeRule({ selector: ".plain", cssText: "display: block;" }),
      makeRule({ selector: ".layered", cssText: "color: blue;", layerPath: "app" }),
      makeRule({
        selector: ".layered-sm",
        cssText: "color: green;",
        layerPath: "app",
        media: "(max-width: 600px)"
      })
    ];

    const cssText = buildCssFromRules(rules, ["app"]);

    expect(cssText).toContain(".plain {\n  display: block;\n}");
    expect(cssText).toContain("@layer app {\n.layered {\n  color: blue;\n}\n}");
    expect(cssText).toContain("@media (max-width: 600px) {");
    expect(cssText).toContain("@layer app {\n.layered-sm {\n  color: green;\n}\n}");
  });
});
