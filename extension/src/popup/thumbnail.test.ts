import { describe, expect, it } from "vitest";
import { getCaptureThumbnail } from "./thumbnail";

describe("getCaptureThumbnail", () => {
  it("uses captured thumbnail when available", () => {
    const result = getCaptureThumbnail({
      html: "<div />",
      jsx: "<div />",
      width: 10,
      height: 10,
      elementLabel: "div",
      thumbnail: "data:image/png;base64,abc"
    });

    expect(result).toBe("data:image/png;base64,abc");
  });

  it("falls back to generated placeholder thumbnail", () => {
    const result = getCaptureThumbnail({
      html: "<div />",
      jsx: "<div />",
      width: 10,
      height: 10,
      elementLabel: "div"
    });

    expect(result.startsWith("data:image/svg+xml;base64,")).toBe(true);
  });
});
