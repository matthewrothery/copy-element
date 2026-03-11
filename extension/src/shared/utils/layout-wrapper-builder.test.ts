import { describe, expect, it } from "vitest";
import {
  buildLayoutWrapperStyle,
  needsLayoutWrapper
} from "./layout-wrapper-builder";
import type { ParentLayoutContext, RenderContext } from "../types/snippet";

describe("layout-wrapper-builder", () => {
  describe("needsLayoutWrapper", () => {
    it("returns false when renderContext is undefined", () => {
      expect(needsLayoutWrapper(undefined)).toBe(false);
    });

    it("returns false when parentLayout is absent", () => {
      expect(needsLayoutWrapper({})).toBe(false);
    });

    it("returns false when parentLayout has empty display", () => {
      expect(needsLayoutWrapper({ parentLayout: { display: "" } })).toBe(false);
    });

    it("returns true when inherited text context exists", () => {
      const ctx: RenderContext = {
        inheritedText: { color: "rgb(10, 20, 30)" }
      };
      expect(needsLayoutWrapper(ctx)).toBe(true);
    });

    it("returns true when visible background color exists", () => {
      const ctx: RenderContext = {
        visibleBackgroundColor: "rgb(245, 245, 245)"
      };
      expect(needsLayoutWrapper(ctx)).toBe(true);
    });

    it("returns true when parentLayout has flex display", () => {
      const ctx: RenderContext = {
        parentLayout: { display: "flex", gap: "8px" }
      };
      expect(needsLayoutWrapper(ctx)).toBe(true);
    });

    it("returns true when parentLayout has inline-flex display", () => {
      const ctx: RenderContext = {
        parentLayout: { display: "inline-flex" }
      };
      expect(needsLayoutWrapper(ctx)).toBe(true);
    });

    it("returns true when parentLayout has grid display", () => {
      const ctx: RenderContext = {
        parentLayout: { display: "grid", gridTemplateColumns: "1fr 1fr" }
      };
      expect(needsLayoutWrapper(ctx)).toBe(true);
    });

    it("returns true when parentLayout has inline-grid display", () => {
      const ctx: RenderContext = {
        parentLayout: { display: "inline-grid" }
      };
      expect(needsLayoutWrapper(ctx)).toBe(true);
    });
  });

  describe("buildLayoutWrapperStyle", () => {
    it("includes display and non-default properties", () => {
      const ctx: ParentLayoutContext = {
        display: "flex",
        gap: "12px",
        justifyContent: "center"
      };
      const style = buildLayoutWrapperStyle(ctx);
      expect(style).toContain("display:flex");
      expect(style).toContain("gap:12px");
      expect(style).toContain("justify-content:center");
    });

    it("includes grid properties", () => {
      const ctx: ParentLayoutContext = {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "8px"
      };
      const style = buildLayoutWrapperStyle(ctx);
      expect(style).toContain("display:grid");
      expect(style).toContain("grid-template-columns:1fr 1fr");
      expect(style).toContain("gap:8px");
    });

    it("preserves raw quoted values in declarations", () => {
      const ctx: ParentLayoutContext = {
        display: "flex",
        gap: '8px "spaced"'
      };
      const style = buildLayoutWrapperStyle(ctx);
      expect(style).toContain('gap:8px "spaced"');
    });

    it("includes only display when no other properties", () => {
      const ctx: ParentLayoutContext = { display: "flex" };
      const style = buildLayoutWrapperStyle(ctx);
      expect(style).toBe("display:flex");
    });

    it("includes inherited text and visible background styles", () => {
      const style = buildLayoutWrapperStyle(
        undefined,
        {
          color: "rgb(11, 22, 33)",
          fontFamily: "Inter, sans-serif",
          fontSize: "16px"
        },
        "rgb(250, 250, 250)"
      );
      expect(style).toContain("color:rgb(11, 22, 33)");
      expect(style).toContain("font-family:Inter, sans-serif");
      expect(style).toContain("font-size:16px");
      expect(style).toContain("background-color:rgb(250, 250, 250)");
    });
  });
});
