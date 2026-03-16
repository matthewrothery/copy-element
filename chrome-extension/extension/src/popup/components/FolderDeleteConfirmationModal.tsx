import { createPortal } from "react-dom";
import type { Folder } from "../../shared/types/folder";

interface FolderDeleteConfirmationModalProps {
  folder: Folder;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FolderDeleteConfirmationModal({
  folder,
  onConfirm,
  onCancel
}: FolderDeleteConfirmationModalProps): React.JSX.Element {
  const content = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="folder-delete-title"
      aria-describedby="folder-delete-desc"
    >
      <div className="modal delete-confirmation-modal">
        <h2 id="folder-delete-title">Delete folder?</h2>
        <p id="folder-delete-desc" className="delete-confirmation-desc">
          &quot;{folder.name}&quot; will be deleted. Snippets inside will be moved to Library.
        </p>
        <div className="modal-actions modal-actions-spaced modal-actions-right">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <span className="modal-actions-spacer" aria-hidden="true" />
          <button type="button" className="btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
