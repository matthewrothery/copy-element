import { describe, expect, it } from "vitest";
import { replaceAssetsWithPlaceholders } from "./asset-replacer";

describe("replaceAssetsWithPlaceholders", () => {
  it("replaces img with placeholder div", () => {
    document.body.innerHTML = `<div id="root"><img src="x" alt="asset" /></div>`;
    const root = document.getElementById("root") as HTMLElement;
    const result = replaceAssetsWithPlaceholders(root);
    const placeholder = result.querySelector("[data-placeholder='asset']");
    expect(placeholder).not.toBeNull();
  });
});
