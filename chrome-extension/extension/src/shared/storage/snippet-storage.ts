import type { RenderContext, Snippet } from "../types/snippet";

const STORAGE_INDEX_KEY = "element-capture-snippet-ids";
const STORAGE_ITEM_PREFIX = "element-capture-snippet:";
const LEGACY_STORAGE_KEY = "element-capture-snippets";

/**
 * chrome.storage.local has an 8 KB per-item limit. We use one key per snippet
 * (SnipCSS-style) plus a small index key so the whole array is never in one
 * key. A single very large snippet (e.g. huge HTML/thumbnail) can still exceed
 * 8 KB; saveSnippet surfaces a clear error in that case.
 */
function snippetKey(id: string): string {
  return `${STORAGE_ITEM_PREFIX}${id}`;
}

interface StorageIndexShape {
  [key: string]: string[] | undefined;
}

interface LegacyStorageShape {
  [key: string]: unknown;
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
  if (value.folderId === null || typeof value.folderId === "string") {
    normalized.folderId = value.folderId;
  }
  if (
    value.syncStatus === 'pending' ||
    value.syncStatus === 'syncing' ||
    value.syncStatus === 'synced' ||
    value.syncStatus === 'failed'
  ) {
    normalized.syncStatus = value.syncStatus;
  }
  if (typeof value.serverCaptureId === 'string') {
    normalized.serverCaptureId = value.serverCaptureId;
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

async function migrateFromLegacy(): Promise<Snippet[]> {
  const result = (await chrome.storage.local.get(LEGACY_STORAGE_KEY)) as LegacyStorageShape;
  const raw = result[LEGACY_STORAGE_KEY];
  const snippets = parseSnippets(raw);
  if (snippets.length === 0) {
    await chrome.storage.local.set({ [STORAGE_INDEX_KEY]: [] });
    return [];
  }
  const ids = snippets.map((s) => s.id);
  const updates: Record<string, Snippet | string[]> = { [STORAGE_INDEX_KEY]: ids };
  for (const s of snippets) {
    updates[snippetKey(s.id)] = normalizeSnippet(s);
  }
  await chrome.storage.local.set(updates);
  await chrome.storage.local.remove(LEGACY_STORAGE_KEY);
  return sortSnippets(snippets);
}

export async function getSnippets(): Promise<Snippet[]> {
  const indexResult = (await chrome.storage.local.get(STORAGE_INDEX_KEY)) as StorageIndexShape;
  let ids = indexResult[STORAGE_INDEX_KEY];

  if (!ids || ids.length === 0) {
    const legacy = (await chrome.storage.local.get(LEGACY_STORAGE_KEY)) as LegacyStorageShape;
    if (legacy[LEGACY_STORAGE_KEY] !== undefined) {
      return migrateFromLegacy();
    }
    return [];
  }

  const keys = ids.map(snippetKey);
  const items = await chrome.storage.local.get(keys);
  const snippets: Snippet[] = [];
  for (const id of ids) {
    const raw = items[snippetKey(id)];
    if (raw && isSnippetRecord(raw)) {
      snippets.push(normalizeSnippet(raw));
    }
  }
  return sortSnippets(snippets);
}

export async function saveSnippet(snippet: Snippet): Promise<void> {
  const normalized = normalizeSnippet(snippet);
  const indexResult = (await chrome.storage.local.get(STORAGE_INDEX_KEY)) as StorageIndexShape;
  let ids: string[] = indexResult[STORAGE_INDEX_KEY] ?? [];
  if (!ids.includes(snippet.id)) {
    ids = [snippet.id, ...ids];
  }
  const updates: Record<string, Snippet | string[]> = {
    [snippetKey(snippet.id)]: normalized,
    [STORAGE_INDEX_KEY]: ids
  };
  await chrome.storage.local.set(updates);
  if (typeof chrome.runtime?.lastError?.message === "string") {
    throw new Error("Snippet too large to save. Try a smaller capture or reduce thumbnail size.");
  }
}

export async function deleteSnippet(id: string): Promise<void> {
  const indexResult = (await chrome.storage.local.get(STORAGE_INDEX_KEY)) as StorageIndexShape;
  const ids = indexResult[STORAGE_INDEX_KEY] ?? [];
  const updatedIds = ids.filter((x) => x !== id);
  await chrome.storage.local.remove(snippetKey(id));
  await chrome.storage.local.set({ [STORAGE_INDEX_KEY]: updatedIds });
}

export async function getSnippetById(id: string): Promise<Snippet | null> {
  const result = await chrome.storage.local.get(snippetKey(id));
  const raw = result[snippetKey(id)];
  if (!raw || !isSnippetRecord(raw)) {
    return null;
  }
  return normalizeSnippet(raw);
}
