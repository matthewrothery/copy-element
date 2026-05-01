import { Marked, Renderer, type Tokens } from "marked";

function slugifyHeading(text: string): string {
  const base = text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base.length > 0 ? base : "section";
}

function createSlugAllocator(): (plain: string) => string {
  const counts = new Map<string, number>();
  return (plain: string) => {
    const base = slugifyHeading(plain);
    const n = counts.get(base) ?? 0;
    counts.set(base, n + 1);
    return n === 0 ? base : `${base}-${n}`;
  };
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Lucide-style link-2 icon, stroke-only */
const LINK_ICON_SVG = `<svg class="article-heading__icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

let allocateSlug = createSlugAllocator();

const articleMarkdown = new Marked();

articleMarkdown.use({
  gfm: true,
  hooks: {
    preprocess(markdown: string) {
      allocateSlug = createSlugAllocator();
      return markdown;
    },
  },
  renderer: {
    heading(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, {
      tokens,
      depth,
      text,
    }: Tokens.Heading) {
      const slug = allocateSlug(text);
      const body = this.parser.parseInline(tokens);
      const label = escapeHtmlAttr(text);
      const anchor = `<a class="article-heading__anchor" href="#${slug}" aria-label="Permalink: ${label}">${LINK_ICON_SVG}</a>`;
      return `<h${depth} id="${slug}" class="article-heading"><span class="article-heading__text">${body}</span>${anchor}</h${depth}>\n`;
    },
    table(this: Renderer, token: Tokens.Table) {
      const inner = Renderer.prototype.table.call(this, token);
      return `<div class="article-table-wrap">${inner}</div>\n`;
    },
  },
});

export function markdownToArticleHtml(markdown: string): string {
  return articleMarkdown.parse(markdown) as string;
}
