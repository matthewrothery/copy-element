import { Copy, Download } from "lucide-react";
import { buildCopyHtml } from "../../shared/utils/preview-srcdoc-builder";
import { buildAdvancedSnippetPrompt, buildCopyMcpPrompt, buildSnippetPrompt } from "../../shared/utils/prompt-builder";
import { downloadZip } from "../../shared/utils/download-zip";
import type { Snippet } from "../../shared/types/snippet";
import { trackPopupEvent } from "../../shared/analytics";

const ICON_SIZE = 14;

interface ActionBarProps {
  snippet: Snippet;
  currentHtml: string;
  currentCss: string;
  tokenCount: number;
  onToast: (msg: string) => void;
  isPaid?: boolean;
  onUpgrade?: () => void;
}

export function ActionBar({ snippet, currentHtml, currentCss, tokenCount, onToast, isPaid, onUpgrade }: ActionBarProps) {
  function copy(value: string, label: string, format: string) {
    void navigator.clipboard.writeText(value).then(
      () => {
        onToast(`${label} copied`);
        void trackPopupEvent('element_exported', { format });
      },
      () => onToast("Copy failed")
    );
  }

  function handleCopyCode() {
    copy(buildCopyHtml({ ...snippet, html: currentHtml, styleBlock: currentCss }), "Code", "html");
  }

  function handleCopyPrompt() {
    copy(buildSnippetPrompt({ ...snippet, html: currentHtml, styleBlock: currentCss }), "Prompt", "prompt_basic");
    if (!isPaid) {
      onUpgrade?.();
    }
  }

  function handleCopyAdvancedPrompt() {
    if (!isPaid) {
      onUpgrade?.();
      return;
    }
    copy(buildAdvancedSnippetPrompt({ ...snippet, html: currentHtml, styleBlock: currentCss }), "Advanced Prompt", "prompt_advanced");
  }

  function handleCopyMcp() {
    if (!isPaid) {
      onUpgrade?.();
      return;
    }
    copy(buildCopyMcpPrompt({ ...snippet, html: currentHtml, styleBlock: currentCss }), "MCP", "mcp");
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
      <button type="button" className="action-bar-btn" onClick={handleCopyAdvancedPrompt}>
        <Copy size={ICON_SIZE} aria-hidden />
        Copy Advanced Prompt
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
