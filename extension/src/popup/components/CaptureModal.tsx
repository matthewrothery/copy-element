import React from "react";
import type { CapturedElementData } from "../../shared/types/snippet";

interface CaptureModalProps {
  capture: CapturedElementData;
  onSave: () => void;
  onCancel: () => void;
}

export function CaptureModal({ capture, onSave, onCancel }: CaptureModalProps): JSX.Element {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>Element Captured</h2>
        <div className="capture-preview" dangerouslySetInnerHTML={{ __html: capture.html }} />
        <p className="meta">{capture.elementLabel}</p>
        <p className="meta">
          {capture.width} x {capture.height}
        </p>
        <div className="modal-actions right">
          <button type="button" onClick={onCancel} aria-label="Cancel save">
            Cancel
          </button>
          <button type="button" className="primary-button" onClick={onSave} aria-label="Save snippet">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
