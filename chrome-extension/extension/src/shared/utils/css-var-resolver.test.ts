import { beforeEach, describe, expect, it, vi } from "vitest";
import { containsVarReference, resolveVarInValue } from "./css-var-resolver";

describe("containsVarReference", () => {
  it("detects var(--x)", () => {
    expect(containsVarReference("var(--x)")).toBe(true);
  });

  it("detects var(--primary)", () => {
    expect(containsVarReference("var(--primary)")).toBe(true);
  });

  it("detects var(--color-text)", () => {
    expect(containsVarReference("var(--color-text)")).toBe(true);
  });

  it("detects var(--x, #fff) with fallback", () => {
    expect(containsVarReference("var(--x, #fff)")).toBe(true);
  });

  it("detects var(--primary, rgb(0,0,0)) with fallback", () => {
    expect(containsVarReference("var(--primary, rgb(0,0,0))")).toBe(true);
  });

  it("rejects plain rgb value", () => {
    expect(containsVarReference("rgb(34, 34, 34)")).toBe(false);
  });

  it("rejects plain hex value", () => {
    expect(containsVarReference("#222222")).toBe(false);
  });

  it("rejects plain length", () => {
    expect(containsVarReference("16px")).toBe(false);
  });
});

describe("resolveVarInValue", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="target"></div>`;
  });

  it("returns original value when no var reference", () => {
    const el = document.getElementById("target")!;
    expect(resolveVarInValue(el, "color", "rgb(0, 0, 0)")).toBe("rgb(0, 0, 0)");
    expect(resolveVarInValue(el, "padding", "16px")).toBe("16px");
  });

  it("returns resolved value when element has var in stylesheet", () => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () =>
        ({
          getPropertyValue: (prop: string) =>
            prop === "color" ? "rgb(34, 34, 34)" : ""
        }) as CSSStyleDeclaration
    );
    const el = document.getElementById("target")!;
    const resolved = resolveVarInValue(el, "color", "var(--primary)");
    expect(resolved).toBe("rgb(34, 34, 34)");
  });

  it("returns original when getComputedStyle returns empty", () => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      () => ({ getPropertyValue: () => "" }) as CSSStyleDeclaration
    );
    const el = document.getElementById("target")!;
    const resolved = resolveVarInValue(el, "color", "var(--missing)");
    expect(resolved).toBe("var(--missing)");
  });
});
