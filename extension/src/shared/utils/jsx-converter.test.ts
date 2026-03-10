import { describe, expect, it } from "vitest";
import { htmlToJsx } from "./jsx-converter";

describe("htmlToJsx", () => {
  it("converts html attributes and style string to jsx syntax", () => {
    const result = htmlToJsx('<label class="a" for="id" style="font-size:14px;color:#111">Hi</label>');
    expect(result).toContain("className=");
    expect(result).toContain("htmlFor=");
    expect(result).toContain('style={{ fontSize: "14px", color: "#111" }}');
  });
});
