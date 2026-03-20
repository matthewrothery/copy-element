import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";
import type { CaptureMode } from "../../shared/types/messages";

function renderHeader(props: { onCapture: (mode: CaptureMode) => void; hideCaptureOptions?: boolean }) {
  const { container } = render(
    <Header
      onCapture={props.onCapture}
      defaultCaptureMode="element"
      hideCaptureOptions={props.hideCaptureOptions}
      onLibrary={() => {}}
      onToggleSettings={() => {}}
      isSettingsView={false}
    >
      {null}
    </Header>
  );
  return within(container.querySelector("header") ?? container);
}

describe("Header", () => {
  it("triggers capture click", () => {
    const onCapture = vi.fn();
    const view = renderHeader({ onCapture });

    fireEvent.click(view.getByRole("button", { name: "Capture Element" }));
    expect(onCapture).toHaveBeenCalledTimes(1);
  });

  it("hides capture mode menu when hideCaptureOptions is set", () => {
    const onCapture = vi.fn();
    const view = renderHeader({ onCapture, hideCaptureOptions: true });

    expect(view.queryByRole("button", { name: "More capture options" })).toBeNull();
    fireEvent.click(view.getByRole("button", { name: "Capture Element" }));
    expect(onCapture).toHaveBeenCalledWith("element");
  });
});
