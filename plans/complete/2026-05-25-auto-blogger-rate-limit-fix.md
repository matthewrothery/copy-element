---
title: Auto-blogger rate limit fix — sequential execution and section-by-section generation
status: Planned
created: 2026-05-25
owner: matt
area: auto-blogger
tags: [bug, refactor, infra]
---

# Auto-blogger rate limit fix — sequential execution and section-by-section generation

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

## Context

The Lambda `topicsHandler` is hitting Anthropic's **50,000 input tokens/minute** org-level rate limit
(`claude-haiku-4-5-20251001`). Stack traces confirm the culprit: the deployed bundle calls
`Promise.allSettled` over all 4 articles simultaneously (matching `DAILY_ARTICLES=4` in terraform).
Each article pipeline fires an outline call (~7k input tokens) followed immediately by a draft call
(~12k input tokens). Running 4 in parallel = up to 76k input tokens in a burst → rate limit exceeded.

Two additional quality warnings appear in emails:
- **Too many links**: article body exceeds the link ceiling (e.g., 12 links vs. ceiling 11) because
  the draft prompt asks for "4-8 internal + 4-6 external" without knowing the computed ceiling.
- **linkKeywords too few**: the schema requests `min(6)` keywords but the post-generation
  deduplication filter (against all existing articles' claimed keywords) can reduce the list to 1.

The source `index.ts` was already changed to a sequential `for` loop but the Lambda bundle has not
been rebuilt. This plan covers the deploy of that fix and three follow-on improvements to prevent
future rate limit regressions and fix quality warnings.

**Relation to active plan
`plans/active/2026-05-17-auto-blogger-lambda-migration-and-reusable-package.md`:**
REQ-002 of that plan required `Promise.all` parallel execution. This plan supersedes that
requirement: parallel topic execution is incompatible with the 50k-token/min rate limit at
DAILY_ARTICLES=4. The change is backwards-compatible with everything else in that plan (DynamoDB
atomic claiming still protects against keyword collision; sequential execution just removes the
racing).

---

## Requirements & constraints

- **REQ-001** Four topic articles per daily Lambda run execute *sequentially* (one finishes before
  the next starts). No topic pipeline may run concurrently with another in the same invocation.
- **REQ-002** Individual AI calls within a single article pipeline must be separated by a
  configurable minimum delay (env var `AI_CALL_DELAY_MS`, default `1500`).
- **REQ-003** The article body is generated section-by-section (one AI call per section heading
  from the outline), replacing the single monolithic draft `generateObject` call.
- **REQ-004** Each section call receives only the N most-relevant research items for that heading
  (default N=4), not all 12, to reduce per-call input token count.
- **REQ-005** The link ceiling (computed from approximate expected word count) is communicated to
  the AI in section prompts so total links across all sections stays within `linkBudget().ceiling`.
- **REQ-006** `linkKeywords` are generated in a dedicated metadata call *after* the full body is
  assembled. The schema requests `min(8).max(16)` so the post-filter deduplication leaves ≥ 6.
- **REQ-007** Diagrams are requested in the metadata call (not per section), referencing the
  assembled body to decide placement.
- **REQ-008** All existing tests pass. No change to the published artifact format (S3 shape,
  `metadata.json`, `research.json`).
- **CON-001** Lambda timeout is 900s. Sequential 4-article run with section-by-section must stay
  well under this. Estimate: 4 articles × (1 outline + 8 sections + 1 metadata + optional
  remediation) × ~4s/call = ~240s for AI calls + network overhead. Target < 600s total.
- **CON-002** No new AWS services. No change to terraform except potentially adding
  `AI_CALL_DELAY_MS` as an env var.
- **GUD-001** TypeScript only. Files under 300 lines. Named exports. No `any`.
- **GUD-002** Epoch ms timestamps only (no ISO strings in state or DB).

---

## References

- Internal docs: `./CLAUDE.md` (root), `./auto-blogger/src/config.ts`, `./auto-blogger/src/generateArticle.ts`, `./auto-blogger/src/quality.ts`, `./auto-blogger/src/index.ts`, `./auto-blogger/src/lambda.ts`
- Active plan affected: `./plans/active/2026-05-17-auto-blogger-lambda-migration-and-reusable-package.md`
- External docs: [Anthropic rate limits](https://docs.anthropic.com/en/api/rate-limits), [Vercel AI SDK `generateText`](https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-text), [Vercel AI SDK `generateObject`](https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-object)

---

## Active plans affected

`plans/active/2026-05-17-auto-blogger-lambda-migration-and-reusable-package.md`:
- **REQ-002** (parallel via `Promise.all`) is superseded. Update the plan's REQ-002 to reflect
  sequential execution. No other phases are affected; DynamoDB claiming, artifact format, S3 shape,
  digest email, and importer flow are all unchanged.

---

## Docs to update on completion

- `auto-blogger/README.md` — update "how this runs in prod" to say sequential topic execution and
  note `AI_CALL_DELAY_MS` env var.
- `plans/active/2026-05-17-auto-blogger-lambda-migration-and-reusable-package.md` — amend REQ-002
  to note it is superseded by this plan.

---

## Architecture decisions

**ADR-001 — Sequential topics over a configurable concurrency limiter**
A `p-limit`-style concurrency limiter (limit=1) and a simple sequential `for` loop both achieve the
same outcome. Chosen: `for` loop (already implemented in source). No new dependency, simpler code,
easier to reason about. Alternative (configurable concurrency) adds indirection without benefit
while we're at DAILY_ARTICLES=4 and a 50k/min limit that can support at most ~1 article's pipeline
at a time.

**ADR-002 — Section-by-section with `generateText` (not `generateObject`)**
Each section is raw markdown — no structured fields needed. `generateObject` over a `{content:
string}` wrapper adds schema overhead (JSON wrapping, parsing) for no benefit. `generateText` is
simpler and produces slightly fewer tokens per call.

**ADR-003 — Metadata call after body assembly (not during section generation)**
`title`, `slug`, `excerpt`, `readTime`, `imagePrompt`, `linkKeywords`, and `diagrams` all benefit
from seeing the complete body. Generating them after all sections are done is both more accurate
and keeps section prompts small. Alternative (generate metadata before sections) would force
speculation about content not yet written.

**ADR-004 — Research relevance by keyword overlap (not a separate AI call)**
Selecting the top-N research items per section uses a simple word-overlap score between the section
heading and each source's title + first 200 chars of content. Cheap, deterministic, no extra API
call. Alternative (ask the AI to select relevant sources) would add latency and tokens.

**ADR-005 — linkKeywords in metadata call, schema min raised to 8**
Currently the draft generates linkKeywords with `min(6)` and post-filtering against existing
articles can drop the count to 1. The fix: request `min(8).max(16)` in the metadata schema, pass
the full "already taken" list to the metadata prompt so the AI avoids collisions proactively, and
still apply the post-filter as a safety net. A top-up AI call (fallback) is not planned — quality
warning suppression is acceptable if the AI still produces < 6 after post-filtering.

---

## Phases

### Phase 1 — Deploy sequential topics (hot fix)

**Goal (GOAL-001):** Ship the `for`-loop fix that already exists in `index.ts` so the deployed
Lambda stops running parallel pipelines.

| Task     | Description                                                                                       | Done | Date |
|----------|---------------------------------------------------------------------------------------------------|------|------|
| TASK-001 | Review `index.ts` diff (the `for` loop replacing `Promise.allSettled`) and confirm it's correct. Also update the stale `runParallelTopics` JSDoc (line ~169) which still says "runs N pipelines in parallel via `Promise.allSettled`" — update to reflect sequential execution; optionally rename to `runTopicsCycle`. |      |      |
| TASK-002 | Commit and push to `master` to trigger the `build_auto_blogger_lambda` CI job (per `deploy-apps.yml`). |      |      |
| TASK-003 | Verify Lambda function code updated by checking CI job success and `LastModified` timestamp: `aws lambda get-function-configuration --function-name element-armory-auto-blogger-topics --query 'LastModified'`. |      |      |
| TASK-004 | Amend REQ-002 note in `plans/active/2026-05-17-*` to record the parallel→sequential change.      |      |      |

**Files touched:** `auto-blogger/src/index.ts` (JSDoc update only — the `for` loop is already in place).

**Verify:**
- `npm test` in `auto-blogger/` passes.
- Lambda invocation log shows `[topic] Pipeline failed` errors gone; articles process one at a time.

---

### Phase 2 — Inter-call delay guard

**Goal (GOAL-002):** Add a minimum delay between consecutive AI API calls (within a single article
and between sequential articles) so bursts of calls never exceed the token rate limit.

| Task     | Description                                                                                                                    | Done | Date |
|----------|--------------------------------------------------------------------------------------------------------------------------------|------|------|
| TASK-101 | Add `sleep(ms: number): Promise<void>` utility to `auto-blogger/src/utils.ts` (new file, trivial).                            |      |      |
| TASK-102 | Read `AI_CALL_DELAY_MS` from env in `config.ts`; add `aiCallDelayMs: number` to `AutoBloggerConfig` (default `1500`).         |      |      |
| TASK-103 | Add `config: Pick<AutoBloggerConfig, 'aiCallDelayMs'>` to `generateTopicArticle`'s input object in `generateArticle.ts`. Thread `config` through from `runOneTopicPipeline` in `index.ts`. Insert `await sleep(config.aiCallDelayMs)` between the outline call and the (still-present) draft call. **Note:** Phase 3 removes the draft call and adds per-section sleeps; this interim insertion is temporary and will be superseded by Phase 3. |      |      |
| TASK-104 | In `index.ts`: add the inter-article sleep at the **start** of each loop iteration except the first (i.e. `if (i > 0) await sleep(config.aiCallDelayMs * 4)`) to avoid sleeping needlessly after the last article. |      |      |
| TASK-105 | Add `AI_CALL_DELAY_MS = "2000"` to the **topics** Lambda env block only in `terraform/lambda.tf`. The news Lambda is out of scope and does not need this delay. |      |      |

**Files touched:**
- `auto-blogger/src/utils.ts` (new): `sleep` export.
- `auto-blogger/src/config.ts`: add `aiCallDelayMs` field + env parse.
- `auto-blogger/src/generateArticle.ts`: `config` added to input type; one `await sleep` insertion (temporary until Phase 3).
- `auto-blogger/src/index.ts`: thread `config` into `generateTopicArticle` call; add inter-article sleep.
- `terraform/lambda.tf`: `AI_CALL_DELAY_MS = "2000"` added to topics Lambda env only.

**Tests added:**
- Unit test for `sleep` in `utils.test.ts` (smoke test only — no timer mocking needed).

**Verify:**
- `npm test` in `auto-blogger/` passes.
- CloudWatch logs for the next Lambda invocation show > 2s gap between consecutive API calls.

---

### Phase 3 — Section-by-section article generation

**Goal (GOAL-003):** Replace the single large `generateObject` draft call (~12k input tokens) with
N sequential `generateText` calls (one per section heading, ~3-5k input tokens each), then a final
`generateObject` metadata call. This reduces peak per-call input tokens by ~60-70%.

#### 3a — New helper functions in `generateArticle.ts`

| Task     | Description                                                                                          | Done | Date |
|----------|------------------------------------------------------------------------------------------------------|------|------|
| TASK-201 | Add `selectRelevantResearch(research, heading, n)` — scores each source by keyword overlap with heading, returns top-N. No AI call. |      |      |
| TASK-202 | **Reuse** the existing `countTokens(body, prefix)` helper (already in `generateArticle.ts`) for all link counting in the section loop. Do NOT add a new `countBodyLinks` function. |      |      |
| TASK-203 | Add `buildSectionPrompt(params)` — builds the prompt for one section: heading, angle, targetReader, previous-section tail (last 300 chars for continuity), relevant research, relevant link candidates, remaining link budget, and a compact "links already placed" list (the `{{LINK:<id>}}` ids and `{{SRC:<n>}}` source numbers emitted in prior sections). |      |      |
| TASK-204 | Add `generateSection(heading, params, model, system, config)` — calls `generateText`, returns trimmed section markdown. Includes `await sleep(config.aiCallDelayMs)` after the call. |      |      |

**Section prompt rules (embedded in `buildSectionPrompt`):**
- Write only the content for the heading `## <heading>` (include the heading line).
- Markdown body only — no frontmatter, no title H1.
- Cite research sources via `{{SRC:<n>|anchor}}` — source numbers refer to the full article's
  research list (passed in prompt as `Source N — Title`).
- Link to internal content via `{{LINK:<id>|anchor}}` — id from the provided candidate list.
- **Link budget for this section**: "The full article targets ~T total links. Prior sections have
  used X. Use at most Y new links in this section (internal + external combined)."
- **Links already placed** (do not repeat these ids or source numbers): `<compact list>`.
- Never include raw URLs.
- 150-350 words per section.

#### 3b — New metadata call

| Task     | Description                                                                                                      | Done | Date |
|----------|------------------------------------------------------------------------------------------------------------------|------|------|
| TASK-205 | Define `MetadataSchema` in `generateArticle.ts`: `title`, `slug`, `excerpt`, `readTime`, `imagePrompt`, `linkKeywords` (min 8, max 16), `diagrams` (max 5). |      |      |
| TASK-206 | Add `buildMetadataPrompt(body, outline, input)` — builds the metadata call prompt. Includes: assembled body, section headings, keyword/hub/cluster context, full "already taken" keyword list, instruction to produce `linkKeywords` that do NOT appear in the taken list. |      |      |
| TASK-207 | Add `generateMetadata(body, outline, input, model, system, config)` — calls `generateObject` with `MetadataSchema`. |      |      |

#### 3c — Wire together in `generateTopicArticle`

| Task     | Description                                                                                                      | Done | Date |
|----------|------------------------------------------------------------------------------------------------------------------|------|------|
| TASK-208 | Replace the `DraftSchema` + draft `generateObject` call with the section loop + metadata call.                  |      |      |
| TASK-209 | Accumulate per-call token usage across all section calls + metadata call into `tokenUsage`.                      |      |      |
| TASK-210 | Remove `DraftSchema` (no longer needed). Keep `OutlineSchema` and the outline call unchanged.                   |      |      |
| TASK-211 | After section loop: assemble `body = sections.join('\n\n')`. Apply upfront-answer check (first non-heading text). |      |      |
| TASK-212 | After the metadata call returns `diagrams[]`, apply the orphan-drop filter (keep only specs whose `{{DIAGRAM:<id>}}` placeholder appears in the assembled body) **inside `generateTopicArticle`** before returning. `applyDiagramsToArticle` (SVG rendering) stays in `index.ts` and is unchanged — it already operates on `GeneratedArticle.diagrams`. |      |      |
| TASK-213 | Apply existing remediation logic (add missing `{{LINK:}}`/`{{SRC:}}` tokens) after section assembly, before metadata call — body is already assembled at that point. |      |      |

**Files touched:**
- `auto-blogger/src/generateArticle.ts`: substantial rewrite. Keep existing helper functions
  (`summarizeResearch`, `summarizeInternalLinks`, `countTokens`, `buildSystemPrompt`,
  `createTextModel`, `sanitizeSlug`). Remove `DraftSchema`. Add `MetadataSchema`,
  `selectRelevantResearch`, `buildSectionPrompt`, `generateSection`, `buildMetadataPrompt`,
  `generateMetadata`. Rewrite `generateTopicArticle` body.

**Tests added in this phase:**
- Unit test for `selectRelevantResearch` — confirms top-N scoring by heading keyword overlap.
- Unit test for `buildSectionPrompt` — output contains heading, link budget line, research refs, and "links already placed" list.
- Smoke integration test for `generateTopicArticle` using a mocked AI provider — confirms final
  `GeneratedArticle` shape matches the existing type exactly (including `relatedSlugs` sourced
  from `outline.object`, not the metadata call).

**Verify:**
- `npm test` in `auto-blogger/` passes.
- Run a dry-run locally (`AUTO_BLOG_DRY_RUN=true npm run dev`): confirm article is generated,
  per-section calls appear in logs, metadata call appears last.
- CloudWatch logs confirm per-call token counts are ~3-5k (not ~12k) for section calls.

---

### Phase 4 — Fix link quality warnings

**Goal (GOAL-004):** Eliminate the "too many links" and "linkKeywords too few" quality warnings.

| Task     | Description                                                                                                                 | Done | Date |
|----------|-----------------------------------------------------------------------------------------------------------------------------|------|------|
| TASK-301 | In `buildSectionPrompt`: compute the per-section link allowance dynamically (total ceiling ÷ section count, distributed by remaining budget). Pass it in the prompt as a hard ceiling. |      |      |
| TASK-302 | In `MetadataSchema`: raise `linkKeywords` from `min(6).max(12)` to `min(8).max(16)`.                                      |      |      |
| TASK-303 | In `buildMetadataPrompt`: include the full "already taken" keyword list prominently, with instruction "Your linkKeywords MUST NOT include any phrase from this list." |      |      |
| TASK-304 | Post-filter in `generateTopicArticle` stays (safety net). Add a quality-warning log line when filtered count drops below 6, but do NOT fail or retry. |      |      |
| TASK-305 | In `quality.ts` `validateArticleQuality`: confirm the link ceiling check uses `linkBudget(article.body)` — already correct, no change. |      |      |

**Files touched:**
- `auto-blogger/src/generateArticle.ts`: `buildSectionPrompt` (TASK-301), `MetadataSchema` (TASK-302), `buildMetadataPrompt` (TASK-303), post-filter log (TASK-304).

**Tests added:**
- Unit test: `linkBudget` ceiling assertion on a sample 1200-word body — confirms target and ceiling.
- Unit test: `MetadataSchema` validation rejects `linkKeywords` arrays shorter than 8.

**Verify:**
- Quality email warnings "Too many links" and "linkKeywords has only N entries" do not appear on the
  next production run.
- Run `validateArticleQuality` against a dry-run article output; no link-ceiling violation.

---

## Alternatives considered

- **ALT-001 — Prompt caching to reduce input token count** — Anthropic prompt caching would cache
  the system prompt (3k tokens) across calls. Saves ~3k tokens per call but doesn't address the
  concurrent-execution root cause and adds cache-miss complexity. Not worth it while the sequential
  fix is undeployed.
- **ALT-002 — Upgrade to Tier 2 Anthropic API** — Buying credits to advance to Tier 2 (higher
  rate limit) would remove the immediate constraint. Not chosen: doesn't fix the architectural
  over-parallelism and costs money for what is fundamentally a code bug.
- **ALT-003 — Configurable concurrency (p-limit)** — A concurrency limiter set to 1 achieves the
  same result as a sequential `for` loop. More complex, no benefit at this scale.
- **ALT-004 — Top-up AI call for linkKeywords shortfall** — If post-filter drops below 6, fire a
  second small AI call to generate replacements. Adds latency and an extra API call. Decided
  against: raising the generation floor to 8-16 should be sufficient, and a quality warning is
  acceptable if the AI still fails.

---

## Dependencies

- **DEP-001** — `ai` (Vercel AI SDK) — already installed. `generateText` and `generateObject` are
  both used today. No version change needed.
- **DEP-002** — `@ai-sdk/anthropic` — already installed. No change.
- **DEP-003** — No new npm dependencies introduced.

---

## Testing strategy

- **Unit (vitest):** All new helper functions (`selectRelevantResearch`, `countBodyLinks`,
  `buildSectionPrompt`) tested in isolation with fixture data. `MetadataSchema` Zod validation.
- **Integration (mocked AI):** `generateTopicArticle` with a mock AI provider confirming the
  `GeneratedArticle` shape is unchanged from the consumer's perspective.
- **Manual / dry-run:** `AUTO_BLOG_DRY_RUN=true` local run to confirm section-by-section logs and
  final article quality.
- **Production smoke:** CloudWatch logs on next scheduled Lambda invocation — confirm no
  `AI_RetryError: rate limit` entries.

---

## Code-quality principles applied

- Files stay under 300 lines. `generateArticle.ts` is currently ~345 lines; the refactor splits
  responsibilities more cleanly and the file may grow slightly — split into
  `generateArticle.ts` (orchestration) + `generateSection.ts` (section + metadata helpers) if > 300 lines after Phase 3.
- `DraftSchema` removed (dead code). `MetadataSchema` replaces it.
- No `any`. All new functions typed against existing `ResearchResult`, `InternalLinkCandidate`,
  `GeneratedArticle`, `TokenUsage` types from `types.ts`.
- `sleep` utility is a pure function; no side effects.

---

## Risks & assumptions

- **RISK-001 — Lambda timeout at 4 articles × 10+ sections**: With `AI_CALL_DELAY_MS=2000` and ~10
  sections per article, 4 articles = 4 × (1 outline + 10 sections + 1 metadata + 1.5s delay each)
  ≈ 4 × (12 calls × 4s avg + 12 × 1.5s delay) = 4 × (48s + 18s) = 264s. Well within 900s. If
  model latency spikes, the 900s Lambda timeout is the hard backstop.
- **RISK-002 — Section continuity**: Per-section generation with only the last section's tail (300
  chars) for context may produce sections that feel disconnected. Mitigated by: including the full
  list of all section headings in every section prompt (so the AI knows the overall structure) and
  passing the tail of the previous section for local continuity.
- **RISK-003 — Link budget distribution across sections**: Distributing the total link budget
  evenly across sections may leave some sections under-linked. Mitigated by: distributing by
  remaining budget dynamically (each section gets: `ceiling - linksUsedSoFar / sectionsRemaining`),
  not a fixed per-section allowance.
- **ASSUMPTION-001**: `DAILY_ARTICLES=4` stays at 4. If raised higher, the inter-article delay
  (`AI_CALL_DELAY_MS * 4` between articles) may need tuning. The env var makes this easy.
- **ASSUMPTION-002**: The Anthropic 50k/min limit applies per organisation, and the per-call token
  count for section prompts (~3-5k) leaves headroom for the outline call (~7k) and metadata call
  (~6k) within the same minute-window.

---

## Out of scope

- Changing `DAILY_ARTICLES` from 4.
- News cycle rate limit fixes (the news pipeline makes far fewer calls and has not shown rate limit
  errors).
- Upgrading to a higher-tier Anthropic plan.
- Prompt caching.
- Section-level quality validation (each section is validated holistically via the existing
  `validateArticleQuality` on the assembled body).

---

## Architect notes

**Blocking issues resolved (all fixed in plan above):**
- B1 — `generateTopicArticle` needs `config` threaded in → added to TASK-103 and TASK-208.
- B2 — TASK-212 was misdescribed (diagram SVG rendering already in `index.ts`; orphan-drop filter stays in `generateArticle.ts`) → TASK-212 rewritten to clarify.
- B3 — TASK-103 `sleep` between outline and draft is temporary, superseded by Phase 3 → noted explicitly in TASK-103.
- B4 — `countBodyLinks` duplicated `countTokens` → TASK-202 rewritten to reuse existing helper.

**Warnings incorporated:**
- W1 — Stale JSDoc in `runParallelTopics` → TASK-001 updated to fix JSDoc.
- W2 — Inter-article sleep must not fire after the last article → TASK-104 uses `if (i > 0) await sleep(...)`.
- W5 — Section deduplication is prompt-only → TASK-203 now passes a compact "links already placed" list in each section prompt.

**W4 note:** `relatedSlugs` continues to come from `outline.object`, not the metadata call. Documented in the Phase 3 smoke test task.
