import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Header } from "./Header";

function renderHeader(props: { onCapture: (mode: import("../../shared/types/messages").CaptureMode) => void }) {
  const { container } = render(
    <Header
      onCapture={props.onCapture}
      defaultCaptureMode="element"
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
});
