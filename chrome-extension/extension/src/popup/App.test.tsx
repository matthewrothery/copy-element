import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { getCurrentMonthKey, GUEST_LIBRARY_LIMIT, SAVES_THIS_MONTH_KEY } from "../shared/usage";

describe("App", () => {
  beforeEach(() => {
    vi.stubGlobal("chrome", {
      tabs: {
        query: vi.fn(async () => [{ id: 42, url: "https://example.com" }]),
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
        payload: { tabId: 42, mode: "element" }
      });
    });
  });

  it("shows inline error banner when capture fails with UNSUPPORTED_TAB_URL", async () => {
    vi.stubGlobal("chrome", {
      tabs: { query: vi.fn(async () => [{ id: 42, url: "https://example.com" }]) },
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
      expect(screen.getByText("Capture isn't supported on this page.")).toBeInTheDocument();
    });
  });
});

describe("App – paywall gating", () => {
  afterEach(cleanup);

  function makeSnippet(id: string) {
    return {
      id,
      title: "Test",
      sourceUrl: "https://example.com",
      html: "<div/>",
      jsx: "",
      thumbnail: "",
      createdAt: 0,
      width: 100,
      height: 100,
    };
  }

  it("shows sign-in modal when guest hits library limit and tries to capture", async () => {
    const guestSnippets = Array.from({ length: GUEST_LIBRARY_LIMIT }, (_, i) =>
      makeSnippet(`s${i}`)
    );
    vi.stubGlobal("chrome", {
      tabs: { query: vi.fn(async () => [{ id: 42, url: "https://example.com" }]), create: vi.fn() },
      runtime: {
        sendMessage: vi.fn(async (msg: { type: string }) => {
          if (msg.type === "GET_SNIPPETS") return { ok: true, payload: guestSnippets };
          if (msg.type === "GET_AUTH_STATE")
            return { ok: true, payload: { signed_in: false, user_email: null, user_plan: null } };
          return { ok: true, payload: null };
        }),
        getURL: vi.fn((path: string) => `chrome-extension://mock/${path}`),
      },
    });

    const { container } = render(<App />);
    // Flush all async effects (snippet loading, auth state loading)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Confirm isAtLimit = true (scoped to this render's container to avoid stale DOM)
    expect(
      within(container).getByText("You've reached your limit. Upgrade for unlimited access.")
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(within(container).getAllByRole("button", { name: "Capture Element" })[0]);
    });

    // Dialog is a portal to document.body — screen searches the full document
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Create free account")).toBeInTheDocument();
  });

  it("shows upgrade modal when signed-in free user hits monthly capture limit", async () => {
    const currentMonth = getCurrentMonthKey();
    vi.stubGlobal("chrome", {
      tabs: { query: vi.fn(async () => [{ id: 42, url: "https://example.com" }]), create: vi.fn() },
      runtime: {
        sendMessage: vi.fn(async (msg: { type: string }) => {
          if (msg.type === "GET_SNIPPETS") return { ok: true, payload: [] };
          if (msg.type === "GET_AUTH_STATE")
            return {
              ok: true,
              payload: { signed_in: true, user_email: "user@test.com", user_plan: "free" },
            };
          return { ok: true, payload: null };
        }),
        getURL: vi.fn((path: string) => `chrome-extension://mock/${path}`),
      },
      storage: {
        local: {
          get: vi.fn(async () => ({
            [SAVES_THIS_MONTH_KEY]: { monthKey: currentMonth, count: 20 },
            "element-armory-auth-token": "tok",
            "element-armory-user-email": "user@test.com",
            "element-armory-user-plan": "free",
          })),
          set: vi.fn(async () => undefined),
        },
        onChanged: {
          addListener: vi.fn(),
          removeListener: vi.fn(),
        },
      },
    });

    const { container } = render(<App />);
    // Flush all async effects (auth state loading, usage loading)
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Confirm isAtLimit = true (scoped to this render's container to avoid stale DOM)
    expect(
      within(container).getByText("You've reached your limit. Upgrade for unlimited access.")
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(within(container).getAllByRole("button", { name: "Capture Element" })[0]);
    });

    // Dialog is a portal to document.body — screen searches the full document
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Upgrade to Pro")).toBeInTheDocument();
  });
});
