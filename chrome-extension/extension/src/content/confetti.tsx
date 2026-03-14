import { createRoot, type Root } from "react-dom/client";
import Confetti from "react-confetti-boom";
import { createElement } from "react";

const CONFETTI_DURATION_MS = 3500;

/**
 * Shows a single confetti burst in a full-viewport overlay, then unmounts.
 * Container has pointer-events: none so it does not block the page.
 */
export function showConfetti(zIndex: number): void {
  const container = document.createElement("div");
  container.setAttribute("data-element-capture-confetti", "true");
  container.style.cssText = `
    position: fixed;
  inset: 0;
  z-index: ${zIndex};
  pointer-events: none;
  `;
  document.body.appendChild(container);

  const root: Root = createRoot(container);
  root.render(
    createElement(Confetti, {
      mode: "boom",
      effectCount: 1,
      particleCount: 40,
      x: 0.5,
      y: 0.5
    })
  );

  setTimeout(() => {
    root.unmount();
    container.remove();
  }, CONFETTI_DURATION_MS);
}
