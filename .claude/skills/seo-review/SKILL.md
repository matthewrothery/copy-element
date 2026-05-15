---
name: seo-review
description: Perform a focused SEO audit on Element Armory content — auto-blogger generated articles, topic hub pages, and Next.js marketing pages — to maximize search visibility, featured snippet optimization, and ranking potential.
---

# Skill: SEO Audit for Element Armory Content

Use this skill to audit Element Armory's two SEO content surfaces:

1. **Auto-blogger content** — generated articles and topic pages under `website/content/blog/*.md` and `website/content/topics/<hub>/*.md`.
2. **Marketing pages** — Next.js App Router routes under `website/app/**/page.tsx` (homepage, features, pricing, compare, tools, support, use cases, etc.).

The goal is to maximize search visibility for the audience: developers, designers, vibe coders, and AI-coding-tool users who want to capture UI from any site and rebuild it with AI.

## When to Use

- Before publishing a new blog article or topic hub
- Before shipping a new marketing route
- When optimizing underperforming pages
- After major content updates
- Periodic content audits
- When targeting new keyword clusters

## Element Armory Keyword Themes

Use these primary themes as the basis for cluster discovery on any page. Pick the cluster that matches the page's intent — do not stuff unrelated themes.

| Theme | Primary | Variant patterns |
|-------|---------|------------------|
| **Capture UI** | copy UI from website, copy CSS from any website | how to copy [element] from a website, extract HTML and CSS from a website |
| **Inspect & debug** | inspect element shortcut, debug CSS without DevTools | how to inspect CSS, copy computed styles |
| **Chrome extension** | UI capture Chrome extension, copy element Chrome extension | best Chrome extension for [task], free Chrome extension to [task] |
| **Vibe coding / AI UI** | vibe coding UI, AI coding workflows for UI | how to vibe code [thing], AI coding tools for UI |
| **Rebuild with AI** | convert HTML to React, copy website element to React | [framework] from HTML, give Cursor/Claude/Copilot real UI |
| **Component reuse** | UI component reuse, build a component library from real sites | reuse design patterns, component library workflow |
| **Comparisons** | Element Armory vs [competitor] | [competitor] alternative, free alternative to [competitor] |
| **Use cases** | landing page UI inspiration, SaaS UI patterns | reverse engineer UI, UI patterns for [niche] |

Avoid claiming unshipped features anywhere in copy:
- **No JSX export** (HTML only)
- **No Tailwind output** (HTML only)

## Per-Surface Conventions

### Auto-blogger blog posts (`website/content/blog/<slug>.md`)

Frontmatter required:

```yaml
---
title: "<50–60 chars>"
slug: "<kebab-case primary keyword>"
date: "<YYYY-MM-DD>"
author: "<name>"
excerpt: "<150–160 chars, action verb, primary keyword, specific value>"
readTime: "<N min read>"
coverImage: "/blog/<slug>.jpg"
---
```

Body rules (from `auto-blogger/rules.md`):
- No em dashes
- No claims of JSX export or Tailwind output (HTML only)
- Diagram placeholders only as `{{DIAGRAM:id}}` on their own line; ids lowercase slug segments
- No raw SVG or Mermaid in body — diagrams are JSON in the diagrams array only
- 1–3 diagrams maximum; skip diagrams that don't add clarity
- **No `## FAQ` / `### FAQ` / "Frequently asked questions" sections in body** — FAQs are frontmatter-only on topic pages

### Topic hub & cluster pages (`website/content/topics/<hub>/*.md`)

Hub frontmatter:

```yaml
---
type: hub
hub: <hub-slug>
title: "<Hub Title>"
excerpt: "<one-line summary, primary keyword>"
faq:
  - question: "..."
    answer: "..."
---
```

Hub pages must have a strong FAQ (4+ Q&As) in frontmatter — these win featured snippets. Do **not** also include FAQ sections in markdown body.

### Marketing pages (`website/app/**/page.tsx`)

- Route-level metadata via Next.js `Metadata` export — title, description, canonical, OpenGraph, Twitter card
- JSON-LD where applicable (Product, Article, BreadcrumbList, FAQPage, SoftwareApplication)
- Entry in `website/app/sitemap.ts`
- LCP image via `next/image` with `priority`
- Render strategy: RSC by default, client only where genuine interactivity needs it
- Core Web Vitals budget: LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms

---

## Audit Methodology

Follow these five steps for every audit.

### Step 1 — Identify Target Keywords

Pick **one** primary keyword and 3–5 secondary keywords from the matching theme. State the search intent (informational / how-to / comparison / transactional).

### Step 2 — On-Page SEO Audit

Walk every checklist below in order. Score honestly.

### Step 3 — Featured Snippet Optimization

Look for question-format H2s, 40–60 word definitions, numbered steps, comparison tables.

### Step 4 — Internal Linking Audit

Map outbound links from the page and incoming links to it. An orphan page will not rank.

### Step 5 — Generate the Report

Document findings using the template at the end of this file.

---

## Audit Checklists

### 1. Title Tag (4 points)

| # | Check | Pts | How to verify |
|---|-------|-----|---------------|
| 1 | Length 50–60 characters | 1 | Count characters in `title` frontmatter / `<title>` / `metadata.title` |
| 2 | Primary keyword in first half | 1 | Keyword appears before the midpoint |
| 3 | Differentiated, not generic | 1 | Not interchangeable with a competitor's title |
| 4 | Contains a hook (outcome / benefit / number) | 1 | Promises value to the reader |

**Title formula (blog):** `[Outcome / benefit]: [What you'll learn or get]`
**Title formula (marketing):** `[Product capability or use case] | Element Armory`

**Good examples:**
| Surface | Title | Chars |
|---------|-------|-------|
| Blog | "Copy Any Website Element and Convert It to React" | 49 |
| Blog | "How to Vibe Code Beautiful UI Without Getting Stuck" | 52 |
| Topic | "Copy UI from Websites: The Complete Guide" | 42 |
| Marketing | "Copy UI from Any Site and Rebuild It with AI | Element Armory" | 60 |

**Bad examples:**
| Issue | Bad | Better |
|-------|-----|--------|
| Too generic | "Vibe Coding" | "How to Vibe Code Beautiful UI Without Getting Stuck" |
| Keyword stuffing | "Copy UI Copy HTML Copy CSS from Website Free" | "Copy HTML and CSS from Any Website in One Click" |
| Missing hook | "Element Armory Features" | "Capture UI Elements and Copy Clean HTML | Element Armory" |

### 2. Meta Description / Excerpt (4 points)

| # | Check | Pts | How to verify |
|---|-------|-----|---------------|
| 1 | Length 150–160 characters | 1 | Count chars in `excerpt` / `metadata.description` |
| 2 | Starts with an action word or specific promise | 1 | "Capture…", "Copy…", "Rebuild…", "Stop wrestling with…" |
| 3 | Contains primary keyword | 1 | Naturally placed, not stuffed |
| 4 | Promises a concrete outcome | 1 | What will the reader walk away with |

### 3. Keyword Placement (5 points)

| Location | Pts |
|----------|-----|
| Title | 1 |
| Description / excerpt | 1 |
| First 100 words of body | 1 |
| At least one H2 | 1 |
| Natural reading (no stuffing — max 3–4 exact-phrase mentions per 1,000 words) | 1 |

### 4. Content Structure (6 points)

| # | Check | Pts |
|---|-------|-----|
| 1 | Opening hook (problem statement, question, or sharp claim) | 1 |
| 2 | Code or concrete example in first 200 words (blog only — for marketing, swap for a clear hero CTA above the fold) | 1 |
| 3 | "What you'll learn" / lead-in summary present | 1 |
| 4 | Short paragraphs (2–4 sentences) | 1 |
| 5 | Length appropriate for surface (see length table below) | 1 |
| 6 | Key terms bolded on first mention | 1 |

**Length targets:**
| Surface | Target |
|---------|--------|
| Blog post | 1,500–2,500 words (excellent: 2,500–4,000) |
| Topic hub | 1,200–2,000 words plus strong FAQ |
| Topic cluster page | 800–1,500 words |
| Marketing landing route | As long as needed — no padding; every section earns its place |

### 5. Featured Snippet Optimization (4 points)

| # | Check | Pts |
|---|-------|-----|
| 1 | 40–60 word definition near the top answering "What is X?" or "How does X work?" | 1 |
| 2 | At least one question-format H2 | 1 |
| 3 | Numbered steps for any "how to" content | 1 |
| 4 | Comparison table for any "X vs Y" / alternative content | 1 |

### 6. Internal Linking (4 points)

| # | Check | Pts |
|---|-------|-----|
| 1 | 3–5 internal links in body with descriptive anchor text | 1 |
| 2 | No "click here" / "this article" anchors | 1 |
| 3 | Linked from at least one other page (not orphaned) | 1 |
| 4 | Related Articles / Related Topics section present (blog and topic surfaces) | 1 |

Use the auto-blogger's internal-linking utilities (`auto-blogger/src/internalLinks.ts`, `applyLinkPlaceholders.ts`, `backfillInternalLinks.ts`) for blog/topic content rather than hand-rolling links.

### 7. Technical SEO (3 points)

| # | Check | Pts |
|---|-------|-----|
| 1 | Single H1 per page (matches `<title>` / `metadata.title` intent) | 1 |
| 2 | URL slug is lowercase, hyphen-separated, contains primary keyword, no special chars | 1 |
| 3 | Page indexable: in `sitemap.ts`, not blocked by `robots.ts`, has canonical | 1 |

### 8. Marketing-Page-Only Additions

For routes under `website/app/**/page.tsx` also verify:

| Check | Notes |
|-------|-------|
| `metadata` export includes title, description, openGraph, twitter, canonical | Use Next.js `Metadata` typing |
| LCP image uses `next/image` with `priority` | Above-the-fold image |
| JSON-LD present where applicable | Product / SoftwareApplication / Article / FAQPage / BreadcrumbList |
| Route added to `website/app/sitemap.ts` | With appropriate priority + changeFrequency |
| `robots.ts` does not block the route | Unless intentionally hidden |
| Core Web Vitals budget respected | LCP ≤ 2.5s, CLS ≤ 0.1, INP ≤ 200ms |
| Internal links from related pages | Don't ship orphan routes |
| **Does not claim unshipped features** (JSX export, Tailwind output) | HTML is the only shipped export |
| Chrome install CTA uses `website/components/ChromeStoreCtaLabel` | `Add to Chrome - It's Free` with `Free` emphasized |

### 9. Auto-Blogger Body Compliance (auto-blogger output only)

| Check | Notes |
|-------|-------|
| No em dashes | Use commas, periods, or parentheticals instead |
| No claims of JSX export or Tailwind output | HTML only |
| Diagrams: `{{DIAGRAM:id}}` placeholders only, JSON specs in diagrams array | No raw SVG / Mermaid in body |
| 1–3 diagrams max | Skip if they don't add clarity |
| No FAQ section in body | FAQs are frontmatter-only on topic pages |
| Cover image path matches `/blog/<slug>.jpg` convention | Filename matches slug |

---

## Common Issues & Fixes

### Title Issues

| Issue | Fix |
|-------|-----|
| Over 60 chars | Trim filler words; keep keyword + hook |
| Generic title | Add a specific outcome or number |
| Keyword stuffing | One natural keyword placement, then write for humans |
| Marketing page missing `| Element Armory` suffix | Add it unless title already brands clearly |

### Content Issues

| Issue | Fix |
|-------|-----|
| No hook | Open with the problem, a question, or a sharp claim |
| Code example too late (blog) | Move a concrete example or screenshot into first 200 words |
| Long paragraphs | Break into 2–4 sentence chunks |
| Under-length for surface type | Add depth: examples, edge cases, comparisons |
| No bolded terms | Bold key concepts on first mention |
| Em dashes (auto-blogger) | Replace with commas, periods, or parentheticals |

### Featured Snippet Issues

| Issue | Fix |
|-------|-----|
| No definition | Add a 40–60 word definition near top |
| Definition too long | Tighten to 40–60 words |
| No question H2 | Add "What is X?" / "How does X work?" / "How do I X?" |
| Steps not numbered | Use a numbered list |
| Missing comparison table | Add a table for "X vs Y" sections |

### Internal Linking Issues

| Issue | Fix |
|-------|-----|
| No internal links | Add 3–5 to related blog posts, topic hubs, or marketing routes |
| Bad anchor text | Replace "click here" / "this article" with descriptive text |
| Orphan page | Link from at least one related page; ensure topic hub references it |
| Missing Related Articles | Add a Related Articles / Related Topics section at the bottom |

### Technical SEO Issues

| Issue | Fix |
|-------|-----|
| Multiple H1s | Keep only one `#` heading; demote others to `##` |
| Underscore or uppercase in slug | Convert to lowercase hyphenated |
| Slug too long | Shorten to primary keyword |
| Missing canonical | Add via Next.js `metadata.alternates.canonical` (marketing) |
| Route not in sitemap | Add to `website/app/sitemap.ts` |

---

## SEO Audit Report Template

Use this template to document findings.

```markdown
# SEO Audit Report: [Page Title]

**Surface:** Auto-blogger article / Topic hub / Topic cluster / Marketing page
**File:** `<path>`
**URL:** `<production URL or planned route>`
**Date:** YYYY-MM-DD
**Auditor:** [Name / Claude]
**Overall Score:** XX/30 (XX%)
**Status:** ✅ Excellent / ⚠️ Needs Work / ❌ Poor

---

## Score Summary

| Category | Score | Status |
|----------|-------|--------|
| Title Tag | X/4 | ✅/⚠️/❌ |
| Meta Description / Excerpt | X/4 | ✅/⚠️/❌ |
| Keyword Placement | X/5 | ✅/⚠️/❌ |
| Content Structure | X/6 | ✅/⚠️/❌ |
| Featured Snippets | X/4 | ✅/⚠️/❌ |
| Internal Linking | X/4 | ✅/⚠️/❌ |
| Technical SEO | X/3 | ✅/⚠️/❌ |
| **Total** | **X/30** | **STATUS** |

Marketing-only addenda (pass/fail): metadata export, LCP image, JSON-LD, sitemap entry, robots, CWV budget, no unshipped-feature claims.
Auto-blogger-only addenda (pass/fail): no em dashes, no JSX/Tailwind claims, diagram format, no body FAQ, cover image path.

---

## Target Keywords

**Primary:** [keyword]
**Secondaries:**
- [keyword]
- [keyword]
- [keyword]

**Search Intent:** Informational / How-to / Comparison / Transactional

---

## Title Tag

**Current:** "<current title>" (XX chars)
**Score:** X/4

| Check | Status | Notes |
|-------|--------|-------|
| 50–60 chars | ✅/❌ | XX |
| Primary keyword in first half | ✅/❌ | |
| Differentiated, not generic | ✅/❌ | |
| Contains hook | ✅/❌ | |

**Recommended:** "<suggested title>" (XX chars)

---

## Meta Description / Excerpt

**Current:** "<current>" (XX chars)
**Score:** X/4

| Check | Status | Notes |
|-------|--------|-------|
| 150–160 chars | ✅/❌ | XX |
| Starts with action word / promise | ✅/❌ | |
| Contains primary keyword | ✅/❌ | |
| Promises specific outcome | ✅/❌ | |

**Recommended:** "<suggested>" (XX chars)

---

## Keyword Placement (X/5)

| Location | Present | Notes |
|----------|---------|-------|
| Title | ✅/❌ | |
| Description / excerpt | ✅/❌ | |
| First 100 words | ✅/❌ | At word XX |
| H2 heading | ✅/❌ | "<H2 text>" |
| Natural reading | ✅/❌ | (no stuffing) |

---

## Content Structure (X/6)

**Word count:** X,XXX

| Check | Status | Notes |
|-------|--------|-------|
| Opening hook | ✅/❌ | |
| Code / example / hero CTA in first 200 words | ✅/❌ | |
| Lead-in summary | ✅/❌ | |
| Short paragraphs (2–4 sentences) | ✅/❌ | |
| Length appropriate for surface | ✅/❌ | |
| Key terms bolded | ✅/❌ | |

---

## Featured Snippet (X/4)

| Check | Status | Notes |
|-------|--------|-------|
| 40–60 word definition near top | ✅/❌ | Currently XX words |
| Question-format H2 | ✅/❌ | |
| Numbered steps for how-to | ✅/❌/N/A | |
| Comparison table for vs / alternative | ✅/❌/N/A | |

---

## Internal Linking (X/4)

| Check | Status | Notes |
|-------|--------|-------|
| 3–5 internal links | ✅/❌ | X found |
| Descriptive anchor text | ✅/❌ | |
| Linked from ≥1 other page | ✅/❌ | |
| Related section present | ✅/❌ | |

**Current outbound:**
1. [Anchor] → `<path>`
2. [Anchor] → `<path>`

**Recommended additions:**
- Link to <page> from <section>
- Link to <page> from <section>

---

## Technical SEO (X/3)

| Check | Status | Notes |
|-------|--------|-------|
| Single H1 | ✅/❌ | |
| Slug is keyword-rich, lowercase, hyphenated | ✅/❌ | `<slug>` |
| In sitemap, not blocked, has canonical | ✅/❌ | |

---

## Marketing-Only Addenda *(omit for blog/topic)*

| Check | Status | Notes |
|-------|--------|-------|
| `metadata` export complete (title, description, OG, Twitter, canonical) | ✅/❌ | |
| LCP image via `next/image` with `priority` | ✅/❌ | |
| JSON-LD present where applicable | ✅/❌ | Type: |
| Route in `app/sitemap.ts` | ✅/❌ | |
| Not blocked by `robots.ts` | ✅/❌ | |
| Core Web Vitals budget respected | ✅/❌ | LCP / CLS / INP |
| Internal links from related pages | ✅/❌ | |
| No claims of JSX export / Tailwind output | ✅/❌ | |
| `ChromeStoreCtaLabel` used for install CTA | ✅/❌ | |

---

## Auto-Blogger-Only Addenda *(omit for marketing)*

| Check | Status | Notes |
|-------|--------|-------|
| No em dashes | ✅/❌ | |
| No claims of JSX / Tailwind export | ✅/❌ | |
| Diagrams as `{{DIAGRAM:id}}` placeholders only | ✅/❌/N/A | |
| 1–3 diagrams max | ✅/❌/N/A | |
| No FAQ section in body | ✅/❌ | |
| Cover image at `/blog/<slug>.jpg` | ✅/❌ | |

---

## Priority Fixes

### High
1. **[Issue]** — Current: [...]. Recommended: [...]. Impact: [...].

### Medium
1. **[Issue]** — Recommendation: [...].

### Low / Nice to Have
1. **[Issue]** — Recommendation: [...].

---

## Final Recommendation

**Ready to publish:** ✅ Yes / ❌ No — [reason]
**Next review:** [date or trigger]
```

---

## Quick Reference

### Character counts

| Element | Ideal |
|---------|-------|
| Title | 50–60 chars |
| Meta description / excerpt | 150–160 chars |
| Definition paragraph (snippet) | 40–60 words |

### Keyword density

- Maximum 3–4 exact-phrase mentions per 1,000 words
- Use variations naturally (singular/plural, ordering, synonyms)

### Content length

| Length | Assessment |
|--------|------------|
| <1,000 words (blog) | Too thin — add depth |
| 1,000–1,500 | Minimum viable |
| 1,500–2,500 | Good |
| 2,500–4,000 | Excellent |
| >4,000 | Consider splitting into a topic hub + cluster pages |

---

## Summary

For every page audit:

1. **Pick the keyword cluster** from the Element Armory themes
2. **Check title** — 50–60 chars, keyword first, hook, differentiated
3. **Check description / excerpt** — 150–160 chars, action word, keyword, specific outcome
4. **Verify keyword placement** — title, description, first 100 words, H2, natural
5. **Audit structure** — hook, example, lead-in, short paragraphs, length, bolding
6. **Optimize for snippets** — 40–60 word definition, question H2, numbered steps, tables
7. **Audit internal linking** — 3–5 links, good anchors, no orphan, Related section
8. **Verify technical SEO** — one H1, clean slug, indexable
9. **Surface-specific addenda** — marketing (metadata, LCP, JSON-LD, sitemap, CWV) or auto-blogger (no em dashes, no unshipped features, diagram format, no body FAQ)
10. **Generate the report** — score, prioritized fixes, publish/no-publish call

**Remember:** SEO is not about gaming search engines — it's about making it easy for the right developer to find Element Armory when they need it. Every optimization should also improve the reader experience and never overclaim shipped capability.
