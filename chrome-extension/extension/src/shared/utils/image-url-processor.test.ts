import { describe, expect, it } from "vitest";
import { processImageUrls } from "./image-url-processor";

const BASE = "https://example.com/page/";

describe("processImageUrls", () => {
  it("absolutizes img src", () => {
    document.body.innerHTML = `<div id="root"><img src="/img.png" alt="An image" /></div>`;
    const root = document.getElementById("root") as HTMLElement;
    processImageUrls(root, BASE);

    const img = root.querySelector("img");
    expect(img?.getAttribute("src")).toBe("https://example.com/img.png");
    expect(img?.getAttribute("alt")).toBe("An image");
  });

  it("preserves alt attribute", () => {
    document.body.innerHTML = `<div id="root"><img src="photo.jpg" alt="Photo" /></div>`;
    const root = document.getElementById("root") as HTMLElement;
    processImageUrls(root, BASE);

    const img = root.querySelector("img");
    expect(img?.getAttribute("alt")).toBe("Photo");
  });

  it("absolutizes srcset", () => {
    document.body.innerHTML = `<div id="root"><img src="/small.png" srcset="/small.png 1x, /large.png 2x" alt="" /></div>`;
    const root = document.getElementById("root") as HTMLElement;
    processImageUrls(root, BASE);

    const img = root.querySelector("img");
    expect(img?.getAttribute("srcset")).toBe(
      "https://example.com/small.png 1x, https://example.com/large.png 2x"
    );
  });

  it("absolutizes srcset with width descriptors", () => {
    document.body.innerHTML = `<div id="root"><img srcset="thumb.png 100w, full.png 400w" alt="" /></div>`;
    const root = document.getElementById("root") as HTMLElement;
    processImageUrls(root, BASE);

    const img = root.querySelector("img");
    expect(img?.getAttribute("srcset")).toContain("https://example.com/page/thumb.png");
    expect(img?.getAttribute("srcset")).toContain("https://example.com/page/full.png");
  });

  it("leaves data URLs unchanged", () => {
    const dataUrl = "data:image/png;base64,abc123";
    document.body.innerHTML = `<div id="root"><img src="${dataUrl}" alt="" /></div>`;
    const root = document.getElementById("root") as HTMLElement;
    processImageUrls(root, BASE);

    const img = root.querySelector("img");
    expect(img?.getAttribute("src")).toBe(dataUrl);
  });

  it("replaces img with placeholder when replaceWithPlaceholder is true", () => {
    document.body.innerHTML = `<div id="root"><img src="/x.png" alt="X" /></div>`;
    const root = document.getElementById("root") as HTMLElement;
    processImageUrls(root, BASE, { replaceWithPlaceholder: true });

    const img = root.querySelector("img");
    expect(img).toBeNull();

    const placeholder = root.querySelector("[data-placeholder='asset']");
    expect(placeholder).not.toBeNull();
    expect(placeholder?.tagName).toBe("DIV");
  });

  it("processes multiple images", () => {
    document.body.innerHTML = `
      <div id="root">
        <img src="/a.png" alt="A" />
        <span>middle</span>
        <img src="/b.png" alt="B" />
      </div>
    `;
    const root = document.getElementById("root") as HTMLElement;
    processImageUrls(root, BASE);

    const imgs = root.querySelectorAll("img");
    expect(imgs[0].getAttribute("src")).toBe("https://example.com/a.png");
    expect(imgs[1].getAttribute("src")).toBe("https://example.com/b.png");
  });
});
