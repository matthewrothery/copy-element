import React from "react";
import { buildCopyHtml, buildPreviewSrcDoc } from "../../shared/utils/preview-srcdoc-builder";
import type { Snippet } from "../../shared/types/snippet";

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

interface SnippetPreviewProps {
  snippet: Snippet;
  onClose: () => void;
  onCopy: (value: string, label: string) => void;
}

export function SnippetPreview({ snippet, onClose, onCopy }: SnippetPreviewProps): React.JSX.Element {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Snippet preview">
      <div className="modal snippet-preview-modal">
        <h2 className="snippet-preview-title">{snippet.title}</h2>
        <div className="snippet-preview-frame">
          <iframe
            title={`preview-${snippet.id}`}
            srcDoc={buildPreviewSrcDoc(snippet)}
            sandbox=""
            style={{
              width: Math.max(snippet.width, 1),
              height: Math.max(snippet.height, 1)
            }}
          />
        </div>
        <div className="snippet-preview-meta">
          <p className="meta">
            <span className="meta-label">Source:</span> {getHostname(snippet.sourceUrl)}
          </p>
          <p className="meta">
            <span className="meta-label">Dimensions:</span> {snippet.width} × {snippet.height}
          </p>
        </div>
        <div className="modal-actions modal-actions-spaced">
          <button type="button" className="btn-secondary" onClick={onClose} aria-label="Close preview">
            Close
          </button>
          <span className="modal-actions-spacer" aria-hidden="true" />
          <button type="button" className="btn-primary" onClick={() => onCopy(buildCopyHtml(snippet), "HTML")} aria-label="Copy HTML">
            Copy HTML
          </button>
          <button type="button" className="btn-primary" onClick={() => onCopy(snippet.jsx, "JSX")} aria-label="Copy JSX">
            Copy JSX
          </button>
        </div>
      </div>
    </div>
  );
}
