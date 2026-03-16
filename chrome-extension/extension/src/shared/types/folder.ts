/**
 * Folder for organizing snippets in the library.
 * parentId null = root-level folder.
 */
export interface Folder {
  id: string;
  name: string;
  /** null = root. Otherwise id of parent folder. */
  parentId: string | null;
  createdAt: number;
  /** Optional sort order within same parent (lower first). */
  order?: number;
}
