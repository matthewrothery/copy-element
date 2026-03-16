import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UsageMeter } from "./UsageMeter";

describe("UsageMeter", () => {
  it("shows label, bar, and count", () => {
    render(<UsageMeter used={10} limit={20} />);
    expect(screen.getByText("Captures this month")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /10 of 20 used/i })).toBeInTheDocument();
    expect(screen.getByText("10 / 20 used")).toBeInTheDocument();
  });

  it("does not show upgrade hint when below threshold", () => {
    render(<UsageMeter used={10} limit={20} />);
    expect(
      screen.queryByText(/You're getting close to your monthly capture limit/)
    ).not.toBeInTheDocument();
  });

  it("shows upgrade hint when at or above 70% usage", () => {
    render(<UsageMeter used={14} limit={20} />);
    expect(
      screen.getByText(
        /You're getting close to your monthly capture limit\. Upgrade for unlimited captures/
      )
    ).toBeInTheDocument();
  });

  it("exposes accessible region and progress", () => {
    const { container } = render(<UsageMeter used={5} limit={20} />);
    const region = container.querySelector("[role='region'][aria-label='Monthly capture usage']");
    expect(region).toBeInTheDocument();
    const bar = container.querySelector("[role='progressbar']");
    expect(bar).toHaveAttribute("aria-valuenow", "5");
    expect(bar).toHaveAttribute("aria-valuemax", "20");
  });
});
