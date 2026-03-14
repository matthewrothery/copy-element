import { createPortal } from "react-dom";

interface DeleteConfirmationModalProps {
  snippetTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  snippetTitle,
  onConfirm,
  onCancel
}: DeleteConfirmationModalProps): React.JSX.Element {
  const content = (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirmation-title"
      aria-describedby="delete-confirmation-desc"
    >
      <div className="modal delete-confirmation-modal">
        <h2 id="delete-confirmation-title">
          Delete snippet?
        </h2>
        <p id="delete-confirmation-desc" className="delete-confirmation-desc">
          &quot;{snippetTitle}&quot; will be permanently removed from your library.
        </p>
        <div className="modal-actions modal-actions-spaced modal-actions-right">
          <button type="button" className="btn-secondary" onClick={onCancel} aria-label="Cancel">
            Cancel
          </button>
          <span className="modal-actions-spacer" aria-hidden="true" />
          <button type="button" className="btn-danger" onClick={onConfirm} aria-label="Delete snippet">
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
