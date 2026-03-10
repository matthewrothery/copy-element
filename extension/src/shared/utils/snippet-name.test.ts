import { describe, expect, it } from "vitest";
import { generateSnippetName } from "./snippet-name";

describe("generateSnippetName", () => {
  it("returns a non-empty string", () => {
    const name = generateSnippetName();
    expect(name).toBeTruthy();
    expect(typeof name).toBe("string");
    expect(name.length).toBeGreaterThan(0);
  });

  it("returns two words separated by space", () => {
    const name = generateSnippetName();
    const parts = name.split(" ");
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBeGreaterThan(0);
    expect(parts[1].length).toBeGreaterThan(0);
  });

  it("capitalizes each word", () => {
    const name = generateSnippetName();
    const parts = name.split(" ");
    expect(parts[0][0]).toBe(parts[0][0].toUpperCase());
    expect(parts[1][0]).toBe(parts[1][0].toUpperCase());
  });

  it("generates different names on multiple calls", () => {
    const names = new Set<string>();
    for (let i = 0; i < 20; i++) {
      names.add(generateSnippetName());
    }
    expect(names.size).toBeGreaterThan(1);
  });
});
