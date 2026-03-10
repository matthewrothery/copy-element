import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteSnippet, getSnippetById, getSnippets, saveSnippet } from "./snippet-storage";
import type { Snippet } from "../types/snippet";

describe("snippet-storage", () => {
  const memory: { ["element-capture-snippets"]?: Snippet[] } = {};

  beforeEach(() => {
    memory["element-capture-snippets"] = [];

    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn(async () => memory),
          set: vi.fn(async (value: { ["element-capture-snippets"]: Snippet[] }) => {
            memory["element-capture-snippets"] = value["element-capture-snippets"];
          })
        }
      }
    });
  });

  it("saves and reads snippets", async () => {
    const snippet: Snippet = {
      id: "1",
      title: "Card",
      sourceUrl: "https://example.com",
      html: "<div></div>",
      jsx: "<div></div>",
      thumbnail: "data:image/png;base64,x",
      createdAt: 1,
      width: 100,
      height: 100
    };

    await saveSnippet(snippet);
    const snippets = await getSnippets();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].id).toBe("1");
  });

  it("deletes snippet by id", async () => {
    memory["element-capture-snippets"] = [
      {
        id: "1",
        title: "One",
        sourceUrl: "https://example.com",
        html: "<div></div>",
        jsx: "<div></div>",
        thumbnail: "",
        createdAt: 1,
        width: 10,
        height: 10
      }
    ];

    await deleteSnippet("1");
    const snippet = await getSnippetById("1");
    expect(snippet).toBeNull();
  });

  it("filters malformed records and keeps valid ones", async () => {
    (memory as unknown as { ["element-capture-snippets"]: unknown[] })["element-capture-snippets"] = [
      { id: "bad-only" },
      {
        id: "2",
        title: "Two",
        sourceUrl: "https://example.com",
        html: "<div></div>",
        jsx: "<div></div>",
        thumbnail: "",
        createdAt: 2,
        width: 10,
        height: 10
      }
    ];

    const snippets = await getSnippets();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].id).toBe("2");
  });

  it("returns snippets sorted by createdAt desc", async () => {
    (memory as unknown as { ["element-capture-snippets"]: Snippet[] })["element-capture-snippets"] = [
      {
        id: "older",
        title: "Older",
        sourceUrl: "https://example.com",
        html: "<div></div>",
        jsx: "<div></div>",
        thumbnail: "",
        createdAt: 1,
        width: 10,
        height: 10
      },
      {
        id: "newer",
        title: "Newer",
        sourceUrl: "https://example.com",
        html: "<div></div>",
        jsx: "<div></div>",
        thumbnail: "",
        createdAt: 3,
        width: 10,
        height: 10
      }
    ];

    const snippets = await getSnippets();
    expect(snippets[0].id).toBe("newer");
    expect(snippets[1].id).toBe("older");
  });
});
