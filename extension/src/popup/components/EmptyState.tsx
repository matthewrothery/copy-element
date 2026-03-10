import React from "react";

interface EmptyStateProps {
  onCapture: () => void;
}

export function EmptyState({ onCapture }: EmptyStateProps): JSX.Element {
  return (
    <div className="empty-state">
      <h2>No snippets yet</h2>
      <p>Capture UI elements from websites to build your snippet library.</p>
      <button className="primary-button" onClick={onCapture} type="button" aria-label="Capture first element">
        Capture Element
      </button>
    </div>
  );
}
