export type Framework = "react" | "vue" | "nextjs";

export interface ConvertOptions {
  framework: Framework;
  convertToTailwind: boolean;
  addA11y: boolean;
}

// ─── JSX transformation ───────────────────────────────────────────────────────

const VOID_ELEMENTS = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input",
  "link", "meta", "param", "source", "track", "wbr",
]);

const EVENT_ATTR_MAP: Record<string, string> = {
  onclick: "onClick", ondblclick: "onDoubleClick", onchange: "onChange",
  oninput: "onInput", onsubmit: "onSubmit", onkeydown: "onKeyDown",
  onkeyup: "onKeyUp", onkeypress: "onKeyPress", onmousedown: "onMouseDown",
  onmouseup: "onMouseUp", onmouseover: "onMouseOver", onmouseout: "onMouseOut",
  onmousemove: "onMouseMove", onfocus: "onFocus", onblur: "onBlur",
  onload: "onLoad", onerror: "onError", onscroll: "onScroll",
  onresize: "onResize", onselect: "onSelect", oncontextmenu: "onContextMenu",
  ondrag: "onDrag", ondragend: "onDragEnd", ondragenter: "onDragEnter",
  ondragleave: "onDragLeave", ondragover: "onDragOver", ondragstart: "onDragStart",
  ondrop: "onDrop", ontouchstart: "onTouchStart", ontouchmove: "onTouchMove",
  ontouchend: "onTouchEnd",
};

function transformToJsx(html: string, tailwindAlreadyApplied: boolean): string {
  let result = html;

  // HTML comments → JSX comments
  result = result.replace(/<!--([\s\S]*?)-->/g, (_, content) => `{/*${content}*/}`);

  // Event attributes (case-insensitive)
  result = result.replace(/\b(on\w+)\s*=/gi, (_, attr: string) => {
    const lower = attr.toLowerCase();
    return (EVENT_ATTR_MAP[lower] ?? attr) + "=";
  });

  // class= → className=
  result = result.replace(/\bclass=/g, "className=");

  // for= → htmlFor= (but not before="..." which is valid HTML)
  result = result.replace(/\bfor=/g, "htmlFor=");

  // Inline style strings → JSX style objects (skip if Tailwind conversion already removed them)
  if (!tailwindAlreadyApplied) {
    result = result.replace(/\bstyle="([^"]*)"/g, (_, styleStr: string) => {
      return `style={${styleStringToJsxObject(styleStr)}}`;
    });
  } else {
    // Tailwind conversion leaves residual style attr for unmapped props - convert those
    result = result.replace(/\bstyle="([^"]*)"/g, (_, styleStr: string) => {
      return `style={${styleStringToJsxObject(styleStr)}}`;
    });
  }

  // Self-close void elements
  result = result.replace(/<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)(\s[^>]*)?\s*\/?>/gi, (_, tag: string, attrs = "") => {
    const tagLower = tag.toLowerCase();
    if (VOID_ELEMENTS.has(tagLower)) {
      return `<${tag}${attrs} />`;
    }
    return `<${tag}${attrs}>`;
  });

  return result;
}

// ─── Style string → JSX object ────────────────────────────────────────────────

function cssPropertyToJsObject(property: string): string {
  return property
    .trim()
    .toLowerCase()
    .replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function cssValueToJs(value: string): string {
  const trimmed = value.trim();
  // Numeric-only (no unit) → number
  if (/^\d+(\.\d+)?$/.test(trimmed)) return trimmed;
  return `'${trimmed.replace(/'/g, "\\'")}'`;
}

export function styleStringToJsxObject(styleStr: string): string {
  const declarations = styleStr
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean);

  if (declarations.length === 0) return "{}";

  const pairs = declarations
    .map((decl) => {
      const colonIdx = decl.indexOf(":");
      if (colonIdx === -1) return null;
      const prop = cssPropertyToJsObject(decl.slice(0, colonIdx));
      const value = cssValueToJs(decl.slice(colonIdx + 1));
      return `${prop}: ${value}`;
    })
    .filter((p): p is string => p !== null);

  if (pairs.length === 0) return "{}";
  return `{ ${pairs.join(", ")} }`;
}

// ─── CSS → Tailwind mapping ───────────────────────────────────────────────────

// Spacing: maps pixel values to Tailwind scale (4px = 1 unit)
function pxToTailwindScale(px: number): string | null {
  const scale: Record<number, string> = {
    0: "0", 1: "px", 2: "0.5", 4: "1", 6: "1.5", 8: "2", 10: "2.5",
    12: "3", 14: "3.5", 16: "4", 20: "5", 24: "6", 28: "7", 32: "8",
    36: "9", 40: "10", 44: "11", 48: "12", 56: "14", 64: "16", 80: "20",
    96: "24", 112: "28", 128: "32", 144: "36", 160: "40", 176: "44",
    192: "48", 208: "52", 224: "56", 240: "60", 256: "64", 288: "72",
    320: "80", 384: "96",
  };
  return scale[px] ?? null;
}

function parsePx(value: string): number | null {
  const match = /^(\d+(?:\.\d+)?)px$/.exec(value.trim());
  return match ? parseFloat(match[1]) : null;
}

function mapCssToTailwind(property: string, value: string): string[] {
  const prop = property.trim().toLowerCase();
  const val = value.trim().toLowerCase();
  const classes: string[] = [];

  switch (prop) {
    // Display
    case "display":
      if (val === "flex") classes.push("flex");
      else if (val === "inline-flex") classes.push("inline-flex");
      else if (val === "grid") classes.push("grid");
      else if (val === "inline-grid") classes.push("inline-grid");
      else if (val === "none") classes.push("hidden");
      else if (val === "block") classes.push("block");
      else if (val === "inline-block") classes.push("inline-block");
      else if (val === "inline") classes.push("inline");
      break;

    // Flex
    case "flex-direction":
      if (val === "column") classes.push("flex-col");
      else if (val === "column-reverse") classes.push("flex-col-reverse");
      else if (val === "row-reverse") classes.push("flex-row-reverse");
      break;
    case "flex-wrap":
      if (val === "wrap") classes.push("flex-wrap");
      else if (val === "nowrap") classes.push("flex-nowrap");
      else if (val === "wrap-reverse") classes.push("flex-wrap-reverse");
      break;
    case "align-items":
      if (val === "center") classes.push("items-center");
      else if (val === "flex-start" || val === "start") classes.push("items-start");
      else if (val === "flex-end" || val === "end") classes.push("items-end");
      else if (val === "stretch") classes.push("items-stretch");
      else if (val === "baseline") classes.push("items-baseline");
      break;
    case "justify-content":
      if (val === "center") classes.push("justify-center");
      else if (val === "flex-start" || val === "start") classes.push("justify-start");
      else if (val === "flex-end" || val === "end") classes.push("justify-end");
      else if (val === "space-between") classes.push("justify-between");
      else if (val === "space-around") classes.push("justify-around");
      else if (val === "space-evenly") classes.push("justify-evenly");
      break;
    case "align-self":
      if (val === "center") classes.push("self-center");
      else if (val === "flex-start" || val === "start") classes.push("self-start");
      else if (val === "flex-end" || val === "end") classes.push("self-end");
      else if (val === "stretch") classes.push("self-stretch");
      break;
    case "flex":
      if (val === "1") classes.push("flex-1");
      else if (val === "auto") classes.push("flex-auto");
      else if (val === "none") classes.push("flex-none");
      break;

    // Grid
    case "gap": {
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`gap-${scale}`);
      break;
    }
    case "column-gap":
    case "grid-column-gap": {
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`gap-x-${scale}`);
      break;
    }
    case "row-gap":
    case "grid-row-gap": {
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`gap-y-${scale}`);
      break;
    }

    // Spacing-padding
    case "padding": {
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`p-${scale}`);
      break;
    }
    case "padding-top": {
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`pt-${scale}`);
      break;
    }
    case "padding-right": {
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`pr-${scale}`);
      break;
    }
    case "padding-bottom": {
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`pb-${scale}`);
      break;
    }
    case "padding-left": {
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`pl-${scale}`);
      break;
    }
    case "padding-inline": {
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`px-${scale}`);
      break;
    }
    case "padding-block": {
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`py-${scale}`);
      break;
    }

    // Spacing-margin
    case "margin": {
      if (val === "auto") { classes.push("m-auto"); break; }
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`m-${scale}`);
      break;
    }
    case "margin-top": {
      if (val === "auto") { classes.push("mt-auto"); break; }
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`mt-${scale}`);
      break;
    }
    case "margin-right": {
      if (val === "auto") { classes.push("mr-auto"); break; }
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`mr-${scale}`);
      break;
    }
    case "margin-bottom": {
      if (val === "auto") { classes.push("mb-auto"); break; }
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`mb-${scale}`);
      break;
    }
    case "margin-left": {
      if (val === "auto") { classes.push("ml-auto"); break; }
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`ml-${scale}`);
      break;
    }
    case "margin-inline": {
      if (val === "auto") { classes.push("mx-auto"); break; }
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`mx-${scale}`);
      break;
    }
    case "margin-block": {
      if (val === "auto") { classes.push("my-auto"); break; }
      const px = parsePx(val);
      const scale = px !== null ? pxToTailwindScale(px) : null;
      if (scale) classes.push(`my-${scale}`);
      break;
    }

    // Typography
    case "font-weight":
      if (val === "bold" || val === "700") classes.push("font-bold");
      else if (val === "600" || val === "semibold") classes.push("font-semibold");
      else if (val === "500" || val === "medium") classes.push("font-medium");
      else if (val === "normal" || val === "400") classes.push("font-normal");
      else if (val === "300") classes.push("font-light");
      break;
    case "font-style":
      if (val === "italic") classes.push("italic");
      else if (val === "normal") classes.push("not-italic");
      break;
    case "text-decoration":
      if (val === "underline") classes.push("underline");
      else if (val === "line-through") classes.push("line-through");
      else if (val === "none") classes.push("no-underline");
      break;
    case "text-align":
      if (val === "center") classes.push("text-center");
      else if (val === "left") classes.push("text-left");
      else if (val === "right") classes.push("text-right");
      else if (val === "justify") classes.push("text-justify");
      break;
    case "font-size": {
      const fontSizeMap: Record<string, string> = {
        "12px": "text-xs", "14px": "text-sm", "16px": "text-base",
        "18px": "text-lg", "20px": "text-xl", "24px": "text-2xl",
        "30px": "text-3xl", "36px": "text-4xl", "48px": "text-5xl",
        "60px": "text-6xl", "72px": "text-7xl",
      };
      const mapped = fontSizeMap[val];
      if (mapped) classes.push(mapped);
      break;
    }

    // Sizing
    case "width":
      if (val === "100%") classes.push("w-full");
      else if (val === "100vw") classes.push("w-screen");
      else if (val === "auto") classes.push("w-auto");
      else if (val === "fit-content") classes.push("w-fit");
      else if (val === "min-content") classes.push("w-min");
      else if (val === "max-content") classes.push("w-max");
      else {
        const px = parsePx(val);
        const scale = px !== null ? pxToTailwindScale(px) : null;
        if (scale) classes.push(`w-${scale}`);
      }
      break;
    case "height":
      if (val === "100%") classes.push("h-full");
      else if (val === "100vh") classes.push("h-screen");
      else if (val === "auto") classes.push("h-auto");
      else if (val === "fit-content") classes.push("h-fit");
      else {
        const px = parsePx(val);
        const scale = px !== null ? pxToTailwindScale(px) : null;
        if (scale) classes.push(`h-${scale}`);
      }
      break;

    // Position
    case "position":
      if (val === "relative") classes.push("relative");
      else if (val === "absolute") classes.push("absolute");
      else if (val === "fixed") classes.push("fixed");
      else if (val === "sticky") classes.push("sticky");
      else if (val === "static") classes.push("static");
      break;

    // Overflow
    case "overflow":
      if (val === "hidden") classes.push("overflow-hidden");
      else if (val === "auto") classes.push("overflow-auto");
      else if (val === "scroll") classes.push("overflow-scroll");
      else if (val === "visible") classes.push("overflow-visible");
      break;

    // Border radius
    case "border-radius": {
      const radiusMap: Record<string, string> = {
        "0": "rounded-none", "2px": "rounded-sm", "4px": "rounded",
        "6px": "rounded-md", "8px": "rounded-lg", "12px": "rounded-xl",
        "16px": "rounded-2xl", "24px": "rounded-3xl", "9999px": "rounded-full",
        "50%": "rounded-full",
      };
      const mapped = radiusMap[val];
      if (mapped) classes.push(mapped);
      break;
    }

    // Cursor
    case "cursor":
      if (val === "pointer") classes.push("cursor-pointer");
      else if (val === "default") classes.push("cursor-default");
      else if (val === "not-allowed") classes.push("cursor-not-allowed");
      break;

    // Opacity
    case "opacity":
      if (val === "0") classes.push("opacity-0");
      else if (val === "0.5" || val === ".5") classes.push("opacity-50");
      else if (val === "0.75" || val === ".75") classes.push("opacity-75");
      else if (val === "1") classes.push("opacity-100");
      break;
  }

  return classes;
}

function convertInlineStylesToTailwind(html: string): string {
  return html.replace(/\bstyle="([^"]*)"/g, (fullMatch, styleStr: string) => {
    const declarations = styleStr
      .split(";")
      .map((d) => d.trim())
      .filter(Boolean);

    const tailwindClasses: string[] = [];
    const unmapped: string[] = [];

    for (const decl of declarations) {
      const colonIdx = decl.indexOf(":");
      if (colonIdx === -1) continue;
      const prop = decl.slice(0, colonIdx).trim();
      const val = decl.slice(colonIdx + 1).trim();
      const classes = mapCssToTailwind(prop, val);
      if (classes.length > 0) {
        tailwindClasses.push(...classes);
      } else {
        unmapped.push(decl);
      }
    }

    // Build replacement: remove style if fully mapped, keep residual
    const tailwindAttr = tailwindClasses.length > 0
      ? `data-tw="${tailwindClasses.join(" ")}"` // marker-merged into className later
      : "";

    const residualStyle = unmapped.length > 0
      ? `style="${unmapped.join("; ")}"`
      : "";

    return [tailwindAttr, residualStyle].filter(Boolean).join(" ");
  });
}

// After Tailwind conversion, merge data-tw into className/class
function mergeTailwindMarkers(html: string): string {
  // Merge data-tw into existing className/class
  let result = html;

  // className="existing" data-tw="new-classes" → className="existing new-classes"
  result = result.replace(/className="([^"]*?)"\s+data-tw="([^"]+)"/g,
    (_, existing: string, tw: string) => `className="${[existing, tw].filter(Boolean).join(" ")}"`);

  // data-tw="new-classes" className="existing" → className="existing new-classes"
  result = result.replace(/data-tw="([^"]+)"\s+className="([^"]*?)"/g,
    (_, tw: string, existing: string) => `className="${[existing, tw].filter(Boolean).join(" ")}"`);

  // class="existing" data-tw="new-classes" (Vue)
  result = result.replace(/class="([^"]*?)"\s+data-tw="([^"]+)"/g,
    (_, existing: string, tw: string) => `class="${[existing, tw].filter(Boolean).join(" ")}"`);
  result = result.replace(/data-tw="([^"]+)"\s+class="([^"]*?)"/g,
    (_, tw: string, existing: string) => `class="${[existing, tw].filter(Boolean).join(" ")}"`);

  // Standalone data-tw (no existing class attr) → className="..."
  result = result.replace(/data-tw="([^"]+)"/g,
    (_, tw: string) => `className="${tw}"`);

  return result;
}

// ─── Accessibility fixes ──────────────────────────────────────────────────────

function applyA11yFixes(html: string): string {
  let result = html;

  // Add alt="" to <img> tags missing an alt attribute
  result = result.replace(/<img\b([^>]*?)>/gi, (match, attrs: string) => {
    if (/\balt\s*=/.test(attrs)) return match;
    return `<img${attrs} alt="">`;
  });

  // Add aria-label to <button> elements that have no text content (icon-only)
  result = result.replace(/<button\b([^>]*?)>(\s*)<\/button>/gi, (match, attrs: string, content: string) => {
    if (/\baria-label\s*=/.test(attrs) || content.trim()) return match;
    return `<button${attrs} aria-label="Button">${content}</button>`;
  });

  // Wrap bare <input> elements (not inside a <label>)-simplified: add aria-label if missing
  result = result.replace(/<input\b([^>]*?)>/gi, (match, attrs: string) => {
    if (/\baria-label\s*=/.test(attrs) || /\bid\s*=/.test(attrs)) return match;
    const typeMatch = /\btype="([^"]+)"/.exec(attrs);
    const type = typeMatch ? typeMatch[1] : "text";
    if (type === "hidden" || type === "submit" || type === "button" || type === "reset") return match;
    return `<input${attrs} aria-label="${type} field">`;
  });

  return result;
}

// ─── Component wrappers ───────────────────────────────────────────────────────

function wrapInReactComponent(jsx: string): string {
  const indented = jsx
    .split("\n")
    .map((line) => (line.trim() ? `      ${line}` : ""))
    .join("\n");

  return [
    `import type { ReactElement } from 'react';`,
    ``,
    `export default function Component(): ReactElement {`,
    `  return (`,
    indented,
    `  );`,
    `}`,
  ].join("\n");
}

function wrapInNextComponent(jsx: string, needsClientDirective: boolean): string {
  const indented = jsx
    .split("\n")
    .map((line) => (line.trim() ? `      ${line}` : ""))
    .join("\n");

  const lines: string[] = [];
  if (needsClientDirective) lines.push(`'use client';`, ``);
  lines.push(
    `import type { ReactElement } from 'react';`,
    ``,
    `export default function Component(): ReactElement {`,
    `  return (`,
    indented,
    `  );`,
    `}`,
  );
  return lines.join("\n");
}

function wrapInVueSfc(html: string): string {
  const indented = html
    .split("\n")
    .map((line) => (line.trim() ? `  ${line}` : ""))
    .join("\n");

  return [
    `<template>`,
    indented,
    `</template>`,
    ``,
    `<script setup lang="ts">`,
    `</script>`,
    ``,
    `<style scoped>`,
    `</style>`,
  ].join("\n");
}

// ─── Re-export with Tailwind marker merging applied ───────────────────────────

// Override the entry point to also handle marker merging post-JSX transform
export function convertHtmlFull(html: string, options: ConvertOptions): string {
  const { framework, convertToTailwind, addA11y } = options;

  let result = html.trim();

  if (addA11y) result = applyA11yFixes(result);

  if (convertToTailwind) {
    result = convertInlineStylesToTailwind(result);
  }

  if (framework === "vue") {
    // For Vue: merge Tailwind markers into class=, no JSX transforms
    if (convertToTailwind) result = mergeTailwindMarkers(result);
    return wrapInVueSfc(result);
  }

  const jsx = transformToJsx(result, convertToTailwind);
  const merged = convertToTailwind ? mergeTailwindMarkers(jsx) : jsx;
  const hasEventHandlers = /\bon\w+\s*=/.test(html);

  if (framework === "nextjs") return wrapInNextComponent(merged, hasEventHandlers);
  return wrapInReactComponent(merged);
}
