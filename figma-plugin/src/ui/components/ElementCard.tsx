import type { ElementItem } from "../types";

export interface ElementCardProps {
  element: ElementItem;
  onInsert: (element: ElementItem) => void;
  onPreview: (element: ElementItem) => void;
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
  const meta = hostname ? `${hostname} · ${element.createdAt}` : element.createdAt;

  return (
    <article className="element-card">
      <button
        type="button"
        className="element-card-thumb-button"
        onClick={() => onPreview(element)}
        aria-label={`Preview ${element.name}`}
      >
        {element.preview ? (
          <img
            src={element.preview}
            alt=""
            className="element-card-thumb"
          />
        ) : (
          <div className="element-card-thumb-fallback" />
        )}
      </button>
      <div className="element-card-meta">
        <h3 className="element-card-title" title={element.name}>
          {element.name}
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
