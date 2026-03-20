import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteSnippet, getSnippetById, getSnippets, saveSnippet } from "./snippet-storage";
import type { Snippet } from "../types/snippet";

const STORAGE_INDEX_KEY = "element-capture-snippet-ids";
const STORAGE_ITEM_PREFIX = "element-capture-snippet:";
const LEGACY_STORAGE_KEY = "element-capture-snippets";

function snippetKey(id: string): string {
  return `${STORAGE_ITEM_PREFIX}${id}`;
}

describe("snippet-storage", () => {
  const memory: Record<string, unknown> = {};

  function createMockChrome() {
    return {
      storage: {
        local: {
          get: vi.fn(async (keys: string | string[]): Promise<Record<string, unknown>> => {
            if (Array.isArray(keys)) {
              const out: Record<string, unknown> = {};
              for (const k of keys) {
                if (memory[k] !== undefined) {
                  out[k] = memory[k];
                }
              }
              return out;
            }
            return memory[keys] !== undefined ? { [keys]: memory[keys] } : {};
          }),
          set: vi.fn(async (value: Record<string, unknown>) => {
            for (const [k, v] of Object.entries(value)) {
              memory[k] = v;
            }
          }),
          remove: vi.fn(async (keys: string | string[]) => {
            const arr = typeof keys === "string" ? [keys] : keys;
            for (const k of arr) {
              delete memory[k];
            }
          })
        }
      }
    };
  }

  beforeEach(() => {
    for (const key of Object.keys(memory)) {
      delete memory[key];
    }
    memory[STORAGE_INDEX_KEY] = [];
    vi.stubGlobal("chrome", createMockChrome());
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
    expect(memory[STORAGE_INDEX_KEY]).toEqual(["1"]);
    expect(memory[snippetKey("1")]).toBeDefined();
  });

  it("deletes snippet by id", async () => {
    memory[STORAGE_INDEX_KEY] = ["1"];
    memory[snippetKey("1")] = {
      id: "1",
      title: "One",
      sourceUrl: "https://example.com",
      html: "<div></div>",
      jsx: "<div></div>",
      thumbnail: "",
      createdAt: 1,
      width: 10,
      height: 10
    };

    await deleteSnippet("1");
    const snippet = await getSnippetById("1");
    expect(snippet).toBeNull();
    expect(memory[STORAGE_INDEX_KEY]).toEqual([]);
    expect(memory[snippetKey("1")]).toBeUndefined();
  });

  it("filters malformed records and keeps valid ones", async () => {
    memory[STORAGE_INDEX_KEY] = ["bad", "2"];
    memory[snippetKey("bad")] = { id: "bad-only" };
    memory[snippetKey("2")] = {
      id: "2",
      title: "Two",
      sourceUrl: "https://example.com",
      html: "<div></div>",
      jsx: "<div></div>",
      thumbnail: "",
      createdAt: 2,
      width: 10,
      height: 10
    };

    const snippets = await getSnippets();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].id).toBe("2");
  });

  it("preserves renderContext when saving and reading", async () => {
    const snippet: Snippet = {
      id: "ctx-1",
      title: "With context",
      sourceUrl: "https://example.com",
      html: "<div></div>",
      jsx: "<div></div>",
      thumbnail: "",
      createdAt: 1,
      width: 100,
      height: 100,
      renderContext: {
        parentLayout: {
          display: "flex",
          gap: "12px"
        }
      }
    };

    await saveSnippet(snippet);
    const snippets = await getSnippets();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].renderContext).toBeDefined();
    expect(snippets[0].renderContext?.parentLayout?.display).toBe("flex");
    expect(snippets[0].renderContext?.parentLayout?.gap).toBe("12px");
  });

  it("preserves styleBlock and rootId when saving and reading", async () => {
    const snippet: Snippet = {
      id: "style-1",
      title: "With style",
      sourceUrl: "https://example.com",
      html: '<div id="snippet-root-x">x</div>',
      jsx: '<div id="snippet-root-x">x</div>',
      thumbnail: "",
      createdAt: 1,
      width: 100,
      height: 100,
      styleBlock: "#snippet-root-x{display:flex}",
      rootId: "snippet-root-x"
    };

    await saveSnippet(snippet);
    const snippets = await getSnippets();
    expect(snippets[0].styleBlock).toBe("#snippet-root-x{display:flex}");
    expect(snippets[0].rootId).toBe("snippet-root-x");
  });

  it("accepts snippets without renderContext (backward compatible)", async () => {
    const snippet: Snippet = {
      id: "old-1",
      title: "Old snippet",
      sourceUrl: "https://example.com",
      html: "<span></span>",
      jsx: "<span></span>",
      thumbnail: "",
      createdAt: 1,
      width: 50,
      height: 50
    };

    await saveSnippet(snippet);
    const snippets = await getSnippets();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].renderContext).toBeUndefined();
  });

  it("returns snippets sorted by createdAt desc", async () => {
    memory[STORAGE_INDEX_KEY] = ["older", "newer"];
    memory[snippetKey("older")] = {
      id: "older",
      title: "Older",
      sourceUrl: "https://example.com",
      html: "<div></div>",
      jsx: "<div></div>",
      thumbnail: "",
      createdAt: 1,
      width: 10,
      height: 10
    };
    memory[snippetKey("newer")] = {
      id: "newer",
      title: "Newer",
      sourceUrl: "https://example.com",
      html: "<div></div>",
      jsx: "<div></div>",
      thumbnail: "",
      createdAt: 3,
      width: 10,
      height: 10
    };

    const snippets = await getSnippets();
    expect(snippets[0].id).toBe("newer");
    expect(snippets[1].id).toBe("older");
  });

  it("migrates from legacy single-key format and returns snippets", async () => {
    delete memory[STORAGE_INDEX_KEY];
    memory[LEGACY_STORAGE_KEY] = [
      {
        id: "legacy-1",
        title: "Legacy",
        sourceUrl: "https://example.com",
        html: "<div></div>",
        jsx: "<div></div>",
        thumbnail: "",
        createdAt: 1,
        width: 100,
        height: 100
      }
    ];

    const snippets = await getSnippets();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].id).toBe("legacy-1");
    expect(memory[STORAGE_INDEX_KEY]).toEqual(["legacy-1"]);
    expect(memory[snippetKey("legacy-1")]).toBeDefined();
    expect(memory[LEGACY_STORAGE_KEY]).toBeUndefined();
  });

  it("enforces FIFO when maxCount is reached", async () => {
    const older: Snippet = {
      id: "old",
      title: "Older",
      sourceUrl: "https://example.com",
      html: "<div>old</div>",
      jsx: "<div>old</div>",
      thumbnail: "",
      createdAt: 1000,
      width: 10,
      height: 10
    };
    const newer: Snippet = {
      id: "new",
      title: "Newer",
      sourceUrl: "https://example.com",
      html: "<div>new</div>",
      jsx: "<div>new</div>",
      thumbnail: "",
      createdAt: 2000,
      width: 10,
      height: 10
    };

    await saveSnippet(older, 1);
    await saveSnippet(newer, 1);

    const snippets = await getSnippets();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].id).toBe("new");
    expect(await getSnippetById("old")).toBeNull();
  });

  it("does not delete when updating an existing snippet within maxCount", async () => {
    const snippet: Snippet = {
      id: "existing",
      title: "Card",
      sourceUrl: "https://example.com",
      html: "<div></div>",
      jsx: "<div></div>",
      thumbnail: "",
      createdAt: 1,
      width: 10,
      height: 10
    };

    await saveSnippet(snippet, 1);
    const updated = { ...snippet, title: "Updated Card" };
    await saveSnippet(updated, 1);

    const snippets = await getSnippets();
    expect(snippets).toHaveLength(1);
    expect(snippets[0].title).toBe("Updated Card");
  });

  it("getSnippetById reads only the snippet key", async () => {
    memory[STORAGE_INDEX_KEY] = ["1"];
    memory[snippetKey("1")] = {
      id: "1",
      title: "One",
      sourceUrl: "https://example.com",
      html: "<div></div>",
      jsx: "<div></div>",
      thumbnail: "",
      createdAt: 1,
      width: 10,
      height: 10
    };

    const getSpy = vi.mocked(chrome.storage.local.get);
    getSpy.mockClear();

    const snippet = await getSnippetById("1");
    expect(snippet).not.toBeNull();
    expect(snippet?.id).toBe("1");
    expect(getSpy).toHaveBeenCalledTimes(1);
    expect(getSpy).toHaveBeenCalledWith(snippetKey("1"));
  });
});
