import { DIAGRAM_COLORS } from "./colors.js";
import { escapeSvgText, sanitizeDiagramLabel } from "./text.js";

const PAD = 28;
const NODE_H = 50;
const GAP = 24;
const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
const MIN_NODE_W = 96;
const MAX_NODE_W = 200;

function clampLabel(raw: string): string {
  return sanitizeDiagramLabel(raw, 42);
}

function approxNodeWidth(label: string): number {
  const w = Math.ceil(label.length * 7.8 + 28);
  return Math.min(MAX_NODE_W, Math.max(MIN_NODE_W, w));
}

export function renderFlowSvg(nodes: { label: string }[]): string {
  const labels = nodes.map((n) => clampLabel(n.label));
  const widths = labels.map(approxNodeWidth);
  const totalW = widths.reduce((a, b) => a + b, 0) + GAP * (widths.length - 1) + PAD * 2;
  const H = PAD * 2 + NODE_H;
  const vbW = Math.max(400, totalW);

  let x = PAD;
  const rects: string[] = [];
  const texts: string[] = [];
  const arrows: string[] = [];

  for (let i = 0; i < labels.length; i += 1) {
    const w = widths[i];
    const y = PAD;
    rects.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${NODE_H}" rx="10" ry="10" fill="${DIAGRAM_COLORS.surface}" stroke="${DIAGRAM_COLORS.border}" stroke-width="2"/>`
    );
    texts.push(
      `<text x="${x + w / 2}" y="${y + NODE_H / 2 + 5}" text-anchor="middle" font-family='${FONT}' font-size="14" fill="${DIAGRAM_COLORS.text}">${escapeSvgText(labels[i])}</text>`
    );

    if (i < labels.length - 1) {
      const x1 = x + w;
      const x2 = x + w + GAP;
      const cy = y + NODE_H / 2;
      arrows.push(
        `<line x1="${x1}" y1="${cy}" x2="${x2 - 8}" y2="${cy}" stroke="${DIAGRAM_COLORS.text}" stroke-width="2" marker-end="url(#arrowhead)"/>`
      );
    }

    x += w + GAP;
  }

  const title = escapeSvgText(labels.join(" → "));

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${H}" width="${vbW}" height="${H}" role="img">`,
    `<title>${title}</title>`,
    `<defs>`,
    `<marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">`,
    `<polygon points="0 0, 10 3.5, 0 7" fill="${DIAGRAM_COLORS.text}"/>`,
    `</marker>`,
    `</defs>`,
    `<rect width="100%" height="100%" fill="${DIAGRAM_COLORS.surfaceMuted}"/>`,
    ...rects,
    ...arrows,
    ...texts,
    `</svg>`,
  ].join("");
}
