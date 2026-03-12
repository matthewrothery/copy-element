import { describe, expect, it } from "vitest";
import {
  formatHtmlForReadability,
  normalizeStyleString,
  serializeElementToHtml
} from "./html-serializer";

describe("normalizeStyleString", () => {
  it("removes unnecessary whitespace around colons and semicolons", () => {
    expect(normalizeStyleString("font-size : 14px ; color : #111")).toBe(
      "font-size:14px;color:#111"
    );
  });

  it("collapses multiple spaces in values", () => {
    expect(normalizeStyleString("margin: 10px  20px")).toBe("margin:10px 20px");
  });

  it("handles empty string", () => {
    expect(normalizeStyleString("")).toBe("");
  });
});

describe("formatHtmlForReadability", () => {
  it("indents nested elements", () => {
    const html = '<div id="x"><span>Hi</span></div>';
    const formatted = formatHtmlForReadability(html);
    expect(formatted).toContain("  <div");
    expect(formatted).toContain("    <span>");
    expect(formatted).toContain("Hi");
    expect(formatted).toContain("</span>");
    expect(formatted).toContain("</div>");
  });

  it("uses self-closing syntax for void elements", () => {
    const html = '<div><img src="x" alt="y"><br></div>';
    const formatted = formatHtmlForReadability(html);
    expect(formatted).toContain('<img src="x" alt="y" />');
    expect(formatted).toContain("<br />");
  });
});

describe("serializeElementToHtml", () => {
  it("serializes element to HTML string with formatting", () => {
    document.body.innerHTML = `<div id="target"><span>Hello</span></div>`;
    const el = document.getElementById("target") as HTMLElement;
    const html = serializeElementToHtml(el);
    expect(html).toContain("<span>");
    expect(html).toContain("Hello");
    expect(html).toContain("</span>");
  });

  it("ensures xmlns on SVG elements for portable output", () => {
    document.body.innerHTML = `
      <div id="target">
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </div>
    `;
    const el = document.getElementById("target") as HTMLElement;
    const html = serializeElementToHtml(el);
    expect(html).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("preserves existing xmlns on SVG", () => {
    document.body.innerHTML = `
      <div id="target">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M0 0h24v24H0z"/>
        </svg>
      </div>
    `;
    const el = document.getElementById("target") as HTMLElement;
    const html = serializeElementToHtml(el);
    expect(html).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("normalizes style attributes in output", () => {
    document.body.innerHTML = `<div id="target" style="font-size : 14px ; color : red">Hi</div>`;
    const el = document.getElementById("target") as HTMLElement;
    const html = serializeElementToHtml(el);
    expect(html).toContain('style="font-size:14px;color:red"');
  });
});
