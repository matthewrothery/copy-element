const FREEZE_STYLE_ID = "ea-freeze";
const FREEZE_CSS = `*, *::before, *::after {
  caret-color: transparent !important;
  transition-duration: 0ms !important;
  transition-delay: 0ms !important;
  animation-delay: 0ms !important;
  animation-duration: 1ms !important;
  animation-play-state: paused !important;
  content-visibility: initial !important;
}`;

export function freezeAnimations(): () => void {
  document.getElementById(FREEZE_STYLE_ID)?.remove();
  const style = document.createElement("style");
  style.id = FREEZE_STYLE_ID;
  style.textContent = FREEZE_CSS;
  document.head.appendChild(style);
  return () => { document.getElementById(FREEZE_STYLE_ID)?.remove(); };
}
