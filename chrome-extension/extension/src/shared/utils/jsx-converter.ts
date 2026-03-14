const JSX_VOID_ELEMENTS = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr"
];

function kebabToCamelCase(input: string): string {
  return input.replace(/-([a-z])/g, (_, chr: string) => chr.toUpperCase());
}

function styleStringToJsx(style: string): string {
  const pairs = style
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const colonIndex = chunk.indexOf(":");
      if (colonIndex === -1) return null;
      const rawProp = chunk.slice(0, colonIndex).trim();
      const value = chunk.slice(colonIndex + 1).trim();
      const property = kebabToCamelCase(rawProp);
      const escapedValue = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return `${property}: "${escapedValue}"`;
    })
    .filter((p): p is string => p !== null);

  return `{{ ${pairs.join(", ")} }}`;
}

/**
 * Extracts style attribute values from HTML, handling escaped quotes inside.
 * Matches style="..." and style='...'.
 */
function extractAndConvertStyleAttributes(html: string): string {
  const styleDouble = /style="((?:[^"\\]|\\.)*)"/g;
  const styleSingle = /style='((?:[^'\\]|\\.)*)'/g;

  return html
    .replace(styleDouble, (_, style: string) => {
      const unescaped = style.replace(/\\"/g, '"');
      return `style=${styleStringToJsx(unescaped)}`;
    })
    .replace(styleSingle, (_, style: string) => {
      const unescaped = style.replace(/\\'/g, "'");
      return `style=${styleStringToJsx(unescaped)}`;
    });
}

/**
 * Replaces class= and for= only when they are attribute names (not data-class, etc).
 * Matches: space or start of tag, then class= or for=.
 */
function convertReservedAttributes(html: string): string {
  return html
    .replace(/(\s|^)class=/g, "$1className=")
    .replace(/(\s|^)for=/g, "$1htmlFor=");
}

/**
 * Ensures void elements use JSX self-closing syntax: <tag ... />
 */
function ensureVoidElementsSelfClosing(html: string): string {
  let result = html;
  for (const tag of JSX_VOID_ELEMENTS) {
    const openTag = new RegExp(`<${tag}([^>]*?)>`, "gi");
    const selfClose = new RegExp(`<${tag}([^>]*?)/>`, "gi");
    result = result.replace(openTag, (_, attrs) => `<${tag}${attrs.trimEnd()} />`);
    result = result.replace(selfClose, (_, attrs) => {
      const trimmed = attrs.replace(/\s+$/, "");
      return trimmed ? `<${tag}${trimmed} />` : `<${tag} />`;
    });
  }
  return result;
}

export function htmlToJsx(html: string): string {
  let result = html;
  result = extractAndConvertStyleAttributes(result);
  result = convertReservedAttributes(result);
  result = ensureVoidElementsSelfClosing(result);
  return result;
}
