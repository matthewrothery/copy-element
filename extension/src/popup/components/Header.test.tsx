import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

function renderHeader(props: { onCapture: () => void; onLibrary: () => void; onMCP?: () => void }) {
  const { container } = render(<Header {...props} />);
  return within(container.querySelector("header") ?? container);
}

describe("Header", () => {
  it("triggers capture click", () => {
    const onCapture = vi.fn();
    const onLibrary = vi.fn();
    const view = renderHeader({ onCapture, onLibrary });

    fireEvent.click(view.getByRole("button", { name: "Capture Element" }));
    expect(onCapture).toHaveBeenCalledTimes(1);
  });

  it("triggers library click", () => {
    const onCapture = vi.fn();
    const onLibrary = vi.fn();
    const view = renderHeader({ onCapture, onLibrary });

    fireEvent.click(view.getByRole("button", { name: "Open Library" }));
    expect(onLibrary).toHaveBeenCalledTimes(1);
  });

  it("renders MCP button when onMCP is provided", () => {
    const onCapture = vi.fn();
    const onLibrary = vi.fn();
    const onMCP = vi.fn();
    const view = renderHeader({ onCapture, onLibrary, onMCP });

    expect(view.getByRole("button", { name: "MCP" })).toBeInTheDocument();
  });

  it("hides MCP button when onMCP is not provided", () => {
    const onCapture = vi.fn();
    const onLibrary = vi.fn();
    const view = renderHeader({ onCapture, onLibrary });

    expect(view.queryByRole("button", { name: "MCP" })).not.toBeInTheDocument();
  });
});
