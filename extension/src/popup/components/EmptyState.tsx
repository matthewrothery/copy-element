import React from "react";

interface EmptyStateProps {
  onCapture: () => void;
  showCaptureButton?: boolean;
}

export function EmptyState({ onCapture, showCaptureButton = true }: EmptyStateProps): JSX.Element {
  return (
    <div className="empty-state">
      <h2>No snippets yet</h2>
      <p>Use the extension popup to capture UI elements from websites.</p>
      {showCaptureButton && (
        <button className="primary-button" onClick={onCapture} type="button" aria-label="Capture first element">
          Capture Element
        </button>
      )}
    </div>
  );
}
