import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UsageMeter } from "./UsageMeter";

describe("UsageMeter", () => {
  it("shows primary line and bar with count", () => {
    render(<UsageMeter used={10} limit={20} />);
    expect(screen.getByText(/Usage this month: 10\/20/)).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: /Usage this month: 10 of 20 used/i })).toBeInTheDocument();
    expect(screen.getByText("10/20")).toBeInTheDocument();
  });

  it("applies quiet tier (0-39%): no hint, low emphasis class", () => {
    const { container } = render(<UsageMeter used={2} limit={20} />);
    expect(container.querySelector(".usage-meter--quiet")).toBeInTheDocument();
    expect(screen.queryByText(/Getting close|captures left|reached your limit/)).not.toBeInTheDocument();
  });

  it("applies default tier (40-69%): no hint", () => {
    const { container } = render(<UsageMeter used={10} limit={20} />);
    expect(container.querySelector(".usage-meter--default")).toBeInTheDocument();
    expect(screen.queryByText(/Getting close|captures left|reached your limit/)).not.toBeInTheDocument();
  });

  it("applies noticeable tier (70-89%): shows getting close hint", () => {
    const { container } = render(<UsageMeter used={14} limit={20} />);
    expect(container.querySelector(".usage-meter--noticeable")).toBeInTheDocument();
    expect(screen.getByText("Getting close to your monthly limit.")).toBeInTheDocument();
  });

  it("applies urgent tier (90%+): shows captures left hint when remaining > 0", () => {
    const { container } = render(<UsageMeter used={18} limit={20} />);
    expect(container.querySelector(".usage-meter--urgent")).toBeInTheDocument();
    expect(screen.getByText(/2 captures left this month\. Upgrade for unlimited access\./)).toBeInTheDocument();
  });

  it("applies urgent tier at 100%: shows reached limit hint", () => {
    const { container } = render(<UsageMeter used={20} limit={20} />);
    expect(container.querySelector(".usage-meter--urgent")).toBeInTheDocument();
    expect(screen.getByText("You've reached your limit. Upgrade for unlimited access.")).toBeInTheDocument();
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
