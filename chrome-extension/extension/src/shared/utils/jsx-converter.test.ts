import { describe, expect, it } from "vitest";
import { htmlToJsx } from "./jsx-converter";

describe("htmlToJsx", () => {
  it("converts html attributes and style string to jsx syntax", () => {
    const result = htmlToJsx(
      '<label class="a" for="id" style="font-size:14px;color:#111">Hi</label>'
    );
    expect(result).toContain("className=");
    expect(result).toContain("htmlFor=");
    expect(result).toContain('style={{ fontSize: "14px", color: "#111" }}');
  });

  it("preserves self-closing tags for void elements", () => {
    expect(htmlToJsx('<img src="x" alt="y">')).toContain('<img src="x" alt="y" />');
    expect(htmlToJsx("<br>")).toContain("<br />");
    expect(htmlToJsx('<input type="text" name="q">')).toContain(
      '<input type="text" name="q" />'
    );
  });

  it("does not replace data-class or other attribute names containing class", () => {
    const result = htmlToJsx('<div data-class="foo" class="bar">x</div>');
    expect(result).toContain('data-class="foo"');
    expect(result).toContain('className="bar"');
  });

  it("handles style values with quotes in single-quoted attributes", () => {
    const result = htmlToJsx(
      "<span style='content: \"hello\"; font-size: 12px'>x</span>"
    );
    expect(result).toContain('content: "\\"hello\\""');
    expect(result).toContain('fontSize: "12px"');
  });
});
