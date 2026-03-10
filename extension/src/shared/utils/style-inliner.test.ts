import { describe, expect, it } from "vitest";
import { styleMapToInlineString } from "./style-inliner";

describe("styleMapToInlineString", () => {
  it("creates an inline style string from style map", () => {
    const result = styleMapToInlineString({
      display: "flex",
      gap: "8px",
      color: "rgb(0, 0, 0)"
    });

    expect(result).toContain("display:flex");
    expect(result).toContain("gap:8px");
    expect(result).toContain("color:rgb(0, 0, 0)");
  });
});
