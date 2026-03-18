import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

function renderHeader(props: { onCapture: () => void; onLibrary: () => void }) {
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

});
