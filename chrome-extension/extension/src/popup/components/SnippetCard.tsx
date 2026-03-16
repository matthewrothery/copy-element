import { Code, Copy, Eye, Trash2 } from "lucide-react";
import { TAILWIND_COPY_PLACEHOLDER } from "../../shared/constants";
import { buildCopyHtml } from "../../shared/utils/preview-srcdoc-builder";
import type { Snippet } from "../../shared/types/snippet";
import { buildCopyMcpPrompt, buildSnippetPrompt, getSnippetPromptTokenEstimate } from "../../shared/utils/prompt-builder";

const ICON_SIZE = 16;

interface SnippetCardProps {
  snippet: Snippet;
  onOpen: (snippet: Snippet) => void;
  onDelete: (id: string) => void;
  onCopy: (value: string, label: string) => void;
}

export function SnippetCard({ snippet, onOpen, onDelete, onCopy }: SnippetCardProps) {
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
        {/* <button type="button" className="btn-secondary" onClick={() => onOpen(snippet)} aria-label={`Preview ${snippet.title}`}>
          <Eye size={ICON_SIZE} />
          Preview
        </button> */}
        {/* <button type="button" className="btn-secondary" onClick={() => onCopy(buildCopyHtml(snippet), "HTML")} aria-label="Copy HTML">
          <Copy size={ICON_SIZE} />
          Copy HTML
        </button> */}
        <button type="button" className="btn-secondary" onClick={() => onCopy(buildSnippetPrompt(snippet), "Prompt")} aria-label="Copy Prompt">
          <Copy size={ICON_SIZE} />
          Copy Prompt
        </button>
        <button type="button" className="btn-secondary" onClick={() => onCopy(buildCopyMcpPrompt(snippet), "MCP")} aria-label="Copy MCP">
          <Copy size={ICON_SIZE} />
          Copy MCP
        </button>
        <button type="button" className="btn-secondary" onClick={() => onCopy(buildCopyHtml(snippet), "Code")} aria-label="Copy code">
          <Copy size={ICON_SIZE} />
          Copy code
        </button>
        {/* <button type="button" className="btn-secondary" onClick={() => onCopy(snippet.jsx, "JSX")} aria-label="Copy JSX">
          <Code size={ICON_SIZE} />
          Copy JSX
        </button>
        <button type="button" className="btn-secondary" onClick={() => onCopy(TAILWIND_COPY_PLACEHOLDER, "Tailwind")} aria-label="Copy Tailwind">
          <Code size={ICON_SIZE} />
          Copy Tailwind
        </button> */}
        <button type="button" className="btn-danger" onClick={() => onDelete(snippet.id)} aria-label="Delete snippet">
          <Trash2 size={ICON_SIZE} />
          Delete
        </button>
      </div>
    </article>
  );
}
