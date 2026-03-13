import { describe, expect, it } from "vitest";
import { collectVariableDefinitionsFromCssText } from "./css-var-definition-index";

describe("collectVariableDefinitionsFromCssText", () => {
  it("collects base custom property definitions from standard rules", () => {
    const css = `
      :root { --a: 8px; --b: var(--a); }
      .component { --c: 12px; color: red; }
    `;
    const defs = collectVariableDefinitionsFromCssText(css);
    expect(defs.some((def) => def.name === "--a" && def.value === "8px" && def.selector === ":root")).toBe(true);
    expect(defs.some((def) => def.name === "--b" && def.value === "var(--a)" && def.selector === ":root")).toBe(true);
    expect(defs.some((def) => def.name === "--c" && def.value === "12px" && def.selector === ".component")).toBe(true);
  });

  it("collects media-scoped custom property definitions", () => {
    const css = `
      :root { --size: 10px; }
      @media (min-width: 940px) {
        :root { --size: 20px; }
      }
    `;
    const defs = collectVariableDefinitionsFromCssText(css);
    expect(
      defs.some(
        (def) =>
          def.name === "--size" && def.value === "10px" && def.selector === ":root" && !def.media
      )
    ).toBe(true);
    expect(
      defs.some(
        (def) =>
          def.name === "--size" &&
          def.value === "20px" &&
          def.selector === ":root" &&
          def.media === "(min-width: 940px)"
      )
    ).toBe(true);
  });

  it("walks nested at-rules and keeps media context", () => {
    const css = `
      @media (min-width: 640px) {
        @supports (display: grid) {
          :root { --grid-gap: 24px; }
        }
      }
    `;
    const defs = collectVariableDefinitionsFromCssText(css);
    expect(
      defs.some(
        (def) =>
          def.name === "--grid-gap" &&
          def.value === "24px" &&
          def.selector === ":root" &&
          def.media === "(min-width: 640px)"
      )
    ).toBe(true);
  });
});
