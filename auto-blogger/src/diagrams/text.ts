/** XML text node escaping for SVG. */
export function escapeSvgText(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const URL_LIKE = /\bhttps?:\/\/\S+/gi;

/** Strip URL-like tokens from user-facing diagram labels (spec safety). */
export function sanitizeDiagramLabel(raw: string, maxLen: number): string {
  let s = raw.replace(URL_LIKE, "").replace(/\s+/g, " ").trim();
  if (s.length > maxLen) {
    s = `${s.slice(0, maxLen - 1)}…`;
  }
  return s;
}
