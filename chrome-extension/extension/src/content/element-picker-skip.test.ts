import { beforeEach, describe, expect, it, vi } from "vitest";
import { isOverlayPosition, shouldSkipElement } from "./element-picker-skip";

describe("element-picker-skip", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  describe("shouldSkipElement", () => {
    it("returns true for null", () => {
      expect(shouldSkipElement(null)).toBe(true);
    });

    it("returns true for extension overlay elements", () => {
      const el = document.createElement("div");
      el.setAttribute("data-element-capture-overlay", "box");
      document.body.appendChild(el);
      expect(shouldSkipElement(el)).toBe(true);
    });

    it("returns true for extension modal elements", () => {
      const el = document.createElement("div");
      el.setAttribute("data-element-capture-modal", "true");
      document.body.appendChild(el);
      expect(shouldSkipElement(el)).toBe(true);
    });

    it("returns true for extension toast elements", () => {
      const el = document.createElement("div");
      el.setAttribute("data-element-capture-toast", "true");
      document.body.appendChild(el);
      expect(shouldSkipElement(el)).toBe(true);
    });

    it("returns true for element inside extension UI", () => {
      const parent = document.createElement("div");
      parent.setAttribute("data-element-capture-overlay", "box");
      const child = document.createElement("span");
      parent.appendChild(child);
      document.body.appendChild(parent);
      expect(shouldSkipElement(child)).toBe(true);
    });

    it("returns true for SnipCSS class pattern", () => {
      const el = document.createElement("div");
      el.className = "snipcss0-1-2-3";
      document.body.appendChild(el);
      expect(shouldSkipElement(el)).toBe(true);
    });

    it("returns true for element with snipcss in class", () => {
      const el = document.createElement("div");
      el.className = "foo snipcss-something bar";
      document.body.appendChild(el);
      expect(shouldSkipElement(el)).toBe(true);
    });

    it("returns true for descendant of snipcss element", () => {
      const parent = document.createElement("div");
      parent.className = "snipcss0-1-2-3";
      const child = document.createElement("span");
      parent.appendChild(child);
      document.body.appendChild(parent);
      expect(shouldSkipElement(child)).toBe(true);
    });

    it("returns false for regular page elements", () => {
      const el = document.createElement("div");
      el.className = "hero-section";
      document.body.appendChild(el);
      expect(shouldSkipElement(el)).toBe(false);
    });
  });

  describe("isOverlayPosition", () => {
    it("returns true for fixed position", () => {
      const el = document.createElement("div");
      el.style.position = "fixed";
      document.body.appendChild(el);
      expect(isOverlayPosition(el)).toBe(true);
    });

    it("returns true for sticky position", () => {
      const el = document.createElement("div");
      el.style.position = "sticky";
      document.body.appendChild(el);
      expect(isOverlayPosition(el)).toBe(true);
    });

    it("returns false for static position", () => {
      const el = document.createElement("div");
      document.body.appendChild(el);
      expect(isOverlayPosition(el)).toBe(false);
    });

    it("returns false for absolute position", () => {
      const el = document.createElement("div");
      el.style.position = "absolute";
      document.body.appendChild(el);
      expect(isOverlayPosition(el)).toBe(false);
    });
  });
});
