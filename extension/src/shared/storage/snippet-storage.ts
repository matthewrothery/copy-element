import type { RenderContext, Snippet } from "../types/snippet";

const STORAGE_KEY = "element-capture-snippets";

interface SnippetStorageShape {
  [STORAGE_KEY]?: unknown;
}

function isRenderContext(value: unknown): value is RenderContext {
  if (!value || typeof value !== "object") {
    return false;
  }
  const obj = value as Record<string, unknown>;
  if (obj.parentLayout && typeof obj.parentLayout !== "object") {
    return false;
  }
  return true;
}

function isSnippetRecord(value: unknown): value is Snippet {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.sourceUrl === "string" &&
    typeof record.html === "string" &&
    typeof record.jsx === "string" &&
    typeof record.createdAt === "number" &&
    typeof record.width === "number" &&
    typeof record.height === "number"
  );
}

function normalizeSnippet(value: Snippet): Snippet {
  const normalized: Snippet = {
    ...value,
    thumbnail: typeof value.thumbnail === "string" ? value.thumbnail : ""
  };
  if (isRenderContext(value.renderContext)) {
    normalized.renderContext = value.renderContext;
  }
  if (typeof value.styleBlock === "string") {
    normalized.styleBlock = value.styleBlock;
  }
  if (typeof value.rootId === "string") {
    normalized.rootId = value.rootId;
  }
  return normalized;
}

function sortSnippets(snippets: Snippet[]): Snippet[] {
  return [...snippets].sort((a, b) => b.createdAt - a.createdAt);
}

function parseSnippets(raw: unknown): Snippet[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const valid = raw.filter(isSnippetRecord).map(normalizeSnippet);
  return sortSnippets(valid);
}

export async function getSnippets(): Promise<Snippet[]> {
  const result = (await chrome.storage.local.get(STORAGE_KEY)) as SnippetStorageShape;
  return parseSnippets(result[STORAGE_KEY]);
}

export async function saveSnippet(snippet: Snippet): Promise<void> {
  const snippets = await getSnippets();
  const updated = sortSnippets([normalizeSnippet(snippet), ...snippets]);
  await chrome.storage.local.set({ [STORAGE_KEY]: updated });
}

export async function deleteSnippet(id: string): Promise<void> {
  const snippets = await getSnippets();
  const updated = snippets.filter((item) => item.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEY]: updated });
}

export async function getSnippetById(id: string): Promise<Snippet | null> {
  const snippets = await getSnippets();
  return snippets.find((item) => item.id === id) ?? null;
}
