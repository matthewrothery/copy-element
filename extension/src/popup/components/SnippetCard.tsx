import React from "react";
import type { Snippet } from "../../shared/types/snippet";

interface SnippetCardProps {
  snippet: Snippet;
  onOpen: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onCopy: (value: string, label: string) => void;
}

export function SnippetCard({ snippet, onOpen, onDelete, onCopy }: SnippetCardProps): JSX.Element {
  return (
    <article className="snippet-card">
      <button className="thumbnail-button" onClick={() => onOpen(snippet)} type="button" aria-label={`Open ${snippet.title}`}>
        {snippet.thumbnail ? <img src={snippet.thumbnail} alt={snippet.title} className="thumbnail" /> : <div className="thumbnail-fallback" />}
      </button>
      <div className="snippet-meta">
        <h3>{snippet.title}</h3>
        <p>{new URL(snippet.sourceUrl).hostname}</p>
      </div>
      <div className="snippet-actions">
        <button type="button" onClick={() => onCopy(snippet.html, "HTML")} aria-label="Copy HTML">
          Copy HTML
        </button>
        <button type="button" onClick={() => onCopy(snippet.jsx, "JSX")} aria-label="Copy JSX">
          Copy JSX
        </button>
        <button type="button" onClick={() => onDelete(snippet.id)} aria-label="Delete snippet">
          Delete
        </button>
      </div>
    </article>
  );
}
