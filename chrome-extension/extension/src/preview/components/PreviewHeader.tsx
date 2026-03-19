import { ExternalLink, Save } from "lucide-react";
import type { Snippet } from "../../shared/types/snippet";

const ICON_SIZE = 14;

function formatCapturedDate(ts: number): string {
  const date = new Date(ts);
  const datePart = date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const timePart = date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${datePart} at ${timePart}`;
}

interface PreviewHeaderProps {
  snippet: Snippet;
  hasUnsavedChanges: boolean;
  saving: boolean;
  saveSuccess: boolean;
  onSave: () => void;
}

export function PreviewHeader({ snippet, hasUnsavedChanges, saving, saveSuccess, onSave }: PreviewHeaderProps) {
  const saveLabel = saving ? "Saving..." : saveSuccess ? "Saved" : "Save";

  return (
    <header className="preview-header">
      <div className="preview-header-left">
        <h1 className="preview-header-title">{snippet.title}</h1>
        <div className="preview-header-meta">
          <a
            href={snippet.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="preview-header-url"
            title={snippet.sourceUrl}
          >
            {snippet.sourceUrl}
            <ExternalLink size={ICON_SIZE} aria-hidden />
          </a>
          <span className="preview-header-sep" aria-hidden>·</span>
          <span className="preview-header-date">{formatCapturedDate(snippet.createdAt)}</span>
        </div>
      </div>
      <div className="preview-header-right">
        {hasUnsavedChanges && !saving && (
          <span className="preview-unsaved-badge">Unsaved changes</span>
        )}
        <button
          type="button"
          className={`preview-save-btn${saveSuccess ? " preview-save-btn-success" : ""}`}
          onClick={onSave}
          disabled={!hasUnsavedChanges || saving}
          aria-label="Save changes"
        >
          <Save size={ICON_SIZE} aria-hidden />
          {saveLabel}
        </button>
      </div>
    </header>
  );
}
