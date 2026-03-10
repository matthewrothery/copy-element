import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  it("triggers capture click", () => {
    const onCapture = vi.fn();
    render(<Header onCapture={onCapture} isCapturing={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Capture Element" }));
    expect(onCapture).toHaveBeenCalledTimes(1);
  });
});
