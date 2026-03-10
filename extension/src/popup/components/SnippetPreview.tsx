import React from "react";
import type { Snippet } from "../../shared/types/snippet";

interface SnippetPreviewProps {
  snippet: Snippet;
  onClose: () => void;
  onCopy: (value: string, label: string) => void;
}

export function SnippetPreview({ snippet, onClose, onCopy }: SnippetPreviewProps): JSX.Element {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h2>{snippet.title}</h2>
        <div className="snippet-preview-frame">
          <iframe title={`preview-${snippet.id}`} srcDoc={snippet.html} sandbox="" />
        </div>
        <p className="meta">{snippet.sourceUrl}</p>
        <p className="meta">
          {snippet.width} x {snippet.height}
        </p>
        <div className="modal-actions">
          <button type="button" onClick={() => onCopy(snippet.html, "HTML")} aria-label="Copy HTML">
            Copy HTML
          </button>
          <button type="button" onClick={() => onCopy(snippet.jsx, "JSX")} aria-label="Copy JSX">
            Copy JSX
          </button>
          <button type="button" onClick={onClose} aria-label="Close preview">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
