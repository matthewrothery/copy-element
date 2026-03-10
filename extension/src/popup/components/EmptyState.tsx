import React from "react";

interface EmptyStateProps {
  onCapture: () => void;
  showCaptureButton?: boolean;
}

const EMPTY_ILLUSTRATION_SVG = (
  <svg
    className="empty-state-illustration"
    width="120"
    height="80"
    viewBox="0 0 120 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <rect x="10" y="10" width="100" height="60" rx="8" fill="var(--color-surface-alt)" stroke="var(--color-border)" strokeWidth="1" />
    <rect x="20" y="25" width="40" height="8" rx="4" fill="var(--color-border)" />
    <rect x="20" y="40" width="60" height="8" rx="4" fill="var(--color-border)" />
    <rect x="20" y="55" width="50" height="8" rx="4" fill="var(--color-border)" />
  </svg>
);

export function EmptyState({ onCapture, showCaptureButton = true }: EmptyStateProps): JSX.Element {
  const isLibrary = !showCaptureButton;
  return (
    <div className="empty-state">
      {EMPTY_ILLUSTRATION_SVG}
      <h2>No snippets yet</h2>
      <p>
        {isLibrary
          ? "Open the extension popup and click Capture to add UI elements from any website."
          : "Use the extension popup to capture UI elements from websites."}
      </p>
      {showCaptureButton && (
        <button className="btn-primary primary-button" onClick={onCapture} type="button" aria-label="Capture first element">
          Capture Element
        </button>
      )}
    </div>
  );
}
