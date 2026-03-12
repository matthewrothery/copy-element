import React, { useLayoutEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { TAILWIND_COPY_PLACEHOLDER } from "../../shared/constants";
import { captureIframeAsPngBlob } from "../../shared/utils/iframe-screenshot";
import { buildCopyMcpPrompt, buildSnippetPrompt, getSnippetPromptTokenEstimate } from "../../shared/utils/prompt-builder";
import { buildCopyHtml, buildPreviewSrcDoc } from "../../shared/utils/preview-srcdoc-builder";
import type { Snippet } from "../../shared/types/snippet";

const SCALE_MIN = 0.25;
const SCALE_MAX = 2;
const ZOOM_OUT_FACTOR = 0.8;
const ZOOM_IN_FACTOR = 1.25;

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function formatCapturedDate(createdAt: number): string {
  return new Date(createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

interface SnippetPreviewProps {
  snippet: Snippet;
  onClose: () => void;
  onCopy: (value: string, label: string) => void;
  /** Optional: show toast for screenshot copy success/failure (e.g. setToastMessage). */
  onToast?: (message: string) => void;
}

function computeFitScale(
  frameWidth: number,
  frameHeight: number,
  snippetWidth: number,
  snippetHeight: number
): number {
  const w = Math.max(snippetWidth, 1);
  const h = Math.max(snippetHeight, 1);
  const scaleW = frameWidth / w;
  const scaleH = frameHeight / h;
  return Math.min(scaleW, scaleH, 1);
}

export function SnippetPreview({ snippet, onClose, onCopy, onToast }: SnippetPreviewProps): React.JSX.Element {
  const frameRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fitScaleRef = useRef<number>(1);
  const [scale, setScale] = useState(1);
  const [screenshotCopying, setScreenshotCopying] = useState(false);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const frameW = frame.clientWidth;
    const frameH = frame.clientHeight;
    if (frameW <= 0 || frameH <= 0) return;
    const fitScale = computeFitScale(frameW, frameH, snippet.width, snippet.height);
    fitScaleRef.current = fitScale;
    setScale(fitScale);
  }, [snippet.id, snippet.width, snippet.height]);

  const handleZoomOut = (): void => {
    setScale((s) => Math.max(SCALE_MIN, s * ZOOM_OUT_FACTOR));
  };
  const handleZoomIn = (): void => {
    setScale((s) => Math.min(SCALE_MAX, s * ZOOM_IN_FACTOR));
  };
  const handleFit = (): void => {
    setScale(fitScaleRef.current);
  };
  const handle100 = (): void => {
    setScale(1);
  };

  async function handleCopyScreenshot(): Promise<void> {
    const iframe = iframeRef.current;
    if (!iframe || screenshotCopying) return;
    setScreenshotCopying(true);
    try {
      const blob = await captureIframeAsPngBlob(iframe);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      onToast?.("Screenshot copied to clipboard");
    } catch {
      onToast?.("Failed to copy screenshot");
    } finally {
      setScreenshotCopying(false);
    }
  }

  const w = Math.max(snippet.width, 1);
  const h = Math.max(snippet.height, 1);
  const wrapperWidth = w * scale;
  const wrapperHeight = h * scale;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Snippet preview">
      <div className="modal snippet-preview-modal">
        <h2 className="snippet-preview-title">{snippet.title}</h2>
        <div className="snippet-preview-zoom-toolbar">
          <button
            type="button"
            className="btn-secondary snippet-preview-zoom-btn"
            onClick={handleFit}
            aria-label="Fit to view"
          >
            Fit
          </button>
          <button
            type="button"
            className="btn-secondary snippet-preview-zoom-btn"
            onClick={handle100}
            aria-label="100%"
          >
            100%
          </button>
          <button
            type="button"
            className="btn-secondary snippet-preview-zoom-btn"
            onClick={handleZoomOut}
            aria-label="Zoom out"
          >
            −
          </button>
          <button
            type="button"
            className="btn-secondary snippet-preview-zoom-btn"
            onClick={handleZoomIn}
            aria-label="Zoom in"
          >
            +
          </button>
          <span className="snippet-preview-zoom-label" aria-live="polite">
            {Math.round(scale * 100)}%
          </span>
        </div>
        <div ref={frameRef} className="snippet-preview-frame">
          <div
            className="snippet-preview-frame-center"
            style={{
              minWidth: wrapperWidth,
              minHeight: Math.max(420, wrapperHeight)
            }}
          >
            <div
              className="snippet-preview-zoom-wrapper"
              style={{ width: wrapperWidth, height: wrapperHeight }}
            >
              <div
                className="snippet-preview-zoom-inner"
                style={{
                  width: w,
                  height: h,
                  transform: `scale(${scale})`,
                  transformOrigin: "0 0"
                }}
              >
                <iframe
                  ref={iframeRef}
                  title={`preview-${snippet.id}`}
                  srcDoc={buildPreviewSrcDoc(snippet)}
                  sandbox=""
                  style={{
                    width: w,
                    minHeight: h,
                    height: "auto"
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="snippet-preview-meta">
          <p className="meta">
            <span className="meta-label">Source:</span> {getHostname(snippet.sourceUrl)}
          </p>
          <p className="meta">
            <span className="meta-label">Dimensions:</span> {snippet.width} × {snippet.height}
          </p>
          <p className="meta">
            <span className="meta-label">Captured:</span> {formatCapturedDate(snippet.createdAt)}
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
          <button type="button" className="btn-secondary" onClick={() => onCopy(buildCopyHtml(snippet, { includeStyleBlock: false }), "HTML (inline)")} aria-label="Copy HTML inline only">
            Copy Inline
          </button>
          <button type="button" className="btn-primary" onClick={() => onCopy(snippet.jsx, "JSX")} aria-label="Copy JSX">
            Copy JSX
          </button>
          <button type="button" className="btn-secondary" onClick={() => onCopy(buildSnippetPrompt(snippet), "Prompt")} aria-label="Copy prompt for AI tools">
            <MessageSquare size={16} />
            Copy Prompt (~{getSnippetPromptTokenEstimate(snippet)} tokens)
          </button>
          <button type="button" className="btn-secondary" onClick={() => onCopy(buildCopyMcpPrompt(snippet), "MCP")} aria-label="Copy MCP prompt">
            Copy MCP
          </button>
          <button type="button" className="btn-secondary" onClick={() => onCopy(TAILWIND_COPY_PLACEHOLDER, "Tailwind")} aria-label="Copy Tailwind">
            Copy Tailwind
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void handleCopyScreenshot()}
            disabled={screenshotCopying}
            aria-label="Copy screenshot"
          >
            {screenshotCopying ? "Copying…" : "Copy screenshot"}
          </button>
        </div>
      </div>
    </div>
  );
}
