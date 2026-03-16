import type { Folder } from "../../shared/types/folder";

interface LibraryBreadcrumbProps {
  currentFolder: Folder | null;
  foldersById: Map<string, Folder>;
  onNavigate: (folderId: string | null) => void;
}

export function LibraryBreadcrumb({
  currentFolder,
  foldersById,
  onNavigate
}: LibraryBreadcrumbProps): React.ReactElement | null {
  if (currentFolder === null) {
    return null;
  }

  const path: Folder[] = [];
  let f: Folder | undefined = currentFolder;
  while (f) {
    path.unshift(f);
    f = f.parentId ? foldersById.get(f.parentId) : undefined;
  }

  return (
    <nav className="library-breadcrumb" aria-label="Breadcrumb">
      <ol className="library-breadcrumb-list">
        <li>
          <button
            type="button"
            className="library-breadcrumb-link"
            onClick={() => onNavigate(null)}
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
