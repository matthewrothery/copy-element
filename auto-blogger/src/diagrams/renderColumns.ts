import { DIAGRAM_COLORS } from "./colors.js";
import { escapeSvgText, sanitizeDiagramLabel } from "./text.js";

const W = 720;
const PAD = 24;
const HEADER_H = 44;
const ROW_H = 36;
const GAP = 14;
const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function clampTitle(s: string): string {
  return sanitizeDiagramLabel(s, 36);
}

function clampRow(s: string): string {
  return sanitizeDiagramLabel(s, 72);
}

export function renderColumnsSvg(
  columns: { title: string; rows: string[] }[]
): string {
  const n = columns.length;
  const innerW = W - PAD * 2 - GAP * (n - 1);
  const colW = innerW / n;
  const maxRows = Math.max(...columns.map((c) => c.rows.length));
  const bodyH = maxRows * ROW_H;
  const H = PAD * 2 + HEADER_H + bodyH + 8;

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">`,
    `<title>${escapeSvgText(columns.map((c) => clampTitle(c.title)).join(" vs "))}</title>`,
    `<rect width="100%" height="100%" fill="${DIAGRAM_COLORS.surfaceMuted}"/>`,
  ];

  for (let i = 0; i < n; i += 1) {
    const x = PAD + i * (colW + GAP);
    const title = clampTitle(columns[i].title);
    parts.push(
      `<rect x="${x}" y="${PAD}" width="${colW}" height="${HEADER_H}" rx="8" fill="${DIAGRAM_COLORS.accent}"/>`,
      `<text x="${x + colW / 2}" y="${PAD + HEADER_H / 2 + 5}" text-anchor="middle" font-family='${FONT}' font-size="14" font-weight="600" fill="${DIAGRAM_COLORS.surface}">${escapeSvgText(title)}</text>`
    );

    const rows = columns[i].rows.map(clampRow);
    let ry = PAD + HEADER_H + 6;
    parts.push(
      `<rect x="${x}" y="${ry}" width="${colW}" height="${bodyH}" rx="8" fill="${DIAGRAM_COLORS.surface}" stroke="${DIAGRAM_COLORS.border}" stroke-width="2"/>`
    );

    for (let r = 0; r < rows.length; r += 1) {
      const ty = ry + ROW_H / 2 + 5 + r * ROW_H;
      parts.push(
        `<text x="${x + 12}" y="${ty}" font-family='${FONT}' font-size="13" fill="${DIAGRAM_COLORS.text}">${escapeSvgText(rows[r])}</text>`
      );
    }
  }

  parts.push(`</svg>`);
  return parts.join("");
}
