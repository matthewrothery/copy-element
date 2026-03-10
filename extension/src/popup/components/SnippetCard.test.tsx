import { fireEvent, render, screen } from "@testing-library/react";
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
});
