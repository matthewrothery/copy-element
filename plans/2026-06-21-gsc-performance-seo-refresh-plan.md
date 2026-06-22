---
title: Search Console performance SEO refresh plan
status: Proposed
created: 2026-06-21
owner: matt
area: website, seo, content
tags: [seo, search-console, topics, product-page, content-refresh]
---

# Search Console performance SEO refresh plan

## Purpose

Use the June 21 Google Search Console export to improve pages that are already getting impressions, rankings, or clicks.

This plan is for review before implementation. It does not make page changes yet.

## Data reviewed

Local export:

- `google-search-console/elementarmory.com-Performance-on-Search-2026-06-21/Pages.csv`
- `google-search-console/elementarmory.com-Performance-on-Search-2026-06-21/Queries.csv`
- `google-search-console/elementarmory.com-Performance-on-Search-2026-06-21/Filters.csv`
- `google-search-console/elementarmory.com-Performance-on-Search-2026-06-21/performance-review.md`
- `google-search-console/elementarmory.com-Performance-on-Search-2026-06-21/performance-review.json`

Local site files sampled:

- `website/content/topics/copy-ui-from-websites/copy-html-from-website/copy-html-of-element-chrome.md`
- `website/content/topics/copy-ui-from-websites/copy-html-from-website/how-to-copy-html-from-website.md`
- `website/content/topics/copy-ui-from-websites/copy-ui-without-devtools/copy-html-without-inspect-element.md`
- `website/content/topics/tool-alternatives/snipcss-alternative/snipcss-review.md`
- `website/app/page.tsx`
- `website/app/product/page.tsx`

External research:

- Google Search Central title-link guidance: use descriptive, concise, distinct titles; avoid stuffing and boilerplate.
- Google Search Central snippet guidance: write unique page-level descriptions for critical and popular pages.
- Google Search Central helpful-content guidance: prioritize people-first content and substantial original value.
- Google Search Central spam policies: avoid scaled pages created primarily for rankings.
- Chrome DevTools DOM documentation: users inspect nodes in the Elements panel and interact with DOM tree options.
- MDN `outerHTML` reference: `outerHTML` serializes an element and descendants, but omits shadow roots and needs safe handling if inserted into the DOM.

Copy context:

- `copywriter.md` is now present at the repo root.
- It contains useful desire-driven copy doctrine: headline sequence, desire before justification, concrete outcome language, and skimmer/deep-reader structure.
- Its product facts are for Demoly, not Element Armory. For this project, `AGENTS.md` remains authoritative for product name, tagline, CTAs, shipped capabilities, and feature constraints.
- Do not use Demoly-specific CTAs, product claims, or audience assumptions for Element Armory pages.

## Current GSC signal

Filter: Web search, Last 3 months.

| Metric | Value |
|---|---:|
| Page rows | 175 |
| Query rows | 62 |
| Page totals | 30 clicks / 3,039 impressions |
| Query export totals | 1 click / 242 impressions |

The old `old-performance` export uses `Last 28 days`, so direct movement comparison is not reliable. Future exports should use the same date range when possible.

## Main finding

The current traffic is not broad "AI UI" demand yet. It is practical developer extraction demand:

- Chrome DevTools, Copy Element, and Copy outerHTML.
- Copy HTML from a website or element.
- Copy HTML without Inspect Element.
- CSS extraction and CSS extractor extension.
- Tool-alternative searches.

The fastest win is to align existing high-impression pages to those exact jobs, then bridge those pages into Element Armory's AI workflow story.

## Guardrails

- Use official product naming where surfaced: `Element Armory – Capture UI Elements` for official headers/listings, `Element Armory` for normal UI labels.
- Preserve the core tagline exactly where used: `Capture UI from any site and rebuild it with AI.`
- Do not claim JSX export or Tailwind output as shipped website features. HTML is the only supported export format.
- Competitor names should only appear on explicit comparison/alternative pages, consistent with the existing SEO plan's exception. Do not add competitor references to general marketing pages.
- Do not create many near-duplicate keyword pages. Refresh existing pages first.
- Keep titles/descriptions descriptive and concise. Avoid keyword stuffing.
- Any substantial content refresh should add original workflow value, not just rewrite search-result language.
- Apply `copywriter.md` only as copycraft guidance where it does not conflict with Element Armory product facts.
- Headline sequences should tell a clear story for skimmers: practical extraction problem, faster capture workflow, believable developer outcome.

## Priority 1 - Refresh highest-opportunity Copy HTML pages

These pages have the clearest product fit and largest visibility.

| Page | Clicks | Impressions | CTR | Position | Job to align |
|---|---:|---:|---:|---:|---|
| `/topics/copy-ui-from-websites/copy-html-from-website/copy-html-of-element-chrome` | 3 | 796 | 0.38% | 9.03 | Copy one element's HTML in Chrome DevTools |
| `/topics/copy-ui-from-websites/copy-html-from-website/how-to-copy-html-from-website` | 0 | 277 | 0.00% | 11.26 | Copy HTML from a page or selected element |
| `/topics/copy-ui-from-websites/copy-ui-without-devtools/copy-html-without-inspect-element` | 1 | 172 | 0.58% | 11.23 | Copy HTML without opening Inspect Element |
| `/topics/copy-ui-from-websites/copy-html-from-website/copy-html-without-scripts` | 0 | 23 | 0.00% | 7.96 | Clean HTML without script noise |

### Proposed changes

For `copy-html-of-element-chrome`:

- Rework the opening section around exact GSC query language: `copy element chrome devtools`, `copy outerHTML`, `copy html of element`.
- Add a compact answer table: `Copy outerHTML`, `Copy innerHTML`, `Copy JS path`, and when to use each.
- Add a technical caveat section: `outerHTML` includes the selected element and descendants, but not computed CSS, scripts, or shadow roots.
- Add a stronger product bridge after the manual method: DevTools is good for one element; Element Armory is better when the user needs clean HTML plus styles repeatedly.
- Add internal links to:
  - `/topics/copy-ui-from-websites/copy-css-from-website/how-to-copy-css-from-any-website`
  - `/topics/copy-ui-from-websites/copy-ui-without-devtools/copy-html-without-inspect-element`
  - `/product`

For `how-to-copy-html-from-website`:

- Differentiate full-page source, DOM element capture, and reusable component capture.
- Tighten the title and meta description around the broad query, not AI first.
- Add a decision table: `View Source`, `DevTools Copy outerHTML`, `Console outerHTML`, `Element Armory`.
- Add a short "what to do next" section for AI tools, but keep it secondary.

For `copy-html-without-inspect-element`:

- Keep the current intent, but make the opening less broad and more concrete.
- Make "without Inspect Element" the obvious promise in the first paragraph and metadata.
- Add a comparison between source view, bookmarklet/console shortcuts, and extension capture.
- Add an FAQ question that targets `copy html without inspect element`.

For `copy-html-without-scripts`:

- Refresh only after the first three pages unless review finds obvious duplication.
- Emphasize safe portable output: no scripts, no event handlers, no runtime logic.

## Priority 2 - Product page CTR improvement

The `/product` page has 34 impressions, position 5.79, and 0 clicks. It is visible enough that the snippet/title may be mismatched.

### Proposed changes

- Review `PRODUCT_TITLE` and `PRODUCT_DESCRIPTION` in `website/app/product/page.tsx`.
- Make the product-page metadata match extraction demand more directly:
  - Directional title: `Copy Website UI as Clean HTML`
  - Directional description: one-click capture, clean HTML, reusable snippets, AI context.
- Add or adjust FAQ entries around:
  - Copy HTML from any website.
  - Difference from Chrome DevTools Copy outerHTML.
  - Whether scripts or JavaScript behavior are captured.
  - Whether the output works with any framework without claiming JSX export.
- Add one product-page section or callout that explicitly says HTML is the supported export format.
- Use copywriter doctrine for desire and believability, but ignore Demoly-specific product context.

## Priority 3 - Tool-alternative pages

GSC shows visible queries and pages around SnipCSS, CSS Scan, DivMagic, and CSS extractor intent.

| Page/query area | Signal | Action |
|---|---|---|
| `snipcss` / `snip css` | 46 impressions across near-page-one queries | Refresh existing SnipCSS pages only |
| `css extractor extension` | 6 impressions, position 9.00 | Strengthen CSS extractor page metadata and internal links |
| `/topics/tool-alternatives/css-scan-alternative/css-scan-alternative` | 53 impressions, position 6.89 | Improve snippet/title and comparison structure |
| `/topics/tool-alternatives/general-alternatives/best-css-extractor-chrome-extension` | 52 impressions, position 8.13 | Align around Chrome extension search intent |
| `/topics/tool-alternatives/general-alternatives/tools-like-divmagic` | 48 impressions, position 8.06 | Keep as a list/comparison page, not a product page |

### Proposed changes

- Refresh existing alternative pages manually. Do not generate new competitor pages automatically.
- Ensure each page has a distinct role:
  - `review`: evaluation intent.
  - `alternative`: replacement intent.
  - `vs`: direct comparison intent.
  - `best tools`: category/list intent.
- Add links from high-traffic Copy HTML pages into relevant CSS extraction/tool-alternative pages only where contextually useful.
- Remove or rewrite any claims that imply Element Armory currently exports Tailwind or JSX.

## Priority 4 - Legal and copying-UI pages

These pages have high visibility but 0 clicks:

| Page | Clicks | Impressions | CTR | Position |
|---|---:|---:|---:|---:|
| `/topics/ui-development-without-design-skills/copy-vs-design/copying-ui-legally` | 0 | 88 | 0.00% | 8.55 |
| `/topics/copy-ui-from-websites/copy-website-design/clone-website-ui-legally` | 0 | 77 | 0.00% | 8.60 |

### Proposed changes

- Refresh titles/descriptions to make the user promise clear: learn what is safe to copy, what to adapt, and where the line is.
- Add practical developer scenarios:
  - Learning from a component.
  - Capturing a reference for internal prototyping.
  - Rebuilding a pattern with different copy, layout, and brand tokens.
- Link back to Copy HTML pages as technical workflow references.
- Keep the legal language careful and non-authoritative. Do not make legal guarantees.

## Priority 5 - AI workflow bridge, after extraction pages are stronger

AI pages have some visibility, but the stronger query demand starts with extraction. The AI story should be a bridge, not the first frame.

### Candidate query angles to test

Use these as internal link anchors, FAQ ideas, or future refresh angles. Do not create all of them as new pages.

- `copy outerHTML for AI coding`
- `copy html css into cursor`
- `use website html as ai prompt`
- `copy website component into claude code`
- `give claude code a ui reference`
- `give cursor a ui reference`
- `html css prompt for ai ui generation`
- `capture ui context for ai coding`
- `screenshot vs html css for ai ui`
- `rebuild website component with ai`

### Proposed changes

- Add AI workflow sections to the high-performing extraction pages.
- Keep AI sections practical and short:
  1. Capture or copy the element.
  2. Clean the HTML/CSS context.
  3. Paste into the AI tool with a precise instruction.
  4. Ask the AI to adapt the structure to the current codebase.
- Avoid creating broad AI thought-leadership pages until GSC shows stronger demand.

## Priority 6 - Internal linking

The refresh should improve topical flow without creating noisy link blocks.

### Proposed link targets

From Copy HTML pages:

- Product page.
- Copy CSS guide.
- Copy HTML without Inspect Element.
- Copy HTML and CSS together.
- AI workflow guide only after the manual answer is complete.

From product page:

- High-performing Copy HTML guide.
- Copy HTML without Inspect Element guide.
- CSS extraction guide.

From tool-alternative pages:

- Product page.
- Best CSS extractor Chrome extension.
- Copy HTML/CSS together pages.

## Implementation phases

### Phase 1 - Metadata and snippet pass

Files likely touched:

- `website/content/topics/copy-ui-from-websites/copy-html-from-website/copy-html-of-element-chrome.md`
- `website/content/topics/copy-ui-from-websites/copy-html-from-website/how-to-copy-html-from-website.md`
- `website/content/topics/copy-ui-from-websites/copy-ui-without-devtools/copy-html-without-inspect-element.md`
- `website/app/product/page.tsx`

Acceptance criteria:

- Titles are descriptive, concise, and distinct.
- Descriptions are page-specific and map to the observed query intent.
- No keyword stuffing.
- No JSX or Tailwind export claims.

### Phase 2 - Body refresh and internal links

Files likely touched:

- Same Phase 1 topic files.
- Possibly adjacent copy CSS and copy HTML/CSS pages for link reciprocity.

Acceptance criteria:

- Each refreshed page has a direct answer in the first viewport.
- Each page has a clear manual method and a clear Element Armory bridge.
- Internal links are contextual and useful.
- External factual references are current and not over-quoted.

### Phase 3 - Alternative-page refresh

Files likely touched:

- `website/content/topics/tool-alternatives/snipcss-alternative/snipcss-review.md`
- `website/content/topics/tool-alternatives/css-scan-alternative/css-scan-alternative.md`
- `website/content/topics/tool-alternatives/general-alternatives/best-css-extractor-chrome-extension.md`
- `website/content/topics/tool-alternatives/general-alternatives/tools-like-divmagic.md`

Acceptance criteria:

- Each page has a distinct role.
- Competitor references stay inside alternative/comparison context.
- Claims are fair, sourceable, and aligned with shipped Element Armory capabilities.

### Phase 4 - Measurement loop

Files likely touched:

- `google-search-console/elementarmory.com-Performance-on-Search-2026-06-21/analyze-performance.mts`
- Possibly a future shared analyzer under `website/scripts/`.

Acceptance criteria:

- Keep the dated export and generated report for auditability.
- For the next export, use the same date range so movement comparisons work.
- Consider promoting the analyzer into `website/scripts/` only after the workflow is stable.

## Validation checklist

- Run content grep for unshipped feature claims:
  - `JSX export`
  - `Tailwind output`
  - direct claims that Element Armory exports React, JSX, or Tailwind today
- Run website lint/build after implementation.
- Spot-check rendered pages for headings, metadata, FAQ schema, and links.
- Re-run the GSC analyzer when the next Search Console export is available.

## Open review questions

1. Should the product page metadata move closer to "copy website UI as clean HTML", or stay broader around "capture website UI"?
2. Are competitor/tool-alternative refreshes approved under the existing SEO exception, or should this plan only cover non-competitor pages first?
3. Should the analyzer remain inside dated export folders, or should it become a general `website/scripts` workflow now?
4. Should I refresh the top three Copy HTML pages first as one small implementation batch?
