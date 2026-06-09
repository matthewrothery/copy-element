---
title: Google Search Essentials — Distilled Reference for Element Armory
sources:
  - https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
  - https://developers.google.com/search/docs/essentials
  - https://developers.google.com/search/docs/essentials/technical
  - https://developers.google.com/search/docs/essentials/spam-policies
  - https://developers.google.com/search/docs/fundamentals/creating-helpful-content
last_reviewed: 2026-05-31
---

# Google Search Essentials — Element Armory Reference

Single source of truth for `seo-audit` skill, `seo-architect` agent, and `seo-review` skill.
Do not duplicate this content elsewhere; link or read from here instead.

---

## 1. Technical Requirements

A page must meet all three to be indexed:

| # | Requirement | Fail condition |
|---|---|---|
| T-1 | Googlebot not blocked | robots.txt disallow, password-required page, or network block on Googlebot |
| T-2 | Page returns HTTP 200 | 4xx / 5xx status codes are not indexed |
| T-3 | Page has indexable content | Content in a supported file type; content does not violate spam policies |

> **T-4 (nuance):** Use `noindex` (not `robots.txt`) when you want to prevent a page appearing in results but still allow Googlebot to crawl it (e.g. for link-equity reasons). `robots.txt` prevents crawl but the URL may still surface as a dead link in results.

**JavaScript (T-5):** Google can process JS-rendered content, but it is a two-pass process. SEO-critical text (H1, body copy, meta) must be present in the initial HTML (SSR/SSG), not client-only render. — Source: AI Optimization Guide, Technical section.

---

## 2. Spam Policies (full list)

Any violation can cause ranking demotion or removal from Google Search.

| Code | Policy | Key test |
|---|---|---|
| SP-01 | **Cloaking** | Are users and Googlebot served the same content? |
| SP-02 | **Doorway abuse** | Are pages a browseable hierarchy, or just keyword funnels to a single destination? |
| SP-03 | **Expired domain abuse** | Is repurchased domain used for original-purpose content? |
| SP-04 | **Hacked content** | Are there injected scripts, hidden pages, or redirects added without the owner's consent? |
| SP-05 | **Hidden text/links** | Is any text or link invisible to humans but visible to Googlebot (white-on-white, off-screen CSS, 0px font)? |
| SP-06 | **Keyword stuffing** | Do keyword lists, unnatural repetition, or city/phone blocks appear solely to manipulate rankings? |
| SP-07 | **Link spam** | Are links bought/sold for ranking purposes without `rel="nofollow"` or `rel="sponsored"`? |
| SP-08 | **Machine-generated traffic** | Is automated rank-checking or scraping of Google Search results occurring? |
| SP-09 | **Malicious practices** | Malware, unwanted software, or back-button hijacking? |
| SP-10 | **Misleading functionality** | Does the page claim a service it does not actually provide? |
| SP-11 | **Scaled content abuse** | Are many pages generated primarily for ranking manipulation rather than genuine user value? (see §3) |
| SP-12 | **Scraping** | Is content republished verbatim from other sites without added value? |
| SP-13 | **Site reputation abuse** | Is third-party content published primarily to leverage the host site's existing ranking signals? |
| SP-14 | **Sneaky redirects** | Do redirects show Google one page and users another? |
| SP-15 | **Thin affiliation** | Are affiliate pages cookie-cutter copies with no original content? |
| SP-16 | **User-generated spam** | Is spammy content added via open forums, comments, or file uploads? |

---

## 3. Scaled Content Abuse — Extended (SP-11)

This is the highest-risk policy for Element Armory's auto-blogger and topics system.

**Violating examples (from Google):**
- Using generative AI to generate many pages without adding user value.
- Scraping feeds / search results / other pages to generate many pages (including synonym substitution, translation, or obfuscation).
- Stitching content from different pages without adding value.
- Creating multiple sites to hide scaled nature.
- Pages with content that makes little sense to a reader but contains search keywords.

**What makes programmatic content safe (Google's stated position):**
- Each page provides unique value not available from the combination of sources it draws on.
- Content reflects genuine first-hand expertise, experience, or original research.
- Volume alone does not make a site lower quality; *absence of value per page* does.

**Element Armory specific (RISK-001):** Auto-blogger articles (`website/content/blog/<slug>.md`) and topic hub/cluster pages (`website/content/topics/<hub>/*.md`) are programmatic by nature. Each page must carry: (a) original Element Armory screenshots or concrete capture/inspect walkthroughs, (b) first-hand step descriptions a real developer could follow, (c) substantial unique value over the sources it draws on, and (d) human review before publish — not AI-drafted boilerplate. See `auto-blogger/rules.md` for the generation rules and the `seo-review` skill for per-page scoring.

---

## 4. Helpful Content & E-E-A-T

**E-E-A-T = Experience, Expertise, Authoritativeness, Trustworthiness.** Trust is the most important dimension.

### 4a. Self-assessment questions — Content & Quality

A page should answer YES to these:
- Does it provide original information, reporting, research, or analysis?
- Does it provide substantial and comprehensive topic coverage?
- Does it offer insightful analysis beyond the obvious?
- If it draws on sources, does it provide substantial added value rather than just copying?
- Is the heading/title a descriptive, helpful summary — not exaggerated or clickbait?
- Would you bookmark, share, or recommend this page?
- Would you expect to see this in a printed reference?

### 4b. Self-assessment questions — Expertise

- Is sourcing clear and evidence of expertise visible?
- Would the site be recognized as an authority on its topic?
- Is content written or reviewed by someone with demonstrated knowledge?
- Are there any easily-verified factual errors?

### 4c. People-first vs search-engine-first

**People-first (safe):** Content created for a real audience that would find it useful if they arrived directly.

**Search-engine-first (dangerous) — warning signs:**
- Content made primarily to attract search visits.
- Lots of content on many topics hoping some ranks.
- Extensive automation to produce content on many topics.
- Summarizing what others say without adding value.
- Writing about topics only because they're trending, not because you know them.
- Content that leaves readers needing to search again to get a better answer.
- Writing to a specific word count you've heard Google prefers (there is no preferred word count).
- Entering a niche without real expertise, hoping for search traffic.
- Changing dates on pages to appear fresh when content hasn't substantially changed.

### 4d. Who / How / Why

| Question | What to address |
|---|---|
| **Who** created it | Clear bylines where expected; links to author background |
| **How** it was created | Disclose AI/automation use when a reader would reasonably wonder (e.g. AI-drafted guides should note this) |
| **Why** it was created | Primary purpose is helping people; if primary purpose is ranking, that is not aligned with what Google rewards |

---

## 5. AI Optimization (Generative AI / AI Overviews / AI Mode)

### 5a. What still applies (foundational SEO)

Google's generative AI features (AI Overviews, AI Mode) use **RAG** (retrieval-augmented generation) and **query fan-out** — both grounded in the core Search ranking system and index. Everything in §1–4 applies equally to AI visibility.

### 5b. What is prioritized for AI features

- **Non-commodity content:** First-hand reviews, original takes, depth beyond common knowledge. AI is better at retrieving unique viewpoints than restating common knowledge.
- **Human-readable structure:** Paragraphs, sections, and headings that serve the reader — not chunked for AI.
- **High-quality images and video:** AI features can surface images/video beyond web page links; existing image SEO best practices apply.

### 5c. What does NOT help (myth-busting — Google's explicit statements)

| Claimed technique | Google's position |
|---|---|
| `llms.txt` or AI-specific markup | Not needed; Google does not treat these files specially |
| "Chunking" content into small pieces | Not required; Google understands multi-topic pages |
| Rewriting content with different vocabulary for AI | Not needed; AI understands synonyms and general meaning |
| Seeking inauthentic "mentions" across the web | Not effective; ranking systems focus on quality and spam systems block manufactured mentions |
| Overfocusing on structured data | Not required for AI features; continue using it for rich results, but don't add it just for AI |

---

## 6. Element Armory Risk Map

Maps Google policies to specific Element Armory surfaces. Use this when auditing.

| Surface | Primary risk(s) | Reference | Element Armory invariants |
|---|---|---|---|
| `/blog/[slug]` (`website/content/blog/*.md`) | SP-11 (scaled content), SP-06 (keyword stuffing), HC (people-first) | §3, §4 | Auto-blogger rules in `auto-blogger/rules.md`; unique value + human review per article; no unshipped-feature claims |
| `/topics/[hub]` hub | SP-02 (doorway abuse) | §2 | Real browseable hub→cluster→article hierarchy, not a keyword funnel; strong FAQ (4+ Q&As) in frontmatter |
| `/topics/[hub]/[cluster]`, `/topics/[hub]/[cluster]/[slug]` | SP-11 (scaled), HC (E-E-A-T) | §3, §4 | Each cluster/article adds first-hand value; not stitched boilerplate |
| `/examples/[slug]` (`website/data/examples`) | SP-11 (scaled), SP-15-style thin content | §2, §3 | Original description and genuine UI value per example |
| `/compare/element-armory-vs-*` | SP-12 (scraping), SP-10 (misleading functionality) | §2 | Comparisons must be accurate and fair; no fabricated competitor claims; only describe shipped Element Armory capabilities |
| `/tools/*` (e.g. `html-to-react`) | SP-10 (misleading functionality) | §2 | Tool must actually perform what the page claims |
| All public pages | T-2 (200 status), T-5 (SSR/SSG for indexed copy) | §1 | Next.js static export — H1/body/meta in initial HTML; route in `website/app/sitemap.ts` |
| Internal linking | SP-07 (link spam for paid/affiliate links) | §2 | Use `rel="nofollow"` or `rel="sponsored"` on any paid links; use auto-blogger internal-link utilities for blog/topic content |
| AI-drafted copy | §4d (Who/How/Why disclosure) | §4 | Human review required before publish (`auto-blogger/rules.md`) |
| Any page describing exports | SP-10 (misleading functionality), HC (trust) | §2, §4 | **HTML is the only shipped export.** Never claim JSX export or Tailwind output (root `CLAUDE.md` → Unshipped Features) |
| Any new page type | T-1/T-3/SP-01 (cloaking, indexability) | §1, §2 | No JS-only content for indexed copy |

### Anti-myth flags for planning

If a plan proposes any of the following, flag it as unnecessary work per Google's explicit guidance:

- Adding `llms.txt` or similar AI crawl files → **NOT needed**
- "Chunking" guide content into smaller pieces for AI → **NOT needed**
- Rewriting guides in a special vocabulary or format for AI systems → **NOT needed**
- Paid mention outreach campaigns → **NOT effective** per ranking systems
- Structured data specifically for AI Overviews (beyond existing rich-result schema) → **NOT needed**

---

## 7. Technical SEO Quick-Reference (website/ specific)

| Check | What to look for | Spec / doc |
|---|---|---|
| SSR/SSG for indexed copy | H1, body copy, and meta in initial HTML, not client-render (site is a Next.js static export) | `website/app/**/page.tsx` |
| Canonical correctness | `metadata.alternates.canonical` present and pointing to correct URL; no duplicate-content paths | Next.js `metadata` or `generateMetadata` |
| robots.txt vs noindex | Blocked-for-crawl pages must use `noindex`; `robots.txt` alone leaves URL visible in results | `website/app/robots.ts` |
| Redirects for legacy URLs | Deprecated URL patterns get redirects (Next config / CloudFront), not silent drops | `website/next.config.*`, deploy config |
| JSON-LD structured data | `Article`/`BlogPosting` + `FAQPage` on blog/topic articles; `CollectionPage` + `ItemList` on hubs; `BreadcrumbList` on nested pages; `SoftwareApplication`/`WebApplication` on product/marketing | `website/lib/seo/schema.ts`, `website/components/JsonLd`, `FaqSchema`, `Breadcrumb` |
| Open Graph / Twitter card | `og:title`, `og:description`, `og:image` on all indexed pages | Next.js `openGraph` in `metadata` |
| Core Web Vitals | LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms | `seo-review` skill |
| Image alt text | Descriptive alt on all non-decorative images; generated cover/PNG alt text must not keyword-stuff | Next.js `<Image>` `alt` prop |
| Internal linking | 3–5 descriptive in-body links; Related Articles/Topics section; hub → cluster → article navigation; use `auto-blogger/src/internalLinks.ts` for generated content | `seo-review` skill §Internal Linking |
| Sitemap | New routes/surfaces registered in `website/app/sitemap.ts` | `website/app/sitemap.ts` |
| No unshipped-feature claims | Pages must not present JSX export or Tailwind output as available; HTML is the only shipped export | root `CLAUDE.md` → Unshipped Features |
