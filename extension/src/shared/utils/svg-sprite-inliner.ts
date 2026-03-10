/**
 * Inlines SVG sprite references so <use href="url#id"> becomes self-contained.
 * Fetches the sprite at capture time (same-origin from page) and embeds the symbol
 * so the preview renders without external requests (avoids CORS/sandbox issues).
 */

const SVG_NS = "http://www.w3.org/2000/svg";

interface UseRef {
  element: SVGUseElement;
  spriteUrl: string;
  fragmentId: string;
}

function resolveUrl(href: string, baseUrl: string): string {
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

function parseUseHref(href: string): { url: string; fragmentId: string } | null {
  const hashIndex = href.indexOf("#");
  if (hashIndex === -1) return null;
  const url = href.slice(0, hashIndex).trim();
  const fragmentId = href.slice(hashIndex + 1).trim();
  if (!url || !fragmentId) return null;
  return { url, fragmentId };
}

function findUseElements(root: Element): UseRef[] {
  const results: UseRef[] = [];
  const uses = root.querySelectorAll("use");
  for (const use of Array.from(uses)) {
    if (use.namespaceURI !== SVG_NS) continue;
    const href = use.getAttribute("href") ?? use.getAttribute("xlink:href");
    if (!href || !href.includes("#")) continue;
    const parsed = parseUseHref(href);
    if (!parsed) continue;
    results.push({
      element: use as SVGUseElement,
      spriteUrl: parsed.url,
      fragmentId: parsed.fragmentId
    });
  }
  return results;
}

async function fetchSprite(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sprite fetch failed: ${res.status}`);
  return res.text();
}

function parseSvgSprite(svgText: string, doc: Document): Document {
  const parser = new DOMParser();
  const parsed = parser.parseFromString(svgText, "image/svg+xml");
  return parsed;
}

function findSymbol(spriteDoc: Document, fragmentId: string): Element | null {
  const symbol = spriteDoc.getElementById(fragmentId);
  if (symbol && symbol.tagName.toLowerCase() === "symbol") return symbol;
  return spriteDoc.querySelector(`symbol[id="${CSS.escape(fragmentId)}"]`);
}

function ensureDefs(parentSvg: Element, doc: Document): Element {
  let defs = parentSvg.querySelector("defs");
  if (!defs) {
    defs = doc.createElementNS(SVG_NS, "defs");
    parentSvg.insertBefore(defs, parentSvg.firstChild);
  }
  return defs;
}

function hasSymbol(defs: Element, fragmentId: string): boolean {
  return defs.querySelector(`symbol[id="${CSS.escape(fragmentId)}"]`) !== null;
}

/**
 * Inlines external SVG sprite references in the given root element.
 * Replaces <use href="url#id"> with same-document references by fetching the sprite
 * and embedding the symbol in a local defs block.
 */
export async function inlineSvgSprites(
  root: Element,
  baseUrl: string
): Promise<void> {
  const doc = root.ownerDocument;
  const useRefs = findUseElements(root);

  const spriteCache = new Map<string, Document>();

  for (const { element, spriteUrl, fragmentId } of useRefs) {
    try {
      const absoluteUrl = resolveUrl(spriteUrl, baseUrl);
      let spriteDoc = spriteCache.get(absoluteUrl);
      if (!spriteDoc) {
        const svgText = await fetchSprite(absoluteUrl);
        spriteDoc = parseSvgSprite(svgText, doc);
        spriteCache.set(absoluteUrl, spriteDoc);
      }

      const symbol = findSymbol(spriteDoc, fragmentId);
      if (!symbol) continue;

      const parentSvg = element.closest("svg");
      if (!parentSvg) continue;

      const defs = ensureDefs(parentSvg, doc);
      if (!hasSymbol(defs, fragmentId)) {
        const symbolClone = symbol.cloneNode(true) as Element;
        defs.appendChild(symbolClone);
      }

      element.setAttribute("href", `#${fragmentId}`);
      element.removeAttribute("xlink:href");
    } catch {
      // Leave use as-is on fetch/parse failure
    }
  }
}
