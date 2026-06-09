---
name: seo-audit
description: Planning-time gate that checks an Element Armory plan against Google Search Essentials, spam policies, helpful-content/E-E-A-T, and AI optimization guidance. Produces a PASS or FAIL verdict with specific blocking items. Triggered automatically by the planner skill for any plan touching the website or other public surfaces. Also invoke with /seo-audit [plan path] for standalone use.
---

# SEO Audit — Planning Gate

Fast, deterministic checklist gate. Runs against a plan file. Produces PASS or FAIL.
For deep/subjective review, delegate to the `seo-architect` agent after this gate passes.

**Authority:** `.claude/skills/seo-audit/references/google-search-essentials.md` — read it first.

---

## When to Run

- **Automatically:** After the `planner` skill drafts any plan that touches `website/` or other public-facing surfaces.
- **On demand:** `/seo-audit [plan path]` or "run seo audit on this plan".
- **Skip:** User says "skip seo audit" — note the skip in the plan's `Architect notes` section.

---

## Step 1 — Load the reference

Read `.claude/skills/seo-audit/references/google-search-essentials.md` before running any checks.
Every finding must cite a section from that file (e.g. "SP-11 §3", "§5c").

---

## Step 2 — Determine scope

Read the plan. Note:
- Which surfaces are created or modified (`/blog/*`, `/topics/*`, `/examples/*`, `/compare/*`, `/tools/*`, other public routes).
- Whether the plan generates many pages programmatically (scale flag).
- Whether any AI/automation is used for content creation.
- Whether new routes, JSON-LD, sitemap, or redirect logic is involved.

---

## Step 3 — Run the checklist

Work through each group. Mark each item PASS, FAIL, or N/A.

### Group A — Technical Eligibility (§1)

| ID | Check | Ref |
|----|-------|-----|
| A-1 | New/modified pages are SSR or SSG — SEO-critical text (H1, body, meta) in initial HTML, not client-only render | T-5 §1 |
| A-2 | New routes will return HTTP 200 for valid URLs; error paths return appropriate non-200 codes | T-2 §1 |
| A-3 | No new Googlebot blocks introduced (robots.txt disallow, auth wall on indexed pages) | T-1 §1 |
| A-4 | Pages intended to be excluded from results use `noindex`, not robots.txt alone | T-4 §1 |
| A-5 | Canonical URLs are deterministic — no unintentional duplicate-content paths from query params | §7 |

### Group B — Spam Policy Exposure (§2–3)

| ID | Check | Ref |
|----|-------|-----|
| B-1 | **Scaled content:** If plan generates many pages, each page has a described per-page uniqueness mechanism (original Element Armory screenshots, first-hand capture/inspect steps, genuine added value, human review) | SP-11 §3 |
| B-2 | **Scaled content:** Plan does not describe synonymizing, translating, or otherwise obfuscating copied content across pages | SP-11 §3 |
| B-3 | **Doorway abuse:** Topic hubs (`/topics/[hub]`) form a real browseable hub→cluster→article hierarchy, not keyword funnels leading to a single destination | SP-02 §2 |
| B-4 | **Keyword stuffing:** Article/page titles, descriptions, and alt text avoid unnatural keyword repetition purely for ranking | SP-06 §2 |
| B-5 | **Link spam:** Any new affiliate or paid links will carry `rel="nofollow"` or `rel="sponsored"` | SP-07 §2 |
| B-6 | **Scraping / thin affiliation:** No plan to republish third-party copy without substantial added value | SP-12, SP-15 §2 |
| B-7 | **Cloaking:** Users and Googlebot will be served the same content | SP-01 §2 |

### Group C — Helpful Content & E-E-A-T (§4)

| ID | Check | Ref |
|----|-------|-----|
| C-1 | Content is people-first: useful to visitors who never install the extension | §4c |
| C-2 | Important pages show real Element Armory value (genuine screenshots, concrete capture/inspect walkthroughs) — not generic filler | §4 |
| C-3 | AI-drafted content has a human review step before publishing; plan describes this or references `auto-blogger/rules.md` | §4d |
| C-4 | Plan does not propose changing dates on pages solely to appear fresh | §4c |
| C-5 | Plan does not enter a niche without described expertise or first-hand experience | §4c |
| C-6 | Content leaves the reader satisfied — no manufactured cliffhangers pushing them to search again | §4c |
| C-7 | **No unshipped-feature claims:** Plan does not present JSX export or Tailwind output as available; HTML is the only shipped export | §6 (SP-10), root `CLAUDE.md` |

### Group D — Anti-Myth Guardrails (§5c)

Any YES here means the plan is spending effort Google has explicitly said is unnecessary.

| ID | Check (flag if plan proposes this) | Ref |
|----|-----|-----|
| D-1 | Plan proposes adding `llms.txt` or other AI-specific crawl files | §5c |
| D-2 | Plan proposes "chunking" content into small pieces for AI understanding | §5c |
| D-3 | Plan proposes rewriting content in special vocabulary or format specifically for AI systems | §5c |
| D-4 | Plan proposes inauthentic mention outreach (paying for mentions, coordinated social mentions) | §5c |
| D-5 | Plan proposes structured data specifically and only for AI features (beyond existing rich-result schema) | §5c |

### Group E — Structural SEO Hygiene (§7)

| ID | Check | Ref |
|----|-------|-----|
| E-1 | New blog/topic article pages include `Article`/`BlogPosting` + `FAQPage` JSON-LD where applicable (via `website/lib/seo/schema.ts` / `FaqSchema`) | §7 |
| E-2 | New hub/collection pages include `CollectionPage` (+ `ItemList`) JSON-LD; nested pages include `BreadcrumbList` | §7 |
| E-3 | New public routes are added to `website/app/sitemap.ts` | §7 |
| E-4 | Any deprecated URL patterns have 301 redirects planned (not silent drops) | §7 |
| E-5 | Non-decorative images have meaningful `alt` text; generated PNGs avoid keyword-stuffed alt | §7 SP-06 |
| E-6 | Open Graph (`og:title`, `og:description`, `og:image`) addressed for new indexed pages | §7 |

---

## Step 4 — Output verdict

```
## SEO Audit: <plan path>

**VERDICT:** PASS | FAIL

### BLOCKING (must fix before plan moves to plans/active/)
- [ ] <item ID> — <specific issue> — <reference §N>

### WARNINGS (should fix; won't block)
- [ ] <item ID> — <issue> — <reference §N>

### ANTI-MYTH FLAGS (unnecessary work — recommend removing from plan)
- [ ] <item ID> — <proposed technique> — not needed per Google §5c

### PASS ITEMS
- [x] <item ID> — <check confirmed>
```

**If PASS:** Plan may proceed. Optionally delegate to `seo-architect` agent for deeper/subjective review.

**If FAIL:** All BLOCKING items must be resolved before the plan moves to `plans/active/`. Re-run after fixes.

---

## Auto-fail conditions

Any of these automatically produce a FAIL verdict:

1. Plan generates many pages with no described per-page uniqueness mechanism (B-1).
2. Plan proposes client-only rendering for SEO-critical text on indexed pages (A-1).
3. Plan proposes blocking Googlebot on pages intended to rank (A-3).
4. Plan describes synonymizing or translating scraped content at scale (B-2).

---

## What this skill does NOT do

- Modify the plan or source files.
- Perform deep subjective content quality review (that is the `seo-architect` agent's role).
- Audit live content files (that is the `seo-review` skill's role).
- Replace good editorial judgment on individual pieces of content.
