import { Copy, Download } from "lucide-react";
import { buildCopyHtml } from "../../shared/utils/preview-srcdoc-builder";
import { buildCopyMcpPrompt, buildSnippetPrompt } from "../../shared/utils/prompt-builder";
import { downloadZip } from "../../shared/utils/download-zip";
import type { Snippet } from "../../shared/types/snippet";

const ICON_SIZE = 14;

interface ActionBarProps {
  snippet: Snippet;
  currentHtml: string;
  currentCss: string;
  tokenCount: number;
  onToast: (msg: string) => void;
}

export function ActionBar({ snippet, currentHtml, currentCss, tokenCount, onToast }: ActionBarProps) {
  function copy(value: string, label: string) {
    void navigator.clipboard.writeText(value).then(
      () => onToast(`${label} copied`),
      () => onToast("Copy failed")
    );
  }

  function handleCopyCode() {
    copy(buildCopyHtml({ ...snippet, html: currentHtml, styleBlock: currentCss }), "Code");
  }

  function handleCopyPrompt() {
    copy(buildSnippetPrompt({ ...snippet, html: currentHtml, styleBlock: currentCss }), "Prompt");
  }

  function handleCopyMcp() {
    copy(buildCopyMcpPrompt({ ...snippet, html: currentHtml, styleBlock: currentCss }), "MCP");
  }

  async function handleDownload() {
    try {
      await downloadZip(snippet, currentHtml, currentCss);
    } catch {
      onToast("Download failed");
    }
  }

  return (
    <div className="action-bar">
      <button type="button" className="action-bar-btn" onClick={handleCopyCode}>
        <Copy size={ICON_SIZE} aria-hidden />
        Copy Code
      </button>
      <button type="button" className="action-bar-btn" onClick={handleCopyPrompt}>
        <Copy size={ICON_SIZE} aria-hidden />
        Copy Prompt
        {tokenCount > 0 && (
          <span className="action-bar-token-count">(~{tokenCount.toLocaleString()} tokens)</span>
        )}
      </button>
      <button type="button" className="action-bar-btn" onClick={handleCopyMcp}>
        <Copy size={ICON_SIZE} aria-hidden />
        Copy MCP
      </button>
      <button type="button" className="action-bar-btn" onClick={() => void handleDownload()}>
        <Download size={ICON_SIZE} aria-hidden />
        Download .zip
      </button>
    </div>
  );
}
