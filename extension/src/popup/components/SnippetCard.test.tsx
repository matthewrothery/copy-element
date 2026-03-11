import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SnippetCard } from "./SnippetCard";

describe("SnippetCard", () => {
  it("supports copy and delete actions", () => {
    const onOpen = vi.fn();
    const onDelete = vi.fn();
    const onCopy = vi.fn();

    render(
      <SnippetCard
        snippet={{
          id: "1",
          title: "Test",
          sourceUrl: "https://example.com",
          html: "<div>hello</div>",
          jsx: "<div>hello</div>",
          thumbnail: "",
          createdAt: 1,
          width: 10,
          height: 10
        }}
        onOpen={onOpen}
        onDelete={onDelete}
        onCopy={onCopy}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy HTML" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete snippet" }));

    expect(onCopy).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("1");
  });

  it("calls onCopy with Tailwind placeholder when Copy Tailwind is clicked", () => {
    const onCopy = vi.fn();
    const { container } = render(
      <SnippetCard
        snippet={{
          id: "1",
          title: "Test",
          sourceUrl: "https://example.com",
          html: "<div>hello</div>",
          jsx: "<div>hello</div>",
          thumbnail: "",
          createdAt: 1,
          width: 10,
          height: 10
        }}
        onOpen={vi.fn()}
        onDelete={vi.fn()}
        onCopy={onCopy}
      />
    );

    const copyTailwind = within(container).getByRole("button", { name: "Copy Tailwind" });
    fireEvent.click(copyTailwind);
    expect(onCopy).toHaveBeenCalledWith("<!-- Tailwind conversion coming soon -->", "Tailwind");
  });
});
