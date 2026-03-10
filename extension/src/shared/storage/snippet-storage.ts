import type { Snippet } from "../types/snippet";

const STORAGE_KEY = "element-capture-snippets";

interface SnippetStorageShape {
  [STORAGE_KEY]?: Snippet[];
}

export async function getSnippets(): Promise<Snippet[]> {
  const result = (await chrome.storage.local.get(STORAGE_KEY)) as SnippetStorageShape;
  return result[STORAGE_KEY] ?? [];
}

export async function saveSnippet(snippet: Snippet): Promise<void> {
  const snippets = await getSnippets();
  const updated = [snippet, ...snippets];
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
