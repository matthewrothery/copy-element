import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders and starts capture from empty state", () => {
    const onCapture = vi.fn();
    render(<EmptyState onCapture={onCapture} />);
    fireEvent.click(screen.getByRole("button", { name: "Capture first element" }));
    expect(onCapture).toHaveBeenCalledTimes(1);
  });
});
