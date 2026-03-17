import { ElementCard } from "./ElementCard";
import type { ElementItem } from "../types";

export interface ElementListProps {
  elements: ElementItem[];
  onInsert: (element: ElementItem) => void;
  onPreview: (element: ElementItem) => void;
}

export function ElementList({ elements, onInsert, onPreview }: ElementListProps) {
  if (elements.length === 0) {
    return (
      <div className="empty-state">
        <h2>No components yet</h2>
        <p>Capture elements in the Chrome extension to see them here.</p>
      </div>
    );
  }

  return (
    <section className="element-grid" aria-label="Component library">
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
