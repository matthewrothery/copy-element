import { ElementCard } from "./ElementCard";
import type { CaptureItem } from "../types";

export interface ElementListProps {
  elements: CaptureItem[];
  onInsert: (element: CaptureItem) => void;
  onPreview: (element: CaptureItem) => void;
}

export function ElementList({ elements, onInsert, onPreview }: ElementListProps) {
  if (elements.length === 0) {
    return (
      <div className="empty-state">
        <h2>No captures yet</h2>
        <p>Capture elements in the Chrome extension to see them here.</p>
      </div>
    );
  }

  return (
    <section className="element-grid" aria-label="Capture library">
      {elements.map((el) => (
        <ElementCard
          key={el.id}
          element={el}
          onInsert={onInsert}
          onPreview={onPreview}
        />
      ))}
    </section>
  );
}
