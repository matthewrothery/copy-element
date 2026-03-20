import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type JSX } from "react";
import type { CaptureMode } from "../../shared/types/messages";

interface CaptureOption {
  mode: CaptureMode;
  label: string;
}

const CAPTURE_OPTIONS: CaptureOption[] = [
  { mode: "element", label: "Capture Element" },
  { mode: "section", label: "Capture Section" },
  { mode: "page", label: "Capture Page" },
  { mode: "mobile-page", label: "Capture Mobile Page" },
  { mode: "desktop-page", label: "Capture Desktop Page" },
];

interface CaptureButtonProps {
  defaultMode: CaptureMode;
  onCapture: (mode: CaptureMode) => void;
  disabled?: boolean;
  /** When true, hides the mode menu; capture always uses `defaultMode` (synced from parent). */
  hideCaptureOptions?: boolean;
}

export function CaptureButton({
  defaultMode,
  onCapture,
  disabled,
  hideCaptureOptions = true,
}: CaptureButtonProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<CaptureMode>(defaultMode);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveMode(defaultMode);
  }, [defaultMode]);

  useEffect(() => {
    if (hideCaptureOptions) setOpen(false);
  }, [hideCaptureOptions]);

  useEffect(() => {
    if (!open || hideCaptureOptions) return;
    function handleOutsideClick(e: MouseEvent): void {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open, hideCaptureOptions]);

  const activeOption = CAPTURE_OPTIONS.find((o) => o.mode === activeMode) ?? CAPTURE_OPTIONS[0];

  function handleMainClick(): void {
    setOpen(false);
    onCapture(activeMode);
  }

  function handleOptionClick(option: CaptureOption): void {
    setActiveMode(option.mode);
    setOpen(false);
    onCapture(option.mode);
  }

  return (
    <div
      className={`capture-split-button${hideCaptureOptions ? " capture-split-button--single" : ""}`}
      ref={containerRef}
    >
      <button
        type="button"
        className="capture-split-main"
        onClick={handleMainClick}
        disabled={disabled}
        aria-label={activeOption.label}
      >
        {activeOption.label}
      </button>
      {!hideCaptureOptions && (
        <>
          <button
            type="button"
            className={`capture-split-caret${open ? " capture-split-caret--open" : ""}`}
            onClick={() => setOpen((v) => !v)}
            disabled={disabled}
            aria-label="More capture options"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <ChevronDown size={14} aria-hidden />
          </button>
          {open && (
            <ul className="capture-dropdown" role="listbox" aria-label="Capture mode">
              {CAPTURE_OPTIONS.map((option) => (
                <li key={option.mode} role="option" aria-selected={option.mode === activeMode}>
                  <button
                    type="button"
                    className={`capture-dropdown-item${option.mode === activeMode ? " capture-dropdown-item--active" : ""}`}
                    onClick={() => handleOptionClick(option)}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
