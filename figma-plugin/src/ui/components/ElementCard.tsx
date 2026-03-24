import type { CaptureItem } from "../types";

export interface ElementCardProps {
  element: CaptureItem;
  onInsert: (element: CaptureItem) => void;
  onPreview: (element: CaptureItem) => void;
}

export function ElementCard({ element, onInsert, onPreview }: ElementCardProps) {
  const hostname = (() => {
    if (!element.sourceUrl) return null;
    try {
      return new URL(element.sourceUrl).hostname;
    } catch {
      return null;
    }
  })();

  const date = new Date(element.capturedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const meta = hostname ? `${hostname} · ${date}` : date;

  return (
    <article className="element-card">
      <button
        type="button"
        className="element-card-thumb-button"
        onClick={() => onPreview(element)}
        aria-label={`Preview ${element.title}`}
      >
        {element.screenshotUrl ? (
          <img
            src={element.screenshotUrl}
            alt=""
            className="element-card-thumb"
          />
        ) : (
          <div className="element-card-thumb-fallback" />
        )}
      </button>
      <div className="element-card-meta">
        <h3 className="element-card-title" title={element.title}>
          {element.title}
        </h3>
        <p className="element-card-caption">{meta}</p>
      </div>
      <div className="element-card-actions">
        <button
          type="button"
          className="btn-primary"
          onClick={() => onInsert(element)}
        >
          Insert
        </button>
        <button
          type="button"
          onClick={() => onPreview(element)}
        >
          Preview
        </button>
      </div>
    </article>
  );
}
