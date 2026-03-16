import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Folder } from "../../shared/types/folder";

interface RenameFolderModalProps {
  folder: Folder;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export function RenameFolderModal({
  folder,
  onSave,
  onCancel
}: RenameFolderModalProps): React.JSX.Element {
  const [name, setName] = useState(folder.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onSave(trimmed);
    }
  };

  const content = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rename-folder-title"
    >
      <div className="modal new-folder-modal">
        <h2 id="rename-folder-title">Rename folder</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="rename-folder-input" className="sr-only">
            Folder name
          </label>
          <input
            id="rename-folder-input"
            ref={inputRef}
            type="text"
            className="library-search new-folder-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Folder name"
            aria-label="Folder name"
            autoComplete="off"
          />
          <div className="modal-actions modal-actions-spaced modal-actions-right">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <span className="modal-actions-spacer" aria-hidden="true" />
            <button type="submit" className="btn-primary" disabled={!name.trim()}>
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
