import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SnippetCard } from "./SnippetCard";

vi.mock("../api", () => ({
  openPreviewInNewTab: vi.fn(),
  buildCopyHtml: vi.fn()
}));

const defaultSnippet = {
  id: "1",
  title: "Test",
  sourceUrl: "https://example.com",
  html: "<div>hello</div>",
  jsx: "<div>hello</div>",
  thumbnail: "",
  createdAt: 1,
  width: 10,
  height: 10
};

function renderCard(props: Partial<React.ComponentProps<typeof SnippetCard>> = {}) {
  const result = render(
    <SnippetCard
      snippet={defaultSnippet}
      onOpen={vi.fn()}
      onDelete={vi.fn()}
      onCopy={vi.fn()}
      {...props}
    />
  );
  return { ...result, withinCard: () => within(result.container.querySelector(".snippet-card")!) };
}

describe("SnippetCard", () => {
  it("supports primary copy code action", () => {
    const onCopy = vi.fn();
    const { withinCard } = renderCard({ onCopy });
    fireEvent.click(withinCard().getByRole("button", { name: "Copy code" }));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("supports copy prompt action", () => {
    const onCopy = vi.fn();
    const { withinCard } = renderCard({ onCopy });
    fireEvent.click(withinCard().getByRole("button", { name: "Copy prompt" }));
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("opens preview when thumbnail is clicked", () => {
    const onOpen = vi.fn();
    const { withinCard } = renderCard({ onOpen });
    fireEvent.click(withinCard().getByRole("button", { name: "Open Test" }));
    expect(onOpen).toHaveBeenCalledWith(defaultSnippet);
  });

  it("calls onDelete when Delete is chosen from more menu", () => {
    const onDelete = vi.fn();
    const { withinCard } = renderCard({ onDelete });
    fireEvent.click(withinCard().getByRole("button", { name: "More options" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("1");
  });

  it("calls onCopy with Tailwind placeholder when Copy Tailwind is chosen from more menu", () => {
    const onCopy = vi.fn();
    const { withinCard } = renderCard({ onCopy });
    fireEvent.click(withinCard().getByRole("button", { name: "More options" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Copy Tailwind" }));
    expect(onCopy).toHaveBeenCalledWith("<!-- Tailwind conversion coming soon -->", "Tailwind");
  });
});
