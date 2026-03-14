import { describe, expect, it } from "vitest";
import {
  resolveUrl,
  absolutizeUrlsInCssValue,
  transformStyleMapForPortability
} from "./url-absolutizer";

const BASE = "https://example.com/page/sub";

describe("resolveUrl", () => {
  it("resolves relative path", () => {
    expect(resolveUrl("/img.png", BASE)).toBe("https://example.com/img.png");
  });

  it("resolves relative path without leading slash", () => {
    const baseWithSlash = "https://example.com/page/sub/";
    expect(resolveUrl("img.png", baseWithSlash)).toBe(
      "https://example.com/page/sub/img.png"
    );
  });

  it("returns absolute URL unchanged", () => {
    const abs = "https://cdn.example.com/asset.png";
    expect(resolveUrl(abs, BASE)).toBe(abs);
  });

  it("returns data URL unchanged", () => {
    const data = "data:image/png;base64,abc123";
    expect(resolveUrl(data, BASE)).toBe(data);
  });

  it("returns blob URL unchanged", () => {
    const blob = "blob:https://example.com/uuid";
    expect(resolveUrl(blob, BASE)).toBe(blob);
  });

  it("returns empty string unchanged", () => {
    expect(resolveUrl("", BASE)).toBe("");
  });

  it("returns original when baseUrl is invalid", () => {
    expect(resolveUrl("/img.png", "not-a-valid-base")).toBe("/img.png");
  });
});

describe("absolutizeUrlsInCssValue", () => {
  it("absolutizes single url", () => {
    const result = absolutizeUrlsInCssValue('url("/img.png")', BASE);
    expect(result).toBe('url("https://example.com/img.png")');
  });

  it("absolutizes url without quotes", () => {
    const result = absolutizeUrlsInCssValue("url(/img.png)", BASE);
    expect(result).toBe('url("https://example.com/img.png")');
  });

  it("absolutizes multiple urls", () => {
    const result = absolutizeUrlsInCssValue(
      'url("/a.png"), url("/b.png")',
      BASE
    );
    expect(result).toBe(
      'url("https://example.com/a.png"), url("https://example.com/b.png")'
    );
  });

  it("leaves gradients unchanged", () => {
    const value = "linear-gradient(to right, #fff, #000)";
    expect(absolutizeUrlsInCssValue(value, BASE)).toBe(value);
  });

  it("leaves radial gradient unchanged", () => {
    const value = "radial-gradient(circle, red, blue)";
    expect(absolutizeUrlsInCssValue(value, BASE)).toBe(value);
  });

  it("absolutizes url inside gradient", () => {
    const result = absolutizeUrlsInCssValue(
      "linear-gradient(transparent, url(/img.png))",
      BASE
    );
    expect(result).toBe(
      'linear-gradient(transparent, url("https://example.com/img.png"))'
    );
  });
});

describe("transformStyleMapForPortability", () => {
  it("transforms background-image", () => {
    const styles = {
      "background-image": 'url("/bg.png")',
      color: "red"
    };
    const result = transformStyleMapForPortability(styles, BASE);
    expect(result["background-image"]).toBe(
      'url("https://example.com/bg.png")'
    );
    expect(result.color).toBe("red");
  });

  it("transforms list-style-image", () => {
    const styles = {
      "list-style-image": "url(bullet.svg)"
    };
    const baseWithSlash = "https://example.com/page/sub/";
    const result = transformStyleMapForPortability(styles, baseWithSlash);
    expect(result["list-style-image"]).toContain(
      "https://example.com/page/sub/bullet.svg"
    );
  });

  it("leaves non-url properties unchanged", () => {
    const styles = {
      "background-color": "transparent",
      display: "block"
    };
    const result = transformStyleMapForPortability(styles, BASE);
    expect(result).toEqual(styles);
  });
});
