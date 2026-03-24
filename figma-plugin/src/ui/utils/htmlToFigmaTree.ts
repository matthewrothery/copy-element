/**
 * Converts captured HTML (with inlined computed styles) into a serializable
 * FigmaNodeSpec tree that main.ts can use to create Figma nodes.
 *
 * The Chrome extension inlines getComputedStyle() onto every element as inline
 * styles, so we can read them directly from the style attribute — no CSSOM needed.
 */

export interface FigmaSolidFill {
  type: "SOLID";
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaStroke {
  r: number;
  g: number;
  b: number;
  weight: number;
}

export interface FigmaDropShadow {
  type: "DROP_SHADOW";
  r: number;
  g: number;
  b: number;
  a: number;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
}

export interface FigmaNodeSpec {
  type: "FRAME" | "TEXT";
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  fills: FigmaSolidFill[];
  strokes: FigmaStroke[];
  effects: FigmaDropShadow[];
  cornerRadius: number;
  /** FRAME-only */
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  layoutMode: "HORIZONTAL" | "VERTICAL" | "NONE";
  itemSpacing: number;
  children: FigmaNodeSpec[];
  /** TEXT-only */
  characters: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  lineHeight: number | 0;
  textAlignHorizontal: "LEFT" | "RIGHT" | "CENTER" | "JUSTIFIED";
  textColor: FigmaSolidFill | null;
}

// --- Color parsing helpers ---

function parseRgb(val: string): { r: number; g: number; b: number; a: number } | null {
  if (!val || val === "transparent" || val === "none") return null;
  // rgba(r, g, b, a) or rgb(r, g, b)
  const m = val.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (!m) return null;
  return {
    r: parseInt(m[1], 10) / 255,
    g: parseInt(m[2], 10) / 255,
    b: parseInt(m[3], 10) / 255,
    a: m[4] !== undefined ? parseFloat(m[4]) : 1,
  };
}

function px(val: string | null | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
}

function parseShadow(val: string): FigmaDropShadow | null {
  // Basic: "offset-x offset-y blur-radius spread-radius color"
  // e.g. "2px 4px 6px 0px rgba(0,0,0,0.15)"
  if (!val || val === "none") return null;
  const colorMatch = val.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/);
  const color = colorMatch ? parseRgb(colorMatch[0]) : null;
  const parts = val.replace(/rgba?\([^)]+\)/g, "").trim().split(/\s+/);
  const [ox, oy, blur, spread] = parts.map((p) => px(p));
  if (!color) return null;
  return {
    type: "DROP_SHADOW",
    ...color,
    offsetX: ox,
    offsetY: oy,
    blur: blur ?? 0,
    spread: spread ?? 0,
  };
}

// --- Tag → name helper ---

function tagName(el: Element): string {
  const id = el.id ? `#${el.id}` : "";
  return `${el.tagName.toLowerCase()}${id}`;
}

// --- Check if an element contains only text (no element children) ---

function isTextLeaf(el: Element): boolean {
  const children = Array.from(el.childNodes);
  const hasElementChildren = children.some((n) => n.nodeType === Node.ELEMENT_NODE);
  const textContent = el.textContent?.trim() ?? "";
  return !hasElementChildren && textContent.length > 0;
}

function getTextContent(el: Element): string {
  return (el.textContent ?? "").replace(/\s+/g, " ").trim();
}

// --- CSS property reading from inline style ---

function getStyle(el: HTMLElement, prop: string): string {
  return el.style.getPropertyValue(prop).trim();
}

function buildSpec(el: HTMLElement, rootWidth: number, rootHeight: number, isRoot: boolean): FigmaNodeSpec {
  const style = el.style;

  // Dimensions
  let width = isRoot ? rootWidth : px(style.width || style.getPropertyValue("width"));
  let height = isRoot ? rootHeight : px(style.height || style.getPropertyValue("height"));
  // Fallback: use offsetWidth/offsetHeight if available (0 otherwise in DOMParser)
  if (width === 0 && !isRoot) width = (el as HTMLElement).offsetWidth ?? 0;
  if (height === 0 && !isRoot) height = (el as HTMLElement).offsetHeight ?? 0;

  // Position
  const x = px(getStyle(el, "left")) || 0;
  const y = px(getStyle(el, "top")) || 0;

  // Opacity
  const opacityRaw = getStyle(el, "opacity");
  const opacity = opacityRaw ? parseFloat(opacityRaw) : 1;

  // Background fill
  const bgColor = parseRgb(getStyle(el, "background-color"));
  const fills: FigmaSolidFill[] = bgColor ? [{ type: "SOLID", ...bgColor }] : [];

  // Border → stroke
  const borderWidth = px(getStyle(el, "border-top-width") || getStyle(el, "border-width"));
  const borderColor = parseRgb(
    getStyle(el, "border-top-color") || getStyle(el, "border-color")
  );
  const strokes: FigmaStroke[] =
    borderWidth > 0 && borderColor
      ? [{ r: borderColor.r, g: borderColor.g, b: borderColor.b, weight: borderWidth }]
      : [];

  // Box shadow → effect
  const shadowRaw = getStyle(el, "box-shadow");
  const shadow = parseShadow(shadowRaw);
  const effects: FigmaDropShadow[] = shadow ? [shadow] : [];

  // Corner radius
  const cornerRadius =
    px(getStyle(el, "border-radius") || getStyle(el, "border-top-left-radius"));

  // Padding
  const paddingTop = px(getStyle(el, "padding-top"));
  const paddingRight = px(getStyle(el, "padding-right"));
  const paddingBottom = px(getStyle(el, "padding-bottom"));
  const paddingLeft = px(getStyle(el, "padding-left"));

  // Flex layout
  const display = getStyle(el, "display");
  const flexDir = getStyle(el, "flex-direction");
  let layoutMode: "HORIZONTAL" | "VERTICAL" | "NONE" = "NONE";
  if (display === "flex" || display === "inline-flex") {
    layoutMode = flexDir === "column" ? "VERTICAL" : "HORIZONTAL";
  }
  const itemSpacing = px(getStyle(el, "gap") || getStyle(el, "column-gap") || getStyle(el, "row-gap"));

  const name = tagName(el);

  // TEXT leaf node
  if (isTextLeaf(el)) {
    const fontSize = px(getStyle(el, "font-size")) || 14;
    const fontFamily =
      (getStyle(el, "font-family") || "Inter").split(",")[0].replace(/['"]/g, "").trim();
    const fontWeightRaw = getStyle(el, "font-weight");
    const fontWeight = fontWeightRaw === "bold" ? 700 : px(fontWeightRaw) || 400;
    const lineHeightRaw = getStyle(el, "line-height");
    const lineHeight = lineHeightRaw === "normal" ? 0 : px(lineHeightRaw);
    const textAlignRaw = getStyle(el, "text-align");
    const textAlignMap: Record<string, "LEFT" | "RIGHT" | "CENTER" | "JUSTIFIED"> = {
      left: "LEFT",
      right: "RIGHT",
      center: "CENTER",
      justify: "JUSTIFIED",
    };
    const textAlignHorizontal = textAlignMap[textAlignRaw] ?? "LEFT";
    const textColor = parseRgb(getStyle(el, "color"));

    return {
      type: "TEXT",
      name,
      x,
      y,
      width,
      height,
      opacity,
      fills: [],
      strokes: [],
      effects,
      cornerRadius: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      layoutMode: "NONE",
      itemSpacing: 0,
      children: [],
      characters: getTextContent(el),
      fontSize,
      fontFamily,
      fontWeight,
      lineHeight,
      textAlignHorizontal,
      textColor: textColor ? { type: "SOLID", ...textColor } : null,
    };
  }

  // FRAME node — recurse into children
  const childSpecs: FigmaNodeSpec[] = [];
  for (const child of Array.from(el.children)) {
    const tag = (child as HTMLElement).tagName?.toLowerCase();
    // Skip non-visual tags
    if (tag === "script" || tag === "style" || tag === "noscript") continue;
    childSpecs.push(buildSpec(child as HTMLElement, 0, 0, false));
  }

  return {
    type: "FRAME",
    name,
    x,
    y,
    width,
    height,
    opacity,
    fills,
    strokes,
    effects,
    cornerRadius,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    layoutMode,
    itemSpacing,
    children: childSpecs,
    characters: "",
    fontSize: 14,
    fontFamily: "Inter",
    fontWeight: 400,
    lineHeight: 0,
    textAlignHorizontal: "LEFT",
    textColor: null,
  };
}

/**
 * Parse an HTML string (with inlined computed styles) into a FigmaNodeSpec tree.
 *
 * @param htmlString - The full HTML captured by the extension
 * @param rootWidth - The root element's width in pixels (from capture metadata)
 * @param rootHeight - The root element's height in pixels (from capture metadata)
 */
export function buildFigmaTree(
  htmlString: string,
  rootWidth: number,
  rootHeight: number
): FigmaNodeSpec {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");
  const root = doc.body.firstElementChild as HTMLElement | null;

  if (!root) {
    // Return a placeholder frame if parsing fails
    return {
      type: "FRAME",
      name: "captured-element",
      x: 0,
      y: 0,
      width: rootWidth || 400,
      height: rootHeight || 200,
      opacity: 1,
      fills: [],
      strokes: [],
      effects: [],
      cornerRadius: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      layoutMode: "NONE",
      itemSpacing: 0,
      children: [],
      characters: "",
      fontSize: 14,
      fontFamily: "Inter",
      fontWeight: 400,
      lineHeight: 0,
      textAlignHorizontal: "LEFT",
      textColor: null,
    };
  }

  return buildSpec(root, rootWidth, rootHeight, true);
}
