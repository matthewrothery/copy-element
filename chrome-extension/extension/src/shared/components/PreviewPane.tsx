import { useCallback, useEffect, useRef, useState } from "react";
import { Maximize2, Monitor, Smartphone, Tablet, ZoomIn, ZoomOut } from "lucide-react";
import { SCALE_MAX, SCALE_MIN, ZOOM_IN_FACTOR, ZOOM_OUT_FACTOR, clamp, computeFitScale } from "../utils/preview-zoom-pan";

const ICON_SIZE = 14;
const MIN_WIDTH = 200;
const MAX_WIDTH = 3840;

const DEVICE_PRESETS = [
  { id: "desktop", label: "Desktop", Icon: Monitor, width: null as number | null },
  { id: "mobile", label: "Mobile", Icon: Smartphone, width: 375 },
  { id: "tablet", label: "Tablet", Icon: Tablet, width: 768 }
] as const;

type DeviceId = typeof DEVICE_PRESETS[number]["id"];

interface PreviewPaneProps {
  srcDoc: string;
}

export function PreviewPane({ srcDoc }: PreviewPaneProps) {
  const [deviceId, setDeviceId] = useState<DeviceId>("desktop");
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1.0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const activePreset = DEVICE_PRESETS.find((p) => p.id === deviceId)!;
  const currentWidth = customWidth ?? activePreset.width;

  useEffect(() => { setZoom(1.0); }, [srcDoc]);

  function handlePresetClick(id: DeviceId) {
    setDeviceId(id);
    setCustomWidth(null);
  }

  function handleIframeLoad() {
    const iframe = iframeRef.current;
    const viewport = viewportRef.current;
    if (!iframe?.contentDocument || !viewport) return;
    const doc = iframe.contentDocument.documentElement;
    const contentW = doc.scrollWidth;
    const contentH = doc.scrollHeight;
    const viewportW = viewport.clientWidth - 32;
    const viewportH = viewport.clientHeight;
    const fitScale = computeFitScale(viewportW, viewportH, contentW, contentH);
    if (fitScale < 1) {
      setZoom(clamp(fitScale, SCALE_MIN, 1));
    }
  }

  function handleZoomOut() { setZoom((z) => clamp(z * ZOOM_OUT_FACTOR, SCALE_MIN, SCALE_MAX)); }
  function handleZoomIn()  { setZoom((z) => clamp(z * ZOOM_IN_FACTOR, SCALE_MIN, SCALE_MAX)); }
  function handleZoomReset() { setZoom(1.0); }
  function handleZoomFit() {
    const iframe = iframeRef.current;
    const viewport = viewportRef.current;
    if (!iframe?.contentDocument || !viewport) return;
    const doc = iframe.contentDocument.documentElement;
    const fitScale = computeFitScale(viewport.clientWidth - 32, viewport.clientHeight, doc.scrollWidth, doc.scrollHeight);
    setZoom(clamp(fitScale, SCALE_MIN, SCALE_MAX));
  }

  function handleWidthInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= MIN_WIDTH && val <= MAX_WIDTH) {
      setCustomWidth(val);
    }
  }

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (!wrapperRef.current) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = wrapperRef.current.getBoundingClientRect().width;

    function onMouseMove(ev: MouseEvent) {
      if (!draggingRef.current) return;
      const delta = ev.clientX - startXRef.current;
      const newWidth = Math.max(MIN_WIDTH, Math.min(startWidthRef.current + delta, window.innerWidth - 64));
      setCustomWidth(Math.round(newWidth));
    }

    function onMouseUp() {
      draggingRef.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, []);

  const isConstrained = currentWidth !== null;
  const inputValue = customWidth ?? activePreset.width ?? "";

  return (
    <div className="preview-pane">
      <div className="preview-toolbar">
        <div className="preview-toolbar-presets">
          {DEVICE_PRESETS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`preview-device-btn${deviceId === id && customWidth === null ? " active" : ""}`}
              onClick={() => handlePresetClick(id)}
              aria-label={label}
              title={label}
            >
              <Icon size={ICON_SIZE} aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </div>
        <div className="preview-toolbar-width">
          {isConstrained ? (
            <>
              <input
                type="number"
                className="preview-width-input"
                value={inputValue}
                onChange={handleWidthInputChange}
                min={MIN_WIDTH}
                max={MAX_WIDTH}
                aria-label="Preview width in pixels"
              />
              <span className="preview-width-unit">px</span>
            </>
          ) : (
            <span className="preview-width-label">Full width</span>
          )}
        </div>
        <div className="preview-toolbar-zoom">
          <button
            type="button"
            className="preview-zoom-btn"
            onClick={handleZoomOut}
            aria-label="Zoom out"
            title="Zoom out"
            disabled={zoom <= SCALE_MIN}
          >
            <ZoomOut size={ICON_SIZE} aria-hidden />
          </button>
          <button
            type="button"
            className="preview-zoom-label"
            onClick={handleZoomReset}
            aria-label="Reset zoom"
            title="Click to reset zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className="preview-zoom-btn"
            onClick={handleZoomIn}
            aria-label="Zoom in"
            title="Zoom in"
            disabled={zoom >= SCALE_MAX}
          >
            <ZoomIn size={ICON_SIZE} aria-hidden />
          </button>
          <button
            type="button"
            className="preview-zoom-btn"
            onClick={handleZoomFit}
            aria-label="Fit to viewport"
            title="Fit to viewport"
          >
            <Maximize2 size={ICON_SIZE} aria-hidden />
          </button>
        </div>
      </div>
      <div ref={viewportRef} className="preview-viewport">
        <div
          ref={wrapperRef}
          className={`preview-device-wrapper${!isConstrained ? " full-width" : ""}${deviceId !== "desktop" ? ` device-${deviceId}` : ""}`}
          style={
            isConstrained
              ? { width: `${currentWidth}px`, zoom: zoom !== 1 ? zoom : undefined }
              : { width: `${Math.round(100 / zoom)}%`, zoom: zoom !== 1 ? zoom : undefined }
          }
        >
          <iframe
            ref={iframeRef}
            className="preview-iframe"
            srcDoc={srcDoc}
            sandbox="allow-same-origin allow-scripts"
            title="Element preview"
            onLoad={handleIframeLoad}
          />
          {isConstrained && (
            <div
              className="resize-handle"
              onMouseDown={handleResizeMouseDown}
              role="separator"
              aria-orientation="vertical"
              aria-label="Drag to resize preview width"
            />
          )}
        </div>
      </div>
    </div>
  );
}
