import primitives from "../styles/tokens/primitives.css?raw";
import semantic from "../styles/tokens/semantic.css?raw";

/**
 * Full token CSS (primitives + semantic) for injection into Shadow DOM.
 * Used by the content script capture confirmation modal.
 */
export const TOKENS_CSS = `${primitives}\n${semantic}`;
