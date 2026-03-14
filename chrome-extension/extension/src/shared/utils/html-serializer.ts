import { SVG_NS } from "../constants";

const HTML5_VOID_ELEMENTS = new Set([
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
]);

function ensureSvgXmlns(root: Element): void {
  const svgs = root.querySelectorAll("svg");
  for (const svg of Array.from(svgs)) {
    if (!svg.hasAttribute("xmlns")) {
      svg.setAttribute("xmlns", SVG_NS);
    }
  }
}

/**
 * Normalizes a CSS style string by removing unnecessary whitespace.
 * Trims spaces around colons and semicolons, collapses multiple spaces.
 */
export function normalizeStyleString(style: string): string {
  return style
    .split(";")
    .map((decl) => decl.trim())
    .filter(Boolean)
    .map((decl) => {
      const colonIndex = decl.indexOf(":");
      if (colonIndex === -1) return decl;
      const prop = decl.slice(0, colonIndex).trim();
      const value = decl.slice(colonIndex + 1).trim().replace(/\s+/g, " ");
      return `${prop}:${value}`;
    })
    .join(";");
}

/**
 * Normalizes all style attributes in an HTML string.
 */
function normalizeStyleAttributesInHtml(html: string): string {
  return html.replace(/style="([^"]*)"/g, (_, style: string) => {
    const normalized = normalizeStyleString(style);
    return `style="${normalized}"`;
  });
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getAttributesString(element: Element): string {
  const parts: string[] = [];
  for (const attr of Array.from(element.attributes)) {
    if (attr.value === "") {
      parts.push(attr.name);
    } else {
      parts.push(`${attr.name}="${escapeHtmlAttribute(attr.value)}"`);
    }
  }
  const attrs = parts.length > 0 ? " " + parts.join(" ") : "";
  return attrs;
}

function serializeNodeWithIndent(
  node: Node,
  indent: string,
  currentIndent: string
): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent?.trim();
    return text ? currentIndent + escapeHtmlText(text) : "";
  }
  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }
  const el = node as Element;
  const tagName = el.tagName.toLowerCase();
  const attrs = getAttributesString(el);
  const children = Array.from(el.childNodes);
  const hasChildren = children.length > 0;
  const isVoid = HTML5_VOID_ELEMENTS.has(tagName);

  if (isVoid) {
    return currentIndent + `<${tagName}${attrs} />`;
  }
  if (!hasChildren) {
    return currentIndent + `<${tagName}${attrs}></${tagName}>`;
  }
  const childIndent = currentIndent + indent;
  const childLines = children
    .map((c) => serializeNodeWithIndent(c, indent, childIndent))
    .filter(Boolean);
  return (
    currentIndent +
    `<${tagName}${attrs}>\n` +
    childLines.join("\n") +
    "\n" +
    currentIndent +
    `</${tagName}>`
  );
}

/**
 * Formats HTML with indentation for readability.
 * Uses DOMParser to parse the HTML, then recursively serializes with indent.
 */
export function formatHtmlForReadability(
  html: string,
  indentSize: number = 2
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const body = doc.body;
  const indent = " ".repeat(indentSize);
  const lines: string[] = [];
  for (const child of Array.from(body.childNodes)) {
    const line = serializeNodeWithIndent(child, indent, indent);
    if (line) {
      lines.push(line);
    }
  }
  return lines.join("\n");
}

export function serializeElementToHtml(element: HTMLElement): string {
  const container = document.createElement("div");
  const clone = element.cloneNode(true) as HTMLElement;
  container.appendChild(clone);
  ensureSvgXmlns(container);
  let html = container.innerHTML;
  html = normalizeStyleAttributesInHtml(html);
  html = formatHtmlForReadability(html);
  return html;
}
