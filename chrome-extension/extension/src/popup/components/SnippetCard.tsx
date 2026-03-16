import { useRef, useState, useEffect } from "react";
import { Code, Copy, Eye, MoreVertical, Trash2 } from "lucide-react";
import { TAILWIND_COPY_PLACEHOLDER } from "../../shared/constants";
import { buildCopyHtml } from "../../shared/utils/preview-srcdoc-builder";
import type { Snippet } from "../../shared/types/snippet";
import { buildCopyMcpPrompt, buildSnippetPrompt } from "../../shared/utils/prompt-builder";

const ICON_SIZE = 16;

function formatSnippetDate(createdAt: number): string {
  return new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric"
  });
}

function getHostname(sourceUrl: string): string {
  try {
    return new URL(sourceUrl).hostname;
  } catch {
    return sourceUrl;
  }
}

interface SnippetCardProps {
  snippet: Snippet;
  onOpen: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onCopy: (value: string, label: string) => void;
}

export function SnippetCard({ snippet, onOpen, onDelete, onCopy }: SnippetCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const meta = `${getHostname(snippet.sourceUrl)} · ${formatSnippetDate(snippet.createdAt)}`;

  return (
    <article className="snippet-card">
      <button
        className="thumbnail-button"
        onClick={() => onOpen(snippet)}
        type="button"
        aria-label={`Open ${snippet.title}`}
      >
        {snippet.thumbnail ? (
          <img src={snippet.thumbnail} alt={snippet.title} className="thumbnail" />
        ) : (
          <div className="thumbnail-fallback" />
        )}
      </button>
      <div className="snippet-meta">
        <h3 className="snippet-card-title" title={snippet.title}>
          {snippet.title}
        </h3>
        <p className="snippet-card-meta">{meta}</p>
      </div>
      <div className="snippet-actions snippet-actions-primary">
        <button
          type="button"
          className="btn-secondary btn-primary-action"
          onClick={() => onCopy(buildSnippetPrompt(snippet), "Prompt")}
          aria-label="Copy prompt"
        >
          <Copy size={ICON_SIZE} aria-hidden />
          Copy prompt
        </button>
        <button
          type="button"
          className="btn-secondary btn-primary-action"
          onClick={() => onCopy(buildCopyHtml(snippet), "Code")}
          aria-label="Copy code"
        >
          <Copy size={ICON_SIZE} aria-hidden />
          Copy code
        </button>
      </div>
      <div className="snippet-actions snippet-actions-secondary">
        <button type="button" className="btn-secondary" onClick={() => onOpen(snippet)} aria-label={`Preview ${snippet.title}`}>
          <Eye size={ICON_SIZE} aria-hidden />
          Preview
        </button>
        <div className="snippet-card-more" ref={menuRef}>
          <button
            type="button"
            className="btn-icon-only"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="More options"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <MoreVertical size={ICON_SIZE} aria-hidden />
          </button>
          {menuOpen && (
            <div className="snippet-card-dropdown" role="menu">
              <button
                type="button"
                role="menuitem"
                className="snippet-card-dropdown-item"
                onClick={() => {
                  onCopy(snippet.jsx, "JSX");
                  setMenuOpen(false);
                }}
              >
                <Code size={ICON_SIZE} aria-hidden />
                Copy JSX
              </button>
              <button
                type="button"
                role="menuitem"
                className="snippet-card-dropdown-item"
                onClick={() => {
                  onCopy(buildCopyMcpPrompt(snippet), "MCP");
                  setMenuOpen(false);
                }}
              >
                <Copy size={ICON_SIZE} aria-hidden />
                Copy MCP
              </button>
              <button
                type="button"
                role="menuitem"
                className="snippet-card-dropdown-item"
                onClick={() => {
                  onCopy(TAILWIND_COPY_PLACEHOLDER, "Tailwind");
                  setMenuOpen(false);
                }}
              >
                <Code size={ICON_SIZE} aria-hidden />
                Copy Tailwind
              </button>
              <button
                type="button"
                role="menuitem"
                className="snippet-card-dropdown-item snippet-card-dropdown-item-danger"
                onClick={() => {
                  onDelete(snippet.id);
                  setMenuOpen(false);
                }}
              >
                <Trash2 size={ICON_SIZE} aria-hidden />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
