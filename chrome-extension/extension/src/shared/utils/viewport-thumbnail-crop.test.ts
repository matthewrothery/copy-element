import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cropViewportToThumbnail } from "./viewport-thumbnail-crop";

/** Minimal 1x1 PNG (transparent pixel). */
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("cropViewportToThumbnail", () => {
  let MockImage: new () => HTMLImageElement;
  let origGetContext: (contextId: string) => RenderingContext | null;
  let origToDataURL: (type?: string, quality?: number) => string;

  beforeEach(() => {
    MockImage = class extends Image {
      constructor() {
        super();
        queueMicrotask(() => {
          if (this.src === "" || this.src === "data:image/png;base64,invalid") {
            this.onerror?.(new Event("error"));
          } else {
            Object.defineProperty(this, "naturalWidth", { value: 1, configurable: true });
            Object.defineProperty(this, "naturalHeight", { value: 1, configurable: true });
            this.onload?.(new Event("load"));
          }
        });
      }
    };
    vi.stubGlobal("Image", MockImage);

    const mockCtx = {
      fillStyle: "",
      fillRect: vi.fn(),
      drawImage: vi.fn()
    };
    origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      _contextId: string
    ): CanvasRenderingContext2D | null {
      return mockCtx as unknown as CanvasRenderingContext2D;
    };
    origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (
      _type?: string,
      _quality?: number
    ): string {
      return "data:image/jpeg;base64,mockThumbnail";
    };
  });

  afterEach(() => {
    if (origGetContext) {
      HTMLCanvasElement.prototype.getContext = origGetContext;
    }
    if (origToDataURL) {
      HTMLCanvasElement.prototype.toDataURL = origToDataURL;
    }
    vi.unstubAllGlobals();
  });

  it("returns a JPEG data URL when given valid viewport image and rect", async () => {
    const result = await cropViewportToThumbnail(
      TINY_PNG,
      { left: 0, top: 0, width: 1, height: 1 },
      10,
      10,
      480,
      360
    );

    expect(typeof result).toBe("string");
    expect(result).toMatch(/^data:image\/jpeg;base64,/);
    expect(result).toBe("data:image/jpeg;base64,mockThumbnail");
  });

  it("rejects when image fails to load", async () => {
    await expect(
      cropViewportToThumbnail(
        "data:image/png;base64,invalid",
        { left: 0, top: 0, width: 5, height: 5 },
        10,
        10
      )
    ).rejects.toThrow();
  });
});
