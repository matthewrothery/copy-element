/**
 * Element item — mirrors backend model (captured from Chrome extension).
 * API placeholders: GET /api/elements, GET /api/elements/:id
 */
export interface ElementItem {
  id: string;
  name: string;
  html: string;
  css: string;
  /** Preview image URL or data URL */
  preview: string;
  createdAt: string;
  /** Optional: source URL (e.g. from extension) */
  sourceUrl?: string;
}
