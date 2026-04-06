import React, { useEffect, useRef, useState } from "react";
import { Copy } from "lucide-react";
import { captureIframeAsPngBlob } from "../../shared/utils/iframe-screenshot";
import {
  buildCopyMcpPrompt,
  buildShortMcpPrompt,
  buildSnippetPrompt,
  getSnippetPromptTokenEstimate
} from "../../shared/utils/prompt-builder";
import { buildCopyHtml, buildEditorPreviewSrcDoc } from "../../shared/utils/preview-srcdoc-builder";
import { downloadZip } from "../../shared/utils/download-zip";
import { PreviewPane } from "../../shared/components/PreviewPane";
import type { Snippet } from "../../shared/types/snippet";
import { getMcpApiKey } from "../../shared/storage/mcp-storage";

interface SnippetPreviewProps {
  snippet: Snippet;
  onClose: () => void;
  onCopy: (value: string, label: string) => void;
  /** Optional: show toast for screenshot copy success/failure. */
  onToast?: (message: string) => void;
}

export function SnippetPreview({ snippet, onClose, onCopy, onToast }: SnippetPreviewProps): React.JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const [screenshotCopying, setScreenshotCopying] = useState(false);
  const [mcpConnected, setMcpConnected] = useState<boolean | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const tokenCount = getSnippetPromptTokenEstimate(snippet);
  const tokenLabel = tokenCount < 1000 ? `~${tokenCount}` : `~${(tokenCount / 1000).toFixed(1)}k`;
  const shortPrompt = buildShortMcpPrompt(snippet);
  const srcDoc = buildEditorPreviewSrcDoc(snippet.html, snippet.styleBlock ?? "", snippet);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    void getMcpApiKey().then((key) => setMcpConnected(key !== null));
  }, []);

  function handleSetupMcp(): void {
    if (window.location.href.includes("app.html")) {
      window.location.hash = "#/mcp";
    } else {
      void chrome.tabs.create({ url: `${chrome.runtime.getURL("app.html")}#/mcp` });
    }
  }

  function handleCopyCode() {
    onCopy(buildCopyHtml(snippet), "HTML");
  }

  async function handleDownload() {
    try {
      await downloadZip(snippet, snippet.html, snippet.styleBlock ?? "");
    } catch {
      onToast?.("Download failed");
    }
  }

  function handleCopyMcp() {
    setMenuOpen(false);
    onCopy(buildCopyMcpPrompt(snippet), "MCP");
  }

  async function handleCopyScreenshot() {
    setMenuOpen(false);
    if (screenshotCopying) return;
    setScreenshotCopying(true);
    try {
      const iframe = document.querySelector(".snippet-preview-modal .preview-iframe") as HTMLIFrameElement | null;
      if (!iframe) throw new Error("No iframe");
      const blob = await captureIframeAsPngBlob(iframe);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      onToast?.("Screenshot copied to clipboard");
    } catch {
      onToast?.("Failed to copy screenshot");
    } finally {
      setScreenshotCopying(false);
    }
  }

  function handleCopyPrompt() {
    onCopy(shortPrompt, "Prompt");
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Snippet preview">
      <div className="modal snippet-preview-modal">
        <div className="snippet-preview-header">
          <h2>{snippet.title}</h2>
          <button type="button" className="snippet-preview-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <PreviewPane srcDoc={srcDoc} />

        <div className="snippet-preview-actions">
          <button type="button" className="btn-primary" onClick={handleCopyCode}>
            Copy Code
          </button>
          <button type="button" className="btn-secondary" onClick={() => void handleDownload()}>
            Download .zip
          </button>
          <div className="snippet-preview-more" ref={menuRef}>
            <button
              type="button"
              className="btn-secondary snippet-preview-more-btn"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="More options"
              aria-expanded={menuOpen}
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="snippet-preview-dropdown" role="menu">
                <button type="button" role="menuitem" onClick={handleCopyMcp}>
                  Copy MCP
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleCopyScreenshot()}
                  disabled={screenshotCopying}
                >
                  {screenshotCopying ? "Copying…" : "Copy Screenshot"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="snippet-preview-prompt-section">
          {mcpConnected === false && (
            <div className="snippet-preview-mcp-notice" role="note">
              <span className="snippet-preview-mcp-notice-text">
                MCP not connected — this prompt requires an AI tool with MCP set up.
              </span>
              <button
                type="button"
                className="snippet-preview-mcp-notice-btn"
                onClick={handleSetupMcp}
              >
                Set up MCP →
              </button>
            </div>
          )}
          <div className="snippet-preview-prompt-wrapper">
            <textarea
              readOnly
              className="snippet-preview-prompt-input"
              value={shortPrompt}
              aria-label="Prompt text"
              rows={2}
              onClick={handleCopyPrompt}
            />
            <button
              type="button"
              className="snippet-preview-prompt-copy"
              onClick={handleCopyPrompt}
              aria-label="Copy prompt"
              tabIndex={-1}
            >
              <Copy size={12} aria-hidden />
              <span>{tokenLabel} tokens</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
