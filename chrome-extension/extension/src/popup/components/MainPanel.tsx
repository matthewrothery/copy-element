import { ChevronRight, Copy } from "lucide-react";
import type { JSX } from "react";
import type { Snippet } from "../../shared/types/snippet";

type MainPanelProps = {
  snippetCount: number;
  recentSnippets: Snippet[];
  onOpenLibrary: (snippetId?: string) => void;
  onCopyPrompt: (snippet: Snippet) => void;
};

function getDomain(sourceUrl: string): string {
  try {
    return new URL(sourceUrl).hostname;
  } catch {
    return sourceUrl;
  }
}

function libraryCountLabel(count: number): string {
  return count === 1 ? "1 item in library" : `${count} items in library`;
}

export function MainPanel({
  snippetCount,
  recentSnippets,
  onOpenLibrary,
  onCopyPrompt
}: MainPanelProps): JSX.Element {
  return (
    <section className="popup-home" aria-label="Capture workflow overview">
      <div className="recent-captures-header">
        <h2 className="recent-captures-title">Recent captures</h2>
        <button
          type="button"
          className="main-panel-chip main-panel-chip-link"
          onClick={() => onOpenLibrary()}
          aria-label={`Open library (${libraryCountLabel(snippetCount)})`}
          aria-live="polite"
        >
          <span className="main-panel-chip-text">{libraryCountLabel(snippetCount)}</span>
          <ChevronRight size={14} aria-hidden />
        </button>
      </div>
      {recentSnippets.length === 0 ? (
        <p className="recent-captures-empty">Capture an element to see it here.</p>
      ) : (
        <ul className="recent-captures-list" aria-label="Recent captures">
          {recentSnippets.map((snippet) => (
            <li key={snippet.id} className="recent-capture-item">
              <div className="recent-capture-row">
                <span className="recent-capture-thumb">
                  {snippet.thumbnail ? (
                    <img src={snippet.thumbnail} alt="" className="recent-capture-thumb-img" />
                  ) : (
                    <span className="recent-capture-thumb-fallback" />
                  )}
                </span>
                <span className="recent-capture-meta">
                  <span className="recent-capture-name">{snippet.title}</span>
                  <span className="recent-capture-description">{getDomain(snippet.sourceUrl)}</span>
                </span>
              </div>
              <button
                type="button"
                className="recent-capture-cta recent-capture-cta-icon btn-secondary"
                onClick={() => onCopyPrompt(snippet)}
                aria-label="Copy prompt"
              >
                <Copy size={16} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
