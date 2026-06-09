---
title: Topics SEO and UX improvement plan
status: Proposed
created: 2026-06-09
owner: matt
area: website, auto-blogger, seo
tags: [seo, topics, ux, auto-blogger, content]
---

# Topics SEO and UX improvement plan

## Confirmed decisions

- Competitor alternative pages are strategically important and should stay. This requires an explicit website/content exception to the shared "never reference competitor tools" guidance, limited to comparison and alternative SEO pages.
- Topic publishing should be reduced from 4 topic pages/day to 2 topic pages/day.
- The 2/day cadence should be one new topic page plus one refresh/update slot by default.
- The first implementation should use manual Google Search Console CSV exports, not the Search Console API.
- The auto-blogger should not generate new competitor-referenced topic pages. Competitor pages should be maintained manually or through a separate explicit workflow.

## Executive summary

The Topics system is working early. In the exported Google Search Console performance data for the last 28 days, the site has 1,332 impressions, 7 clicks, 0.53% CTR, and average position 12.8. Topic URLs account for 77 of the 101 page rows in the export.

The opportunity is concentrated, not evenly distributed:

- `copy-ui-from-websites` has 816 topic impressions, 61% of all exported impressions.
- `copy-html-from-website` has 614 impressions, led by `/copy-html-of-element-chrome` with 470 impressions at position 9.48.
- Several pages are already around positions 7-9 with 0 clicks. These are likely the fastest wins.
- The `/topics` index is structurally valid but too flat: it is a narrow header plus cards, with no demand-driven guide path, no featured guides, no query language, no latest articles, and no product bridge.
- The generator is capable, but expensive. It repeats large system/context prompts across outline, section, remediation, editorial, and metadata calls. It also chooses topics randomly instead of prioritizing Search Console demand.

Recommended direction: reduce new topic velocity, add a GSC-informed refresh loop, and make generation more deterministic. The first implementation should improve `/topics`, refresh the top opportunity URLs, and add deterministic quality checks before doing deeper generator surgery.

## Data reviewed

Source files:

- `google-search-console/performance/Pages.csv`
- `google-search-console/performance/Queries.csv`
- `google-search-console/performance/Chart.csv`
- `google-search-console/performance/Devices.csv`
- `google-search-console/discovered-not-indexed/Table.csv`
- `google-search-console/discovered-not-indexed/Chart.csv`

Implementation reviewed:

- `website/app/topics/page.tsx`
- `website/app/topics/[hub]/page.tsx`
- `website/app/topics/[hub]/[cluster]/page.tsx`
- `website/app/topics/[hub]/[cluster]/[slug]/page.tsx`
- `website/styles/topics.css`
- `website/components/Topic/*`
- `website/lib/parseTopics.ts`
- `website/lib/seo/*`
- `website/app/sitemap.ts`
- `auto-blogger/src/topics.ts`
- `auto-blogger/src/index.ts`
- `auto-blogger/src/research.ts`
- `auto-blogger/src/generateArticle.ts`
- `auto-blogger/src/generateSection.ts`
- `auto-blogger/src/quality.ts`
- `auto-blogger/src/backfillInternalLinks.ts`

## GSC findings

### Overall performance

| Metric | Value |
|---|---:|
| Clicks | 7 |
| Impressions | 1,332 |
| CTR | 0.53% |
| Average position | 12.8 |
| Exported page rows | 101 |
| Exported topic page rows | 77 |
| Desktop impressions | 1,261 |
| Mobile impressions | 71 |

The last 7 days show 473 impressions, compared to 273 impressions in the first 7 days of the export. Impressions are rising, but CTR is not: last 7 days CTR is 0.21%.

### Hub-level opportunity

| Hub | Clicks | Impressions | CTR | Avg position | Exported page rows |
|---|---:|---:|---:|---:|---:|
| `copy-ui-from-websites` | 3 | 816 | 0.37% | 11.20 | 18 |
| `tool-alternatives` | 1 | 187 | 0.53% | 10.05 | 14 |
| `ai-coding-workflows` | 0 | 102 | 0% | 13.88 | 11 |
| `ui-development-without-design-skills` | 0 | 98 | 0% | 11.41 | 8 |
| `inspecting-debugging-css` | 0 | 38 | 0% | 23.32 | 8 |
| `component-reuse-libraries` | 0 | 26 | 0% | 49.43 | 3 |
| `landing-page-saas-ui` | 0 | 26 | 0% | 13.50 | 4 |

### Priority URLs to refresh first

These pages combine impressions, ranking proximity, and weak CTR.

| Priority | URL path | Impressions | CTR | Position | Notes |
|---:|---|---:|---:|---:|---|
| 1 | `/topics/copy-ui-from-websites/copy-html-from-website/copy-html-of-element-chrome` | 470 | 0.21% | 9.48 | Largest opportunity. Has 0 internal links despite 7 external links. |
| 2 | `/topics/copy-ui-from-websites/copy-html-from-website/how-to-copy-html-from-website` | 113 | 0% | 14.65 | Needs stronger title/snippet and external citations. |
| 3 | `/topics/copy-ui-from-websites/copy-ui-without-devtools/copy-html-without-inspect-element` | 109 | 0.92% | 11.17 | Already gets clicks. Improve snippet and internal bridge. |
| 4 | `/topics/ui-development-without-design-skills/copy-vs-design/copying-ui-legally` | 61 | 0% | 8.10 | Near page-one visibility. Needs better SERP promise and legal-safe framing. |
| 5 | `/topics/copy-ui-from-websites/copy-website-design/clone-website-ui-legally` | 52 | 0% | 8.42 | Same legal cluster. Could link tightly to the prior page. |
| 6 | `/topics/tool-alternatives/general-alternatives/tools-like-divmagic` | 37 | 2.70% | 8.54 | Existing CTR is relatively good. Use as model for comparison pages. |
| 7 | `/topics/tool-alternatives/css-scan-alternative/css-scan-alternative` | 33 | 0% | 7.06 | Very near top, no clicks. Title/snippet likely underperforming. |
| 8 | `/topics/ai-coding-workflows/claude-code-workflows/use-ui-with-claude-code` | 31 | 0% | 9.16 | Body is short at 686 words and has only 2 internal links. |
| 9 | `/topics/tool-alternatives/snipcss-alternative/snipcss-review` | 29 | 0% | 7.31 | Near top, should get CTR if title/snippet match search intent. |
| 10 | `/topics/tool-alternatives/divmagic-alternative/divmagic-alternative` | 23 | 0% | 8.43 | Near top. Could benefit from stronger comparison structure. |
| 11 | `/topics/tool-alternatives/general-alternatives/best-css-extractor-chrome-extension` | 17 | 0% | 8.47 | Has 0 internal links. Good product-fit query. |
| 12 | `/topics/copy-ui-from-websites/copy-html-from-website/copy-html-without-scripts` | 12 | 0% | 8.00 | Near top. Needs internal links and tighter snippet. |

### Query-level signals

The visible query export is small but useful. The strongest early theme is practical DevTools HTML extraction:

- `"copy element" "chrome devtools"`: 26 impressions, position 6.92
- `chrome devtools "copy element" context menu`: 11 impressions, position 8.82
- `chrome devtools copy outerhtml official`: 9 impressions, position 11.44
- `chrome devtools copy outerhtml doctype`: 5 impressions, position 9.20
- `chrome devtools "copy outerhtml"`: 4 impressions, position 11.75

Secondary themes:

- `snipcss` and `snip css` are already page-one-ish.
- `css extractor extension` and `best css extension for chrome` are small but highly relevant.
- `snippet library` has impressions but weak ranking, and the cluster index currently has no body content.

### AI UI intent gap

The current GSC export does not show much direct AI UI intent yet. It shows concrete extraction intent first: Chrome DevTools, copy element, copy outerHTML, SnipCSS, CSS extractor, and snippet library. That means the AI content strategy should not only create broad "AI UI" pages. It should bridge from the traffic Google is already testing:

- Copy HTML/CSS from a real website.
- Use that extracted code as context for Cursor, Claude Code, or another AI coding tool.
- Explain why HTML/CSS context beats screenshots or vague prompts for UI generation.

Current AI keywords in `auto-blogger/list.md` are often too abstract, for example `ai ui generation with context`, `feed ui into llms`, and `ai frontend workflows`. They may be conceptually right but weaker as search queries. The list should shift toward literal workflow queries a developer might type.

Recommended AI-focused keyword additions:

- `copy html css into cursor`
- `use website ui in cursor`
- `give cursor a ui reference`
- `cursor ai ui prompt examples`
- `copy website component for cursor`
- `use html css with claude code`
- `give claude code a ui reference`
- `copy website component into claude code`
- `claude code ui prompt examples`
- `html css prompt for ai ui generation`
- `use website html as ai prompt`
- `turn website ui into ai prompt`
- `copy ui for ai coding tools`
- `capture ui context for ai coding`
- `screenshot vs html css for ai ui`
- `copy outerhtml for ai coding`
- `chrome devtools copy element for ai`
- `extract html css for cursor prompts`
- `extract html css for claude prompts`
- `rebuild website component with ai`

Recommended topic/article title ideas:

- `Copy HTML and CSS Into Cursor: A Better UI Prompt Workflow`
- `How to Give Claude Code a Real UI Reference`
- `Use Website HTML and CSS as an AI UI Prompt`
- `Screenshot vs HTML/CSS for AI UI Generation`
- `Capture UI Context for AI Coding Tools`
- `Copy a Website Component and Rebuild It With AI`
- `Why AI UI Looks Generic Without Real Component Context`
- `Best UI Prompt Format for Cursor and Claude Code`
- `Turn a Live Website Component Into an AI Coding Prompt`
- `Use Chrome DevTools Copy Element Output With AI`

Recommended list changes:

- Add the AI-bridge keywords above under `AI Coding Workflows`.
- Also add a few AI modifiers under `Copy HTML & CSS Together`, because that hub already has stronger GSC traction.
- Keep existing AI pages, but refresh their titles and metadata toward concrete tool workflows.
- Avoid claiming JSX export or Tailwind output as Element Armory features. Articles may discuss using AI tools to transform captured HTML/CSS, but must not imply Element Armory exports JSX or Tailwind today.

Recommended page format for bridge queries:

Use an informational tutorial format. These searches are practical, so the page should teach the concept and move the reader into action.

Default structure:

1. Direct answer: confirm the workflow and name the fastest path.
2. Manual method: explain the DevTools / Copy Element / Copy outerHTML steps.
3. Manual limitations: missing CSS, messy structure, scripts, responsive states, cleanup.
4. Faster workflow: show how Element Armory captures clean HTML + CSS.
5. AI workflow tutorial: show how to paste captured code into Cursor, Claude Code, or another AI coding tool.
6. Copyable prompt: provide a concrete prompt pattern for rebuilding or adapting the captured component.
7. Troubleshooting: explain what to do if styles are missing, layout breaks, or AI output is generic.

This pattern should become an intent template in the auto-blogger for bridge queries. Avoid abstract thought-piece structures for these pages.

## Competitor and alternative page strategy

Competitor pages should stay because they are already earning impressions and have clear product fit. The issue is not that these pages exist. The issue is that the page roles are currently blurred.

Existing DivMagic-related surfaces:

- `/compare/element-armory-vs-divmagic` - direct product comparison route.
- `/topics/tool-alternatives/divmagic-alternative/divmagic-alternative` - primary alternative article.
- `/topics/tool-alternatives/divmagic-alternative/divmagic-vs-element-armory` - direct vs article.
- `/topics/tool-alternatives/divmagic-alternative/divmagic-pros-and-cons` - evaluation article.
- `/topics/tool-alternatives/general-alternatives/tools-like-divmagic` - multi-tool alternatives/list article.

Recommended page roles:

| Search intent | Preferred page | Target keywords | Notes |
|---|---|---|---|
| Direct branded comparison | `/compare/element-armory-vs-divmagic` | `divmagic vs element armory`, `element armory vs divmagic` | Keep as bottom-of-funnel comparison page, but adjust metadata to lead with the searched competitor where useful. |
| Primary alternative | `/topics/tool-alternatives/divmagic-alternative/divmagic-alternative` | `divmagic alternative`, `free divmagic alternative`, `best divmagic alternative`, `divmagic replacement` | This should be the main "Element Armory is the answer" page. |
| Multi-tool alternatives | `/topics/tool-alternatives/general-alternatives/tools-like-divmagic` or a new `divmagic-alternatives` page | `divmagic alternatives`, `tools like divmagic`, `best divmagic alternatives` | List multiple options honestly, but position Element Armory as best for developers and AI workflows. |
| Pros/cons evaluation | `/topics/tool-alternatives/divmagic-alternative/divmagic-pros-and-cons` | `divmagic pros and cons`, `divmagic review`, `is divmagic worth it` | Keep informational and fair. Promote Element Armory after the evaluation. |

Important: adding more competitor pages will not automatically create better pages or more impressions. It can work only if each page targets a distinct intent and avoids thin keyword swaps. Google explicitly warns against scaled content created primarily to manipulate rankings, and against duplicate doorway-style pages. The safe approach is a small set of high-quality, differentiated competitor pages, each with a clear job.

Recommended near-term competitor actions:

- Keep `/compare/element-armory-vs-divmagic`, but change the SERP title from `Element Armory vs DivMagic` toward `DivMagic Alternative: Element Armory vs DivMagic` or `DivMagic vs Element Armory: Best Alternative for Developers`.
- Make `divmagic-alternative.md` the canonical internal target for `divmagic alternative`, `free divmagic alternative`, and `best divmagic alternative`.
- Make `tools-like-divmagic.md` the listicle for `DivMagic alternatives` and `tools like DivMagic`, with multiple tools and a clear "best for developers" recommendation for Element Armory.
- Consider noindexing, canonicalizing, or materially differentiating `divmagic-vs-element-armory.md` if it overlaps too much with the `/compare` route.
- Add competitor-specific internal links from `/topics`, the tool-alternatives hub, and adjacent SnipCSS/CSS Scan pages.
- Update the auto-blogger keyword list to include `X alternative`, `X alternatives`, `free X alternative`, `X vs Element Armory`, `X review`, and `X pros and cons`, but gate generation so only one page per unique search intent is created for each competitor.

Updated decision: do not let the auto-blogger create these competitor pages automatically. Keep the existing competitor pages live, and create/refresh competitor pages manually from GSC and product strategy.

Implementation options:

- Remove the `Tool Alternatives` category from `auto-blogger/list.md`, while leaving the already-published website pages untouched.
- Better: split competitor keywords into a separate file, for example `auto-blogger/competitor-list.md`, that is not used by scheduled generation.
- Add a hard selection guard in the auto-blogger, such as excluded hub slugs or keyword deny patterns. This prevents accidental generation even if a competitor keyword is added to `list.md` later.
- Continue allowing competitor pages as internal link candidates. Blocking generation should not prevent existing competitor pages from receiving internal links.

## Content quality findings

Current topic corpus:

| Metric | Value |
|---|---:|
| Topic markdown files | 153 |
| Article files | 122 |
| Hub/cluster index files | 31 |
| Average article words | 2,118 |
| Articles under 800 words | 3 |
| Articles under 1,000 words | 4 |
| Articles missing `listKeywordId` | 7 |
| Articles with zero internal links | 38 |
| Articles with zero external links | 16 |
| Articles containing body-level `#` headings | 24 |

Key issues:

- Some high-impression pages have zero internal links. That blocks link equity flow and weakens topical clustering.
- 24 article bodies include `#` headings. Article pages already render the page title as the main H1, so body-level H1s create duplicate heading hierarchy and should be linted away.
- Some cluster index pages have no body content. Example: `/topics/component-reuse-libraries/snippet-libraries` has 16 impressions but the `_index.md` body is empty.
- `website/app/sitemap.ts` uses `new Date()` as `lastModified` for every URL on every build. That makes every page look freshly modified even when content did not change.
- `breadcrumbListSchema()` exists in `website/lib/seo/schema.ts`, but topic pages do not emit BreadcrumbList JSON-LD.
- Metadata currently uses `title` and `excerpt` directly. There is no separate `seoTitle` or `seoDescription`, so page H1 and SERP title are coupled.

## `/topics` UX audit

Current implementation:

- `website/app/topics/page.tsx` renders a header and a grid of `TopicHubCard`s.
- `website/styles/topics.css` constrains the page to `max-width: 680px`, which is good for articles but cramped for a directory/index page.
- Hub cards show counts, title, excerpt, and `Explore topic`.

Main problem:

The page reads like a passive archive, not a developer guide system. A user landing on `/topics` cannot quickly answer:

- What should I read first?
- Which guides are popular or currently useful?
- Which path matches my workflow?
- What can Element Armory do for the problem I came to solve?
- Which topics are newest or most complete?

Recommended page experience:

1. Hero/direct answer area
   - H1: `UI capture guides for developers`
   - Support line focused on extraction, DevTools alternatives, AI workflows, and reusable UI.
   - Small stats row: hubs, clusters, guides.
   - Primary CTA using `ChromeStoreCtaLabel`; secondary link to the highest-demand guide.

2. Featured guides
   - Static, generated from a committed GSC opportunity file.
   - Start with 6-8 pages from the priority list.
   - Show topic label, title, short reason, and reading time.

3. Browse by workflow
   - Wider hub explorer, grouped by practical jobs:
     - Copy HTML/CSS from websites
     - Compare extraction tools
     - Use captured UI with AI coding tools
     - Build UI without design support
     - Reuse snippets and components
   - Each hub card should expose top clusters, not just counts.

4. Popular search paths
   - Query-language chips like `copy HTML in Chrome`, `copy CSS without DevTools`, `CSS extractor extension`, `SnipCSS review`, `use UI with Claude Code`.
   - These should link to existing pages, not search results.

5. Latest guides
   - 6-10 most recent articles across all hubs.
   - This helps crawlers and repeat visitors find new daily content.

6. Product bridge
   - Quiet CTA band: `Capture UI from any site and rebuild it with AI.`
   - Keep it technical and low-clutter, not a marketing hero.

Design requirements:

- Keep existing website dark visual system.
- Use page-level layout tokens and component-local tokens mapped from semantic tokens.
- Do not hardcode colors or spacing inside component declarations.
- Avoid nested cards.
- Keep the index wider than article pages, likely `max-width: 1040px` or `1120px`.
- Preserve mobile scanability with single-column sections and stable card dimensions.

## Auto-blogger audit

Current strengths:

- Topic articles already use frontmatter, article schema, FAQ schema, related links, generated diagrams, `linkKeywords`, and a quality gate.
- The generator already includes upfront answer guidance, metadata constraints, and optional SEO scoring.
- Internal-links manifest and S3 manifest repository exist.

Current weaknesses:

- Topic selection is random. `pickAndClaimKeywords()` shuffles the available pool, so the generator does not prioritize hubs/pages/queries already getting impressions.
- Research is live and uncached. `researchTopic()` searches DuckDuckGo and fetches readable content for each keyword.
- The generation path is LLM-heavy:
  - outline call
  - section call per heading
  - remediation full-body rewrite if link floors are missed
  - editorial full-body rewrite
  - metadata call over the full body
  - optional SEO scoring
  - import-time internal-link backfill can call the LLM again over existing article bodies
- Large context is repeated. The system prompt includes copywriter doctrine, topical guide, and rules, and every call pays for that context again.
- Internal links are often requested from the LLM instead of inserted deterministically.
- The quality gate does not currently reject body-level H1 headings.

Recommended generator target:

- Net-new topic page: under 20k input tokens.
- Refresh/update page: under 10k input tokens.
- High-confidence templated page: 0-1 LLM calls after deterministic research and outline generation.

## Recommended plan

### Phase 1: GSC opportunity report and quick technical fixes

Goal: turn the CSV exports into repeatable priorities and fix structural SEO leaks.

Tasks:

- Add `website/scripts/analyzeTopicOpportunities.mts`.
- Read GSC CSV files from `google-search-console/performance`.
- Map GSC URLs to topic files and frontmatter/body metrics.
- Output `website/data/topic-opportunities.json` and a human-readable Markdown report.
- Add a quality rule that body markdown must not contain `# ` headings.
- Add a safe fixer or lint report for existing body-level H1s.
- Add optional `seoTitle` and `seoDescription` frontmatter fields to topic parsing.
- Update topic metadata generation to prefer `seoTitle`/`seoDescription`.
- Add BreadcrumbList JSON-LD to hub, cluster, and article pages.
- Update sitemap `lastModified` to use article/frontmatter dates where available, with optional `updatedAt` later.

First refresh batch:

- Refresh the 12 priority URLs listed above.
- Add missing internal links to zero-link winners.
- Add missing external citations only where the article needs support.
- Tighten title/meta descriptions around actual query language.
- Add or improve comparison tables for competitor/tool pages where kept.

### Phase 2: Redesign `/topics`

Goal: make `/topics` a useful topic map and link-equity router, not a passive archive.

Tasks:

- Widen `/topics` layout separately from article pages.
- Add `TopicIndexHero`.
- Add `TopicFeaturedGuides`, powered by committed opportunity data.
- Add `TopicHubExplorer`, showing hub, clusters, article counts, and top child links.
- Add `TopicSearchPaths` for query-language chips.
- Add `TopicLatestGuides`.
- Add a restrained `TopicIndexCta`.
- Add collection + item list schema for featured guides.
- Verify desktop and mobile layouts in browser before shipping.

Design acceptance criteria:

- Above the fold shows topic value, not just archive framing.
- A visitor can reach the top 6 opportunity pages in one click.
- Every hub card exposes at least 2 meaningful child links when available.
- Text does not overflow at mobile widths.
- Component styles use component tokens mapped from shared/semantic tokens.

### Phase 3: GSC-informed refresh loop

Goal: use existing traffic to improve rankings and CTR every week.

Tasks:

- Define an opportunity score:
  - impressions weighted heavily
  - boost positions 4-15
  - boost CTR below expected range
  - boost product-fit query/page classes
  - demote pages with no indexability or low strategic fit
- Add daily refresh mode:
  - pick top N pages from opportunity data
  - update SERP metadata
  - add missing internal links
  - add direct answer improvements
  - add tables/lists where intent expects them
- Daily refresh does not require the Search Console API. The first version can read the latest committed/manual CSV export and pick the highest opportunity refresh item from that static data. It only becomes stale until a new export is dropped in.
- Add a refresh frontmatter field, likely `updatedAt`.
- Surface refreshed pages in `/topics` and sitemap with accurate `lastModified`.
- Use one daily topic slot for new article generation and one daily topic slot for refresh/update work.

Recommended cadence:

- New site phase: 2 topic generation slots/day maximum. Prefer one net-new page and one refresh/update slot while early GSC data is available.
- After 90 days: adjust based on indexed pages, impressions per page, and CTR movement.

### Phase 4: Make generation deterministic and cheaper

Goal: reduce token use and make output more consistent.

Tasks:

- Replace random topic picking with priority picking:
  - GSC opportunity clusters first
  - high product-fit keywords second
  - uncovered `list.md` keywords third
- Add explicit topic exclusions:
  - exclude `tool-alternatives` from scheduled auto-blogger generation
  - exclude competitor names and competitor-intent patterns from scheduled topic picking
  - keep these pages eligible for manual refresh workflows
- Add deterministic keyword classification:
  - `how-to`
  - `comparison`
  - `alternative`
  - `legal/safety`
  - `prompt/workflow`
  - `extraction-to-ai tutorial`
  - `best/tools`
  - `what-is`
- Create template outlines per intent.
- Add an `extraction-to-ai tutorial` outline:
  - direct answer
  - manual extraction steps
  - limits of manual extraction
  - Element Armory workflow
  - AI prompt/tutorial step
  - copyable prompt
  - troubleshooting
- Remove the outline LLM call for common intent classes.
- Replace the full copywriter doctrine and guide with a compact generation brief for routine topics.
- Cache research results by keyword and source URL.
- Limit research passed into generation to the top 4-6 sources, summarized deterministically.
- Generate the full article body in one call from a deterministic outline, or at most two calls for long comparison pages.
- Generate metadata deterministically from keyword/title patterns where possible.
- Move internal link insertion out of the writing prompt:
  - use `linkKeywords`
  - scan eligible article text
  - insert links deterministically
  - use the LLM only when no lexical match exists
- Make the editorial pass opt-in and run only on pages selected for refresh or pages failing deterministic lint.
- Keep AI SEO scoring optional and restrict it to high-opportunity pages.
- Log token usage per stage and warn when a topic exceeds a budget.

Expected token reductions:

- Remove outline call: small to moderate reduction.
- Remove per-section generation: large reduction.
- Remove repeated full system prompt: large reduction.
- Remove remediation rewrite: large reduction.
- Deterministic internal links: moderate to large reduction.
- Deterministic metadata: moderate reduction.

### Phase 5: Indexing and crawl-quality management

Goal: make daily publishing easier for Google to trust and crawl.

Tasks:

- Track indexed vs discovered-not-indexed count weekly.
- Add body content to empty cluster index pages.
- Link from `/topics` to priority pages and strong clusters.
- Add hub/cluster intro content generated from existing child pages, not from a new LLM call.
- Avoid publishing thin cluster pages with empty bodies unless they have strong child pages and internal links.
- Submit sitemap after import/deploy if the existing GSC integration is completed.
- Do not request indexing for every low-priority generated URL if quota is constrained. Prioritize refreshed winners and high-product-fit new pages.

## Remaining decision questions

1. Should the existing `/compare/element-armory-vs-divmagic` URL stay as-is with better metadata, or should we add a new `/compare/divmagic-alternative` route and canonicalize the old route?

2. Should multi-tool pages be framed as `DivMagic Alternatives` or `Tools Like DivMagic`? The first has stronger commercial SEO intent; the second is softer and may feel less promotional.

3. How assertive should the product CTA be inside informational topic pages: quiet inline CTA, mid-article product block, or strong repeated CTA?

4. For legal-intent pages like `copying-ui-legally`, do you want a formal disclaimer and more conservative wording, or should these remain practical developer guidance with light caution language?

5. Should the generator continue using the full copywriter doctrine for every topic, or can routine SEO pages use a compact 300-500 token brand/generation brief?

## Future todo

- Add Search Console API integration once setup time is available. The manual CSV workflow is enough for daily refresh selection, but API access would remove manual exports, allow fresher query/page pairing, and support automated trend detection.

## Suggested first implementation slice

Implement these together first:

1. Add the GSC opportunity report script.
2. Add optional `seoTitle` and `seoDescription` support.
3. Add body-H1 linting.
4. Refresh the top 5 URLs.
5. Redesign `/topics` with featured guides, hub explorer, query chips, latest guides, and CTA.
6. Reduce scheduled topic generation from four daily topic runs to two, and reserve one slot for refresh/update work.
7. Remove or exclude `Tool Alternatives` from scheduled auto-blogger generation while preserving existing competitor pages.

This gives a visible UX improvement, uses the existing traffic data, and creates the reporting layer needed for the generator changes.
