import { useState } from "react";
import { DRAG_TYPE_FOLDER, DRAG_TYPE_SNIPPET } from "../../shared/constants";
import type { Folder } from "../../shared/types/folder";

interface LibraryBreadcrumbProps {
  currentFolder: Folder | null;
  foldersById: Map<string, Folder>;
  onNavigate: (folderId: string | null) => void;
  /** When provided and inside a folder, "Library" link accepts snippet drops to move to root. */
  onDropSnippet?: (snippetId: string) => void;
  /** When provided and inside a folder, "Library" link accepts folder drops to move to root. */
  onDropFolder?: (folderId: string) => void;
}

export function LibraryBreadcrumb({
  currentFolder,
  foldersById,
  onNavigate,
  onDropSnippet,
  onDropFolder
}: LibraryBreadcrumbProps): React.ReactElement {
  const [libraryRootDragOver, setLibraryRootDragOver] = useState(false);

  const path: Folder[] = [];
  if (currentFolder !== null) {
    let f: Folder | undefined = currentFolder;
    while (f) {
      path.unshift(f);
      f = f.parentId ? foldersById.get(f.parentId) : undefined;
    }
  }

  const isLibraryRootDropTarget =
    currentFolder !== null && (Boolean(onDropSnippet) || Boolean(onDropFolder));

  function handleLibraryRootDragOver(e: React.DragEvent): void {
    if (!isLibraryRootDropTarget) return;
    if (e.dataTransfer.types.includes(DRAG_TYPE_SNIPPET) || e.dataTransfer.types.includes(DRAG_TYPE_FOLDER)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setLibraryRootDragOver(true);
    }
  }

  function handleLibraryRootDragLeave(e: React.DragEvent): void {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setLibraryRootDragOver(false);
    }
  }

  function handleLibraryRootDrop(e: React.DragEvent): void {
    setLibraryRootDragOver(false);
    if (!isLibraryRootDropTarget) return;
    e.preventDefault();
    if (e.dataTransfer.types.includes(DRAG_TYPE_SNIPPET)) {
      const snippetId = e.dataTransfer.getData(DRAG_TYPE_SNIPPET);
      if (snippetId && onDropSnippet) onDropSnippet(snippetId);
    } else if (e.dataTransfer.types.includes(DRAG_TYPE_FOLDER)) {
      const folderId = e.dataTransfer.getData(DRAG_TYPE_FOLDER);
      if (folderId && onDropFolder) onDropFolder(folderId);
    }
  }

  return (
    <nav className="library-breadcrumb" aria-label="Breadcrumb">
      <ol className="library-breadcrumb-list">
        <li
          className={libraryRootDragOver ? "library-breadcrumb-root-drop is-drag-over" : undefined}
          onDragOver={isLibraryRootDropTarget ? handleLibraryRootDragOver : undefined}
          onDragLeave={isLibraryRootDropTarget ? handleLibraryRootDragLeave : undefined}
          onDrop={isLibraryRootDropTarget ? handleLibraryRootDrop : undefined}
        >
          <button
            type="button"
            className={`library-breadcrumb-link${libraryRootDragOver ? " is-drag-over" : ""}`}
            onClick={() => onNavigate(null)}
            aria-label={
              isLibraryRootDropTarget
                ? "Library. Drop to move snippet or folder here."
                : "Library"
            }
          >
            Library
          </button>
        </li>
        {path.map((folder) => (
          <li key={folder.id} className="library-breadcrumb-item">
            <span className="library-breadcrumb-sep" aria-hidden="true">
              /
            </span>
            <button
              type="button"
              className="library-breadcrumb-link"
              onClick={() => onNavigate(folder.id)}
            >
              {folder.name}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
