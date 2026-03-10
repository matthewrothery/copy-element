import { beforeEach, describe, expect, it, vi } from "vitest";
import { extractVisualStyles } from "./style-extractor";

describe("extractVisualStyles", () => {
  beforeEach(() => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(
      (element: Element) =>
        ({
          getPropertyValue: (property: string) => {
            const values: Record<string, string> = {
              display: "flex",
              position: "static",
              margin: "0px",
              "margin-top": "0",
              padding: "16px",
              "background-color": "rgba(0, 0, 0, 0)",
              "box-shadow": "none",
              opacity: "1",
              "flex-direction": "row",
              "justify-content": "center",
              color: "rgb(0, 0, 0)"
            };
            return values[property] ?? "";
          }
        }) as CSSStyleDeclaration
    );
  });

  it("omits default values", () => {
    document.body.innerHTML = `<div id="target"></div>`;
    const target = document.getElementById("target") as HTMLElement;
    const styles = extractVisualStyles(target);

    expect(styles.position).toBeUndefined();
    expect(styles.margin).toBeUndefined();
    expect(styles["margin-top"]).toBeUndefined();
    expect(styles["background-color"]).toBeUndefined();
    expect(styles["box-shadow"]).toBeUndefined();
    expect(styles.opacity).toBeUndefined();
    expect(styles["flex-direction"]).toBeUndefined();
  });

  it("keeps non-default values", () => {
    document.body.innerHTML = `<div id="target"></div>`;
    const target = document.getElementById("target") as HTMLElement;
    const styles = extractVisualStyles(target);

    expect(styles.display).toBe("flex");
    expect(styles.padding).toBe("16px");
    expect(styles["justify-content"]).toBe("center");
    expect(styles.color).toBe("rgb(0, 0, 0)");
  });

  it("treats 0px and 0 as default for zero-valued properties", () => {
    document.body.innerHTML = `<div id="target"></div>`;
    const target = document.getElementById("target") as HTMLElement;
    const styles = extractVisualStyles(target);

    expect(styles.margin).toBeUndefined();
    expect(styles["margin-top"]).toBeUndefined();
  });
});
