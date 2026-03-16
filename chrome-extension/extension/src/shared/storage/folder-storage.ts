import type { Folder } from "../types/folder";

const STORAGE_INDEX_KEY = "element-capture-folder-ids";
const STORAGE_ITEM_PREFIX = "element-capture-folder:";

function folderKey(id: string): string {
  return `${STORAGE_ITEM_PREFIX}${id}`;
}

interface StorageIndexShape {
  [key: string]: string[] | undefined;
}

function isFolderRecord(value: unknown): value is Folder {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    (record.parentId === null || typeof record.parentId === "string") &&
    typeof record.createdAt === "number"
  );
}

function sortFolders(folders: Folder[]): Folder[] {
  return [...folders].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    return a.createdAt - b.createdAt;
  });
}

export async function getFolders(): Promise<Folder[]> {
  const indexResult = (await chrome.storage.local.get(STORAGE_INDEX_KEY)) as StorageIndexShape;
  const ids: string[] = indexResult[STORAGE_INDEX_KEY] ?? [];
  if (ids.length === 0) {
    return [];
  }
  const keys = ids.map(folderKey);
  const items = await chrome.storage.local.get(keys);
  const folders: Folder[] = [];
  for (const id of ids) {
    const raw = items[folderKey(id)];
    if (raw && isFolderRecord(raw)) {
      folders.push({ ...raw, order: typeof raw.order === "number" ? raw.order : undefined });
    }
  }
  return sortFolders(folders);
}

export async function getFolderById(id: string): Promise<Folder | null> {
  const result = await chrome.storage.local.get(folderKey(id));
  const raw = result[folderKey(id)];
  if (!raw || !isFolderRecord(raw)) {
    return null;
  }
  return { ...raw, order: typeof raw.order === "number" ? raw.order : undefined };
}

/** Get folders that are direct children of parentId (null = root). */
export async function getFoldersByParent(parentId: string | null): Promise<Folder[]> {
  const all = await getFolders();
  return all.filter((f) => f.parentId === parentId);
}

export async function saveFolder(folder: Folder): Promise<void> {
  const indexResult = (await chrome.storage.local.get(STORAGE_INDEX_KEY)) as StorageIndexShape;
  let ids: string[] = indexResult[STORAGE_INDEX_KEY] ?? [];
  if (!ids.includes(folder.id)) {
    ids = [...ids, folder.id];
  }
  await chrome.storage.local.set({
    [folderKey(folder.id)]: folder,
    [STORAGE_INDEX_KEY]: ids
  });
}

export async function deleteFolder(id: string): Promise<void> {
  const indexResult = (await chrome.storage.local.get(STORAGE_INDEX_KEY)) as StorageIndexShape;
  const ids = indexResult[STORAGE_INDEX_KEY] ?? [];
  await chrome.storage.local.remove(folderKey(id));
  await chrome.storage.local.set({ [STORAGE_INDEX_KEY]: ids.filter((x) => x !== id) });
}
