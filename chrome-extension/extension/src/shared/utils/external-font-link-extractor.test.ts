import { describe, it, expect, beforeEach } from "vitest";
import { extractExternalFontLinks, extractFontPreloadLinks, extractAllFontLinks } from "./external-font-link-extractor";

describe("extractExternalFontLinks", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("extracts Google Fonts stylesheet links", () => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap";
    document.head.appendChild(link);

    const result = extractExternalFontLinks();

    expect(result).toHaveLength(1);
    expect(result[0]).toContain("fonts.googleapis.com");
    expect(result[0]).toContain("Roboto");
  });

  it("extracts Adobe Fonts (Typekit) links", () => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://use.typekit.net/abc123.css";
    document.head.appendChild(link);

    const result = extractExternalFontLinks();

    expect(result).toHaveLength(1);
    expect(result[0]).toContain("use.typekit.net");
  });

  it("ignores non-font stylesheet links", () => {
    const link1 = document.createElement("link");
    link1.rel = "stylesheet";
    link1.href = "https://example.com/styles.css";
    document.head.appendChild(link1);

    const link2 = document.createElement("link");
    link2.rel = "stylesheet";
    link2.href = "/local-styles.css";
    document.head.appendChild(link2);

    const result = extractExternalFontLinks();

    expect(result).toHaveLength(0);
  });

  it("extracts multiple font links", () => {
    const link1 = document.createElement("link");
    link1.rel = "stylesheet";
    link1.href = "https://fonts.googleapis.com/css2?family=Roboto";
    document.head.appendChild(link1);

    const link2 = document.createElement("link");
    link2.rel = "stylesheet";
    link2.href = "https://use.typekit.net/abc123.css";
    document.head.appendChild(link2);

    const result = extractExternalFontLinks();

    expect(result).toHaveLength(2);
  });
});

describe("extractFontPreloadLinks", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("extracts preconnect links to font CDNs", () => {
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = "https://fonts.googleapis.com";
    document.head.appendChild(link);

    const result = extractFontPreloadLinks();

    expect(result).toHaveLength(1);
    expect(result[0]).toContain("preconnect");
    expect(result[0]).toContain("fonts.googleapis.com");
  });

  it("extracts font preload links", () => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = "/fonts/custom.woff2";
    link.setAttribute("as", "font");
    link.setAttribute("type", "font/woff2");
    link.setAttribute("crossorigin", "");
    document.head.appendChild(link);

    const result = extractFontPreloadLinks();

    expect(result).toHaveLength(1);
    expect(result[0]).toContain("preload");
    expect(result[0]).toContain("as=\"font\"");
  });

  it("extracts font files by extension", () => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = "/fonts/custom.woff2";
    document.head.appendChild(link);

    const result = extractFontPreloadLinks();

    expect(result).toHaveLength(1);
    expect(result[0]).toContain(".woff2");
  });

  it("ignores non-font preload links", () => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = "/images/hero.jpg";
    link.setAttribute("as", "image");
    document.head.appendChild(link);

    const result = extractFontPreloadLinks();

    expect(result).toHaveLength(0);
  });
});

describe("extractAllFontLinks", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("extracts both stylesheets and preloads", () => {
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "https://fonts.googleapis.com/css2?family=Roboto";
    document.head.appendChild(stylesheet);

    const preconnect = document.createElement("link");
    preconnect.rel = "preconnect";
    preconnect.href = "https://fonts.gstatic.com";
    document.head.appendChild(preconnect);

    const result = extractAllFontLinks();

    expect(result.stylesheets).toHaveLength(1);
    expect(result.preloads).toHaveLength(1);
  });
});
