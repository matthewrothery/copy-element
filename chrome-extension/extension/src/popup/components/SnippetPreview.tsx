import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { TAILWIND_COPY_PLACEHOLDER } from "../../shared/constants";
import { captureIframeAsPngBlob } from "../../shared/utils/iframe-screenshot";
import { buildCopyMcpPrompt, buildSnippetPrompt, getSnippetPromptTokenEstimate } from "../../shared/utils/prompt-builder";
import { buildCopyHtml, buildPreviewSrcDoc } from "../../shared/utils/preview-srcdoc-builder";
import {
  clamp,
  computeFitScale,
  getDistance,
  getMidpoint,
  SCALE_MAX,
  SCALE_MIN,
  ZOOM_IN_FACTOR,
  ZOOM_OUT_FACTOR
} from "../../shared/utils/preview-zoom-pan";
import type { Snippet } from "../../shared/types/snippet";

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

export function SnippetPreview({ snippet, onClose, onCopy, onToast }: SnippetPreviewProps): React.JSX.Element {
  const viewportRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [screenshotCopying, setScreenshotCopying] = useState(false);

  const contentWidth = Math.max(snippet.width, 1);
  const contentHeight = Math.max(snippet.height, 1);

  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const startPanXRef = useRef(0);
  const startPanYRef = useRef(0);
  const pinchStartDistanceRef = useRef(0);
  const pinchStartScaleRef = useRef(1);

  const fitToView = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const viewportW = viewport.clientWidth;
    const viewportH = viewport.clientHeight;
    if (viewportW <= 0 || viewportH <= 0) return;
    const newScale = computeFitScale(viewportW, viewportH, contentWidth, contentHeight);
    setScale(newScale);
    setPanX((viewportW - contentWidth * newScale) / 2);
    setPanY((viewportH - contentHeight * newScale) / 2);
  }, [contentWidth, contentHeight]);

  useLayoutEffect(() => {
    fitToView();
  }, [snippet.id, contentWidth, contentHeight, fitToView]);

  const zoomAtPoint = useCallback(
    (newScale: number, clientX: number, clientY: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const rect = viewport.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const worldX = (x - panX) / scale;
      const worldY = (y - panY) / scale;
      const s = clamp(newScale, SCALE_MIN, SCALE_MAX);
      setScale(s);
      setPanX(x - worldX * s);
      setPanY(y - worldY * s);
    },
    [panX, panY, scale]
  );

  const handleFit = (): void => fitToView();
  const handle100 = (): void => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    zoomAtPoint(1, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };
  const handleZoomOut = (): void => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    zoomAtPoint(scale * ZOOM_OUT_FACTOR, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };
  const handleZoomIn = (): void => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    zoomAtPoint(scale * ZOOM_IN_FACTOR, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? ZOOM_OUT_FACTOR : ZOOM_IN_FACTOR;
      zoomAtPoint(scale * factor, e.clientX, e.clientY);
    },
    [scale, zoomAtPoint]
  );

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      isDraggingRef.current = true;
      dragStartXRef.current = e.clientX;
      dragStartYRef.current = e.clientY;
      startPanXRef.current = panX;
      startPanYRef.current = panY;
    },
    [panX, panY]
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    setPanX(startPanXRef.current + (e.clientX - dragStartXRef.current));
    setPanY(startPanYRef.current + (e.clientY - dragStartYRef.current));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  React.useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pinchStartDistanceRef.current = getDistance(e.touches[0], e.touches[1]);
        pinchStartScaleRef.current = scale;
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        isDraggingRef.current = true;
        dragStartXRef.current = t.clientX;
        dragStartYRef.current = t.clientY;
        startPanXRef.current = panX;
        startPanYRef.current = panY;
      }
    },
    [panX, panY, scale]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2 && pinchStartDistanceRef.current > 0) {
        const distance = getDistance(e.touches[0], e.touches[1]);
        const midpoint = getMidpoint(e.touches[0], e.touches[1]);
        const nextScale = pinchStartScaleRef.current * (distance / pinchStartDistanceRef.current);
        zoomAtPoint(nextScale, midpoint.x, midpoint.y);
        return;
      }
      if (e.touches.length === 1 && isDraggingRef.current) {
        const t = e.touches[0];
        setPanX(startPanXRef.current + (t.clientX - dragStartXRef.current));
        setPanY(startPanYRef.current + (t.clientY - dragStartYRef.current));
      }
    },
    [zoomAtPoint]
  );

  const handleTouchEnd = useCallback(() => {
    isDraggingRef.current = false;
    pinchStartDistanceRef.current = 0;
  }, []);

  React.useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.addEventListener("touchstart", handleTouchStart, { passive: true });
    viewport.addEventListener("touchmove", handleTouchMove, { passive: false });
    viewport.addEventListener("touchend", handleTouchEnd);
    viewport.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      viewport.removeEventListener("touchstart", handleTouchStart);
      viewport.removeEventListener("touchmove", handleTouchMove);
      viewport.removeEventListener("touchend", handleTouchEnd);
      viewport.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

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

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Snippet preview">
      <div className="modal snippet-preview-modal">
        <h2 className="snippet-preview-title">{snippet.title}</h2>
        <div className="preview-shell">
          <div className="preview-toolbar">
            <button type="button" onClick={handleFit} aria-label="Fit to view">
              Fit
            </button>
            <button type="button" onClick={handle100} aria-label="100%">
              100%
            </button>
            <button type="button" onClick={handleZoomOut} aria-label="Zoom out">
              −
            </button>
            <button type="button" onClick={handleZoomIn} aria-label="Zoom in">
              +
            </button>
            <span className="zoom-label" aria-live="polite">
              {Math.round(scale * 100)}%
            </span>
          </div>
          <div ref={viewportRef} className="preview-viewport" onMouseDown={handleMouseDown}>
            <div
              className="preview-content"
              style={{
                width: contentWidth,
                height: contentHeight,
                transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
                transformOrigin: "0 0"
              }}
            >
              <iframe
                ref={iframeRef}
                title={`preview-${snippet.id}`}
                srcDoc={buildPreviewSrcDoc(snippet)}
                sandbox="allow-same-origin"
                style={{ width: contentWidth, height: contentHeight, border: 0, display: "block", pointerEvents: "none" }}
              />
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
