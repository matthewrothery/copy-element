import { useRef, useState, useEffect } from "react";
import { Folder as FolderIcon, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DRAG_TYPE_FOLDER, DRAG_TYPE_SNIPPET } from "../../shared/constants";
import type { Folder } from "../../shared/types/folder";

const ICON_SIZE = 20;

interface FolderCardProps {
  folder: Folder;
  snippetCount: number;
  subfolderCount?: number;
  onOpen: (folder: Folder) => void;
  onRename: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
  /** When provided, the card accepts snippet drops to move a snippet into this folder. */
  onDropSnippet?: (snippetId: string) => void;
  /** When provided, the card accepts folder drops to move a folder into this folder. */
  onDropFolder?: (folderId: string) => void;
}

function formatCount(snippetCount: number, subfolderCount: number): string {
  const parts: string[] = [];
  if (snippetCount === 1) {
    parts.push("1 snippet");
  } else if (snippetCount !== 0) {
    parts.push(`${snippetCount} snippets`);
  }
  if (subfolderCount === 1) {
    parts.push("1 folder");
  } else if (subfolderCount > 1) {
    parts.push(`${subfolderCount} folders`);
  }
  if (parts.length === 0) return "No snippets";
  return parts.join(" · ");
}

export function FolderCard({
  folder,
  snippetCount,
  subfolderCount = 0,
  onOpen,
  onRename,
  onDelete,
  onDropSnippet,
  onDropFolder
}: FolderCardProps): React.ReactElement {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isDropTarget = Boolean(onDropSnippet || onDropFolder);

  function handleDragStart(e: React.DragEvent): void {
    e.dataTransfer.setData(DRAG_TYPE_FOLDER, folder.id);
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
  }

  function handleDragEnd(): void {
    setIsDragging(false);
  }

  function handleDragOver(e: React.DragEvent): void {
    if (!isDropTarget) return;
    if (e.dataTransfer.types.includes(DRAG_TYPE_SNIPPET) || e.dataTransfer.types.includes(DRAG_TYPE_FOLDER)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setIsDragOver(true);
    }
  }

  function handleDragLeave(e: React.DragEvent): void {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }

  function handleDrop(e: React.DragEvent): void {
    setIsDragOver(false);
    if (!isDropTarget) return;
    e.preventDefault();
    if (e.dataTransfer.types.includes(DRAG_TYPE_SNIPPET)) {
      const snippetId = e.dataTransfer.getData(DRAG_TYPE_SNIPPET);
      if (snippetId && onDropSnippet) onDropSnippet(snippetId);
    } else if (e.dataTransfer.types.includes(DRAG_TYPE_FOLDER)) {
      const folderId = e.dataTransfer.getData(DRAG_TYPE_FOLDER);
      if (folderId && folderId !== folder.id && onDropFolder) onDropFolder(folderId);
    }
  }

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const subtitle = formatCount(snippetCount, subfolderCount);

  return (
    <article
      className={`folder-card${isDragOver ? " is-drag-over" : ""}${isDragging ? " is-dragging" : ""}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={isDropTarget ? handleDragOver : undefined}
      onDragLeave={isDropTarget ? handleDragLeave : undefined}
      onDrop={isDropTarget ? handleDrop : undefined}
      aria-label={
        isDropTarget
          ? `${folder.name} folder. ${subtitle} Drop to move here.`
          : undefined
      }
    >
      <button
        type="button"
        className="folder-card-main"
        onClick={() => onOpen(folder)}
        aria-label={`${folder.name} folder. ${subtitle}`}
      >
        <FolderIcon size={ICON_SIZE} className="folder-card-icon" aria-hidden />
        <div className="folder-card-content">
          <span className="folder-card-name" title={folder.name}>
            {folder.name}
          </span>
          <span className="folder-card-subtitle">{subtitle}</span>
        </div>
      </button>
      <div className="folder-card-more" ref={menuRef}>
        <button
          type="button"
          className="btn-icon-only"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          aria-label="Folder options"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          <MoreVertical size={ICON_SIZE} aria-hidden />
        </button>
        {menuOpen && (
          <div className="folder-card-dropdown" role="menu">
            <button
              type="button"
              role="menuitem"
              className="folder-card-dropdown-item"
              onClick={() => {
                onRename(folder);
                setMenuOpen(false);
              }}
            >
              <Pencil size={ICON_SIZE} aria-hidden />
              Rename
            </button>
            <button
              type="button"
              role="menuitem"
              className="folder-card-dropdown-item folder-card-dropdown-item-danger"
              onClick={() => {
                onDelete(folder);
                setMenuOpen(false);
              }}
            >
              <Trash2 size={ICON_SIZE} aria-hidden />
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
