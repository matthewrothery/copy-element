import { describe, it, expect, beforeEach } from "vitest";
import { extractUsedKeyframes } from "./keyframes-extractor";

const hasKeyframesRule =
  typeof CSSKeyframesRule !== "undefined" ||
  (typeof CSSRule !== "undefined" && CSSRule.KEYFRAMES_RULE !== undefined);

describe("extractUsedKeyframes", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it.skipIf(!hasKeyframesRule)(
    "extracts @keyframes when name is in used set",
    () => {
      const style = document.createElement("style");
      style.textContent = `
        @keyframes crxZGW {
          0% { transform: translateY(-8px); opacity: 0; }
          100% { transform: translateY(0px); opacity: 1; }
        }
        @keyframes otherAnim {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);

      const result = extractUsedKeyframes(new Set(["crxZGW"]));

      expect(result).toContain("crxZGW");
      expect(result).toContain("translateY(-8px)");
      expect(result).toContain("opacity: 0");
      expect(result).not.toContain("otherAnim");
    }
  );

  it.skipIf(!hasKeyframesRule)("omits @keyframes when name not in used set", () => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes unused {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    const result = extractUsedKeyframes(new Set(["someOtherName"]));

    expect(result).not.toContain("unused");
    expect(result).toBe("");
  });

  it.skipIf(!hasKeyframesRule)("returns empty string when used set is empty", () => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes foo {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    const result = extractUsedKeyframes(new Set());

    expect(result).toBe("");
  });

  it.skipIf(!hasKeyframesRule)("extracts multiple keyframes for multiple names", () => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes slideUp {
        0% { transform: translateY(10px); }
        100% { transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    const result = extractUsedKeyframes(new Set(["fadeIn", "slideUp"]));

    expect(result).toContain("fadeIn");
    expect(result).toContain("slideUp");
    expect(result).toContain("opacity: 0");
    expect(result).toContain("translateY(10px)");
  });
});
