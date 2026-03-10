/**
 * Default CSS values to omit from inline style output.
 * When a computed value equals one of these, it is skipped for conciseness.
 */

const ZERO_VALUES = new Set(["0", "0px"]);
const AUTO_VALUES = new Set(["auto"]);
const NONE_VALUES = new Set(["none"]);
const VISIBLE_VALUES = new Set(["visible"]);
const NORMAL_VALUES = new Set(["normal"]);
const TRANSPARENT_VALUES = new Set([
  "transparent",
  "rgba(0, 0, 0, 0)",
  "rgba(0,0,0,0)"
]);

const DEFAULT_VALUE_MAP: Record<string, Set<string>> = {
  display: new Set(["block", "inline", "flow-root"]),
  position: new Set(["static"]),
  margin: ZERO_VALUES,
  "margin-top": ZERO_VALUES,
  "margin-right": ZERO_VALUES,
  "margin-bottom": ZERO_VALUES,
  "margin-left": ZERO_VALUES,
  padding: ZERO_VALUES,
  "padding-top": ZERO_VALUES,
  "padding-right": ZERO_VALUES,
  "padding-bottom": ZERO_VALUES,
  "padding-left": ZERO_VALUES,
  "font-weight": new Set(["normal", "400"]),
  "line-height": NORMAL_VALUES,
  "letter-spacing": NORMAL_VALUES,
  "text-align": new Set(["start", "left"]),
  "text-transform": NONE_VALUES,
  "background-color": TRANSPARENT_VALUES,
  border: new Set(["none", "0", "0px", "0px none"]),
  "border-radius": ZERO_VALUES,
  "box-shadow": NONE_VALUES,
  opacity: new Set(["1"]),
  width: AUTO_VALUES,
  height: AUTO_VALUES,
  "min-width": AUTO_VALUES,
  "min-height": AUTO_VALUES,
  "max-width": NONE_VALUES,
  "max-height": NONE_VALUES,
  top: AUTO_VALUES,
  right: AUTO_VALUES,
  bottom: AUTO_VALUES,
  left: AUTO_VALUES,
  "z-index": AUTO_VALUES,
  overflow: VISIBLE_VALUES,
  "overflow-x": VISIBLE_VALUES,
  "overflow-y": VISIBLE_VALUES,
  "flex-direction": new Set(["row"]),
  "justify-content": new Set(["flex-start"]),
  "align-items": new Set(["stretch"]),
  gap: new Set(["normal", "0", "0px"]),
  grid: NONE_VALUES,
  "grid-template-columns": NONE_VALUES,
  "grid-template-rows": NONE_VALUES
};

function normalizeForComparison(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (/^0(px|pt|em|rem)?$/.test(trimmed)) {
    return "0";
  }
  const noSpaces = trimmed.replace(/\s+/g, "");
  if (noSpaces === "rgba(0,0,0,0)") {
    return "rgba(0, 0, 0, 0)";
  }
  return trimmed;
}

export function isDefaultValue(property: string, value: string): boolean {
  const defaults = DEFAULT_VALUE_MAP[property];
  if (!defaults) {
    return false;
  }
  const normalized = normalizeForComparison(value);
  return defaults.has(normalized);
}
