import { describe, expect, it } from "vitest";
import { replaceAssetsWithPlaceholders } from "./asset-replacer";

describe("replaceAssetsWithPlaceholders", () => {
  it("preserves img elements", () => {
    document.body.innerHTML = `<div id="root"><img src="x" alt="asset" /></div>`;
    const root = document.getElementById("root") as HTMLElement;
    const result = replaceAssetsWithPlaceholders(root);
    const image = result.querySelector("img");
    expect(image).not.toBeNull();
  });

  it("replaces video with placeholder div", () => {
    document.body.innerHTML = `<div id="root"><video src="video.mp4"></video></div>`;
    const root = document.getElementById("root") as HTMLElement;
    const result = replaceAssetsWithPlaceholders(root);
    const placeholder = result.querySelector("[data-placeholder='asset']");
    expect(placeholder).not.toBeNull();
  });
});
