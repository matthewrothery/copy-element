import { DIAGRAM_COLORS } from "./colors.js";
import { escapeSvgText, sanitizeDiagramLabel } from "./text.js";

const W = 720;
const PAD = 32;
const R = 20;
const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

function clamp(s: string): string {
  return sanitizeDiagramLabel(s, 48);
}

export function renderStepsSvg(labels: string[]): string {
  const cleaned = labels.map(clamp);
  const n = cleaned.length;
  const usable = W - PAD * 2;
  const slot = usable / n;
  const H = 120;

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">`,
    `<title>${escapeSvgText(`Steps: ${cleaned.join(", ")}`)}</title>`,
    `<rect width="100%" height="100%" fill="${DIAGRAM_COLORS.surfaceMuted}"/>`,
  ];

  for (let i = 0; i < n; i += 1) {
    const cx = PAD + slot * i + slot / 2;
    const cyTop = 36;
    parts.push(
      `<circle cx="${cx}" cy="${cyTop}" r="${R}" fill="${DIAGRAM_COLORS.surface}" stroke="${DIAGRAM_COLORS.accent}" stroke-width="3"/>`,
      `<text x="${cx}" y="${cyTop + 6}" text-anchor="middle" font-family='${FONT}' font-size="15" font-weight="700" fill="${DIAGRAM_COLORS.accent}">${i + 1}</text>`
    );

    const words = cleaned[i].split(" ");
    let line = "";
    let lineIdx = 0;
    const lines: string[] = [];
    const maxCharPerLine = Math.max(12, Math.floor((slot - 16) / 7));
    for (const w of words) {
      const next = line ? `${line} ${w}` : w;
      if (next.length > maxCharPerLine && line) {
        lines.push(line);
        line = w;
      } else {
        line = next;
      }
    }
    if (line) lines.push(line);
    const displayLines = lines.slice(0, 3);

    let ty = cyTop + R + 18;
    for (const ln of displayLines) {
      parts.push(
        `<text x="${cx}" y="${ty}" text-anchor="middle" font-family='${FONT}' font-size="13" fill="${DIAGRAM_COLORS.text}">${escapeSvgText(ln)}</text>`
      );
      ty += 16;
    }

    if (i < n - 1) {
      const x1 = cx + R + 6;
      const x2 = PAD + slot * (i + 1) + slot / 2 - R - 6;
      parts.push(
        `<line x1="${x1}" y1="${cyTop}" x2="${x2}" y2="${cyTop}" stroke="${DIAGRAM_COLORS.border}" stroke-width="2"/>`
      );
    }
  }

  parts.push(`</svg>`);
  return parts.join("");
}
