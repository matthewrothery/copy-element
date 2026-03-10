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
  "text-decoration": NONE_VALUES,
  "text-shadow": NONE_VALUES,
  "text-overflow": new Set(["clip"]),
  "white-space": NORMAL_VALUES,
  "word-wrap": NORMAL_VALUES,
  "word-break": NORMAL_VALUES,
  "vertical-align": new Set(["baseline"]),
  "background-color": TRANSPARENT_VALUES,
  "background-image": NONE_VALUES,
  "background-size": AUTO_VALUES,
  "background-position": new Set(["0% 0%"]),
  "background-repeat": new Set(["repeat"]),
  border: new Set(["none", "0", "0px", "0px none"]),
  "border-top": new Set(["none", "0", "0px", "0px none"]),
  "border-right": new Set(["none", "0", "0px", "0px none"]),
  "border-bottom": new Set(["none", "0", "0px", "0px none"]),
  "border-left": new Set(["none", "0", "0px", "0px none"]),
  "border-radius": ZERO_VALUES,
  "box-shadow": NONE_VALUES,
  outline: new Set(["none", "0", "0px"]),
  opacity: new Set(["1"]),
  visibility: VISIBLE_VALUES,
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
  resize: NONE_VALUES,
  "flex-direction": new Set(["row"]),
  "flex-wrap": new Set(["nowrap"]),
  "flex-grow": ZERO_VALUES,
  "flex-shrink": new Set(["1"]),
  "flex-basis": AUTO_VALUES,
  "justify-content": new Set(["flex-start"]),
  "align-items": new Set(["stretch"]),
  "align-self": AUTO_VALUES,
  "align-content": new Set(["normal", "stretch"]),
  order: ZERO_VALUES,
  gap: new Set(["normal", "0", "0px"]),
  "column-gap": new Set(["normal", "0", "0px"]),
  "row-gap": new Set(["normal", "0", "0px"]),
  grid: NONE_VALUES,
  "grid-area": new Set(["auto / auto / auto / auto"]),
  "grid-auto-flow": new Set(["row"]),
  "grid-column": new Set(["auto / auto"]),
  "grid-row": new Set(["auto / auto"]),
  "grid-template-columns": NONE_VALUES,
  "grid-template-rows": NONE_VALUES,
  transform: NONE_VALUES,
  filter: NONE_VALUES,
  "clip-path": NONE_VALUES,
  "object-fit": new Set(["fill"]),
  "object-position": new Set(["50% 50%"])
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
