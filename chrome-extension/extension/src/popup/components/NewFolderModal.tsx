import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface NewFolderModalProps {
  parentFolderId: string | null;
  onCreate: (name: string) => void;
  onCancel: () => void;
}

export function NewFolderModal({
  onCreate,
  onCancel
}: NewFolderModalProps): React.JSX.Element {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onCreate(trimmed);
    }
  };

  const content = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-folder-title"
    >
      <div className="modal new-folder-modal">
        <h2 id="new-folder-title">New folder</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="new-folder-input" className="sr-only">
            Folder name
          </label>
          <input
            id="new-folder-input"
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
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
