import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { freezeAnimations } from "./animation-freeze";

const FREEZE_STYLE_ID = "ea-freeze";

beforeEach(() => {
  document.getElementById(FREEZE_STYLE_ID)?.remove();
});

afterEach(() => {
  document.getElementById(FREEZE_STYLE_ID)?.remove();
});

describe("freezeAnimations", () => {
  it("injects a style tag with the freeze id", () => {
    const unfreeze = freezeAnimations();
    const el = document.getElementById(FREEZE_STYLE_ID);
    expect(el).not.toBeNull();
    expect(el?.tagName).toBe("STYLE");
    unfreeze();
  });

  it("cleanup removes the injected style tag", () => {
    const unfreeze = freezeAnimations();
    expect(document.getElementById(FREEZE_STYLE_ID)).not.toBeNull();
    unfreeze();
    expect(document.getElementById(FREEZE_STYLE_ID)).toBeNull();
  });

  it("is idempotent on double-call — only one style tag exists", () => {
    const unfreeze1 = freezeAnimations();
    const unfreeze2 = freezeAnimations();
    const matches = document.querySelectorAll(`#${FREEZE_STYLE_ID}`);
    expect(matches.length).toBe(1);
    unfreeze1();
    unfreeze2();
  });

  it("cleanup is safe to call multiple times without throwing", () => {
    const unfreeze = freezeAnimations();
    unfreeze();
    expect(() => unfreeze()).not.toThrow();
  });

  it("style content includes animation-play-state paused", () => {
    const unfreeze = freezeAnimations();
    const el = document.getElementById(FREEZE_STYLE_ID);
    expect(el?.textContent).toContain("animation-play-state: paused");
    unfreeze();
  });
});
