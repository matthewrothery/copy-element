import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal("chrome", {
      tabs: {
        query: vi.fn(async () => [{ id: 42 }]),
        create: vi.fn()
      },
      runtime: {
        sendMessage: vi.fn(async () => ({ ok: true, payload: null })),
        getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`)
      }
    });
    vi.stubGlobal("window", { ...window, close: vi.fn() });
  });

  it("starts capture when Capture button is clicked", async () => {
    render(<App />);
    const buttons = screen.getAllByRole("button", { name: "Capture Element" });
    fireEvent.click(buttons[0]);

    await vi.waitFor(() => {
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        type: "START_CAPTURE",
        payload: { tabId: 42 }
      });
    });
  });

  it("shows error toast when capture fails on unsupported URL", async () => {
    vi.stubGlobal("chrome", {
      tabs: { query: vi.fn(async () => [{ id: 42 }]) },
      runtime: {
        sendMessage: vi.fn(async () => ({
          ok: false,
          code: "UNSUPPORTED_TAB_URL",
          error: "Capture is not supported on this page."
        }))
      }
    });

    render(<App />);
    const buttons = screen.getAllByRole("button", { name: "Capture Element" });
    fireEvent.click(buttons[0]);

    await vi.waitFor(() => {
      expect(screen.getByText("Capture is not supported on this page.")).toBeInTheDocument();
    });
  });
});
