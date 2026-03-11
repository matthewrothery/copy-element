import { describe, expect, it } from "vitest";
import {
  minimizeStyleMap,
  removeRedundantInheritedStyles
} from "./style-minimizer";

describe("minimizeStyleMap", () => {
  it("combines margin longhand when all four sides present", () => {
    const map = {
      "margin-top": "10px",
      "margin-right": "20px",
      "margin-bottom": "10px",
      "margin-left": "20px"
    };
    const result = minimizeStyleMap(map);
    expect(result.margin).toBe("10px 20px");
    expect(result["margin-top"]).toBeUndefined();
    expect(result["margin-right"]).toBeUndefined();
    expect(result["margin-bottom"]).toBeUndefined();
    expect(result["margin-left"]).toBeUndefined();
  });

  it("combines margin to single value when all sides equal", () => {
    const map = {
      "margin-top": "8px",
      "margin-right": "8px",
      "margin-bottom": "8px",
      "margin-left": "8px"
    };
    const result = minimizeStyleMap(map);
    expect(result.margin).toBe("8px");
  });

  it("combines padding longhand when all four sides present", () => {
    const map = {
      "padding-top": "4px",
      "padding-right": "4px",
      "padding-bottom": "4px",
      "padding-left": "4px"
    };
    const result = minimizeStyleMap(map);
    expect(result.padding).toBe("4px");
  });

  it("combines border when all four sides identical", () => {
    const map = {
      "border-top": "1px solid #ccc",
      "border-right": "1px solid #ccc",
      "border-bottom": "1px solid #ccc",
      "border-left": "1px solid #ccc"
    };
    const result = minimizeStyleMap(map);
    expect(result.border).toBe("1px solid #ccc");
    expect(result["border-top"]).toBeUndefined();
  });

  it("keeps border longhand when sides differ", () => {
    const map = {
      "border-top": "1px solid red",
      "border-right": "2px solid blue",
      "border-bottom": "1px solid red",
      "border-left": "2px solid blue"
    };
    const result = minimizeStyleMap(map);
    expect(result.border).toBeUndefined();
    expect(result["border-top"]).toBe("1px solid red");
  });

  it("does not overwrite existing shorthand", () => {
    const map = {
      margin: "1rem",
      "margin-top": "10px",
      "margin-right": "20px",
      "margin-bottom": "10px",
      "margin-left": "20px"
    };
    const result = minimizeStyleMap(map);
    expect(result.margin).toBe("1rem");
    expect(result["margin-top"]).toBe("10px");
  });

  it("preserves unrelated properties", () => {
    const map = {
      "margin-top": "10px",
      "margin-right": "10px",
      "margin-bottom": "10px",
      "margin-left": "10px",
      color: "red",
      "font-size": "16px"
    };
    const result = minimizeStyleMap(map);
    expect(result.margin).toBe("10px");
    expect(result.color).toBe("red");
    expect(result["font-size"]).toBe("16px");
  });
});

describe("removeRedundantInheritedStyles", () => {
  it("removes color when child matches parent", () => {
    document.body.innerHTML = `
      <div id="parent" style="color: rgb(255, 0, 0)">
        <span id="child" style="color: rgb(255, 0, 0)">x</span>
      </div>
    `;
    const parent = document.getElementById("parent")!;
    const child = document.getElementById("child")!;
    const parentComputed = window.getComputedStyle(parent);
    const childStyles = { color: "rgb(255, 0, 0)" };
    const result = removeRedundantInheritedStyles(childStyles, parentComputed);
    expect(result.color).toBeUndefined();
  });

  it("keeps color when child differs from parent", () => {
    document.body.innerHTML = `
      <div id="parent" style="color: red">
        <span id="child" style="color: blue">x</span>
      </div>
    `;
    const parent = document.getElementById("parent")!;
    const parentComputed = window.getComputedStyle(parent);
    const childStyles = { color: "rgb(0, 0, 255)" };
    const result = removeRedundantInheritedStyles(childStyles, parentComputed);
    expect(result.color).toBe("rgb(0, 0, 255)");
  });
});
