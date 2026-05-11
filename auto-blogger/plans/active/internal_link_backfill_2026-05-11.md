# Plan: Internal-Link Backfill via Per-Article Keyword Index + Density Budget

## Context

Internal-link generation already exists in the draft path: `internalLinks.ts` loads hub/cluster/article candidates, the prompt summary in `generateArticle.ts:82` exposes stable ids, the model emits `{{LINK:id|anchor}}` placeholders, and `applyLinkPlaceholders.ts` resolves them. Quality gate at `quality.ts:72` enforces a floor of 3 internal links per article.

Two gaps remain:

1. **Stale neighbors.** An article published in January cannot link to one published in March. The internal graph only grows forward.
2. **Drift toward bloat.** Floors of 3 internal + 3 external are fine at publish; without an explicit ceiling, repeated backfill passes would push older posts past comfortable link density. The external floor of 3 also occasionally pulls in weak citations to satisfy the count.

Both gaps are solved together: a deterministic per-article keyword index (cheap lexical filter) drives an LLM-assisted backfill pass that respects a single density budget for total links.

## Goal

- Each generated article ships with a `linkKeywords` frontmatter list of 6–12 anchor-quality phrases that are unique across the corpus.
- After each import run, every existing topic article is scanned for unlinked occurrences of any newly imported article's keywords; the top 5 lexical hits per new article get a single LLM pass that inserts at most one internal link to the new article, subject to a density budget.
- Replace the dual floor/cap with a density rule: target ~1 link per 120 words (internal+external combined), minimum 3 internal and 2 external, hard ceiling derived from word count.
- Existing posts are bootstrapped with `linkKeywords` via a one-shot script.

## Density Budget

Replace `MIN_EXTERNAL_LINKS = 3` and the `internalLinkCount > 10` check.

```ts
const INTERNAL_FLOOR = 3;
const EXTERNAL_FLOOR = 2;
const WORDS_PER_LINK = 120;

function linkBudget(body: string): { target: number; ceiling: number } {
  const words = body.trim().split(/\s+/).length;
  const target = Math.max(5, Math.round(words / WORDS_PER_LINK));
  const ceiling = target + 2;
  return { target, ceiling };
}
```

Validation (`quality.ts`):
- `internal >= INTERNAL_FLOOR`, `external >= EXTERNAL_FLOOR`
- `internal + external <= ceiling`
- No single target URL linked twice
- No anchor phrase used twice

Backfill respects `ceiling` — never adds a link that would push a post over it.

## linkKeywords Frontmatter

```yaml
linkKeywords:
  - copy html without inspect element
  - copy element from website
  - capture html from page
```

Rules:
- 6–12 phrases, each 2–6 words
- Naturally readable as a mid-sentence anchor
- Must include the article's primary keyword and 1–2 close paraphrases
- **Distinct across the corpus** — collision check at generation time against `loadInternalLinkCandidates`; colliding phrases are dropped (model is asked to regenerate only if it falls below 6)

Surfaces touched:
- `types.ts` — extend `InternalLinkCandidate` with `linkKeywords?: string[]`
- `internalLinks.ts` — read `linkKeywords` from frontmatter; expose `loadKeywordIndex()` returning `{ phrase: string, candidateId: string }[]` (lowercased, sorted by phrase length desc for greedy longest-match)
- `generateArticle.ts` — prompt asks the model to emit `linkKeywords` as part of the JSON envelope; the summary block lists each candidate's keywords so the draft picks better anchors on day one
- `artifact.ts` — write `linkKeywords` into the article frontmatter

## Files to Create

### `auto-blogger/src/backfillInternalLinks.ts`

Entry point: `runBackfillForImportedArticles(workspaceRoot, importedSlugs)`.

Steps:

1. Load all internal-link candidates (`loadInternalLinkCandidates`) and build the keyword index. New articles = candidates whose slug is in `importedSlugs`.
2. For each existing topic markdown file (excluding `_index.md` and the new articles themselves):
   - Skip if file already at density ceiling.
   - Tokenize body into a placeholder mask (skip fenced code blocks, inline code, existing markdown link anchors, frontmatter).
   - Lexical scan for keywords belonging to any *new* article. Record first unlinked match per (file, new-article) pair. Skip if the file already links to that article's URL.
3. Rank: for each new article, take the top 5 files by score (score = match position earliness + cluster proximity bonus).
4. Group hits by file (a file may have hits for several new articles). For each grouped file, single LLM call:

   ```
   You are inserting internal links into an existing article. Here are N
   keyword hits with their target article ids and natural anchor positions.
   Rewrite the body to embed {{LINK:<id>|<anchor>}} at appropriate sentences
   (one per target, total ≤ remaining budget). Preserve every existing
   placeholder, heading, table, and code block.
   ```

   Constraints: at most one new link per target; total adds capped by remaining budget; placement at or near the lexical hit; never inside code/anchors.
5. Run the new body through `applyLinkPlaceholders` to resolve.
6. Re-run `validateArticleQuality` (subset relevant to links) — if it regresses (e.g., now over ceiling), discard changes for that file.
7. Write changed files back. Collect a list of `(filePath, addedTargets[])`.

### `auto-blogger/src/bootstrapLinkKeywords.ts`

One-shot CLI: `npm run bootstrap-link-keywords`.

For each topic article missing `linkKeywords` in frontmatter:
- LLM call with body + title → 6–12 distinct phrases.
- Collision check against the running set; drop dupes; reprompt once if below 6.
- Write back to frontmatter in place; no commit (caller does it).

Run order to avoid mass-collisions: oldest articles first, so newer posts adapt around the established set.

## Files to Modify

### `auto-blogger/src/types.ts`
- `GeneratedArticle.linkKeywords: string[]`
- `InternalLinkCandidate.linkKeywords?: string[]`

### `auto-blogger/src/generateArticle.ts`
- JSON envelope: require `linkKeywords` (array, 6–12 strings).
- Prompt block: include each candidate's keywords in the summary (helps the draft).
- Replace fixed floors logic with the density budget. Remediation pass now triggers if `internal < INTERNAL_FLOOR`, `external < EXTERNAL_FLOOR`, OR total `< target`.
- Validation: ensure emitted `linkKeywords` don't collide with existing candidates' keywords; if they do, drop colliding entries and require ≥6 remaining (else surface as a quality warning, do not fail the run).

### `auto-blogger/src/quality.ts`
- Remove `internalLinkCount > 10` and `MIN_EXTERNAL_LINKS == 3` checks.
- Add density check: `internal + external <= ceiling`.
- Add duplicate-target and duplicate-anchor checks.

### `auto-blogger/src/internalLinks.ts`
- `readFrontmatter` already parses scalars; extend to parse the YAML list under `linkKeywords:` (use a tiny inline list parser — full YAML dependency not needed).
- Expose `buildKeywordIndex(candidates)` → sorted phrase list with ids.

### `auto-blogger/src/applyLinkPlaceholders.ts`
- Add `addedInternalLinkCount` to the result so backfill can detect no-ops.
- Enforce uniqueness: track resolved target URLs; if the same id appears twice, drop the second occurrence with a warning.

### `auto-blogger/src/artifact.ts`
- Write `linkKeywords` into article frontmatter (alphabetical order for stable diffs).

### `auto-blogger/src/importFromS3.ts`
- After the import loop completes successfully, collect the slugs of newly imported topic articles.
- Call `runBackfillForImportedArticles(workspaceRoot, importedSlugs)`.
- If any files changed: stage them with `git add` and create a single squashed commit:

  ```
  auto-blogger: backfill internal links for <slug-1>, <slug-2>, ...
  ```

  Commit via a `git` shell call, then `git push` to the tracked remote. Push failures (non-fast-forward, auth, network) log a warning and leave the commit local — they do not fail the import.
- Wrap backfill in try/catch — failures log a warning but do not fail the import.
- Return a `BackfillSummary { filesChanged: number, linksAdded: number, perFile: Array<{ path: string; addedTargets: string[] }>, commitSha?: string, pushed: boolean, warnings: string[] }` so the caller can surface it.

### `auto-blogger/src/email.ts`
- Extend `sendArticleNotification` input with an optional `backfill?: BackfillSummary` field (and the equivalent for the news/blog notification path if present).
- New helper `backfillBlockHtml(summary)`:
  - Header line: `Backfill: added N internal links across M files <commit-sha?>`.
  - Per-file bullet list: relative path → comma-joined anchor texts of added links.
  - If `pushed === false`, render a warning row: `Auto-push failed; commit is local on the runner.`
  - If `warnings.length > 0`, render them under a `Backfill warnings` subheading.
- Mirror the same block in `buildText` for plain-text recipients.
- When `backfill` is undefined or `filesChanged === 0`, render `Backfill: no changes` (one line) so the recipient knows the step ran.

### `auto-blogger/src/importFromS3.ts`
- Thread the `BackfillSummary` through to whatever notification path the import emits. If the import step does not currently send mail directly, attach the summary to the next per-article email so each new article's notification shows the backfill it triggered. If multiple articles imported in one run, send a single summary email (or attach the same summary to each per-article email — pick the simpler wiring at implementation time).

### `auto-blogger/package.json`
- Add `"bootstrap-link-keywords": "tsx src/bootstrapLinkKeywords.ts"`.

## Safety Rules (enforced in `backfillInternalLinks.ts`)

- Never insert inside fenced code, inline code, an existing markdown link anchor, a table cell, or frontmatter.
- Never add a second link to a URL the file already links to.
- Never reuse an anchor phrase already used in the file.
- Never add a link that would push `internal + external` above `ceiling`.
- Never modify the article the link points to.
- Per-file change limit: `min(remaining_budget, 2)` added links per backfill run.

## Rollout

1. Ship density rule + `linkKeywords` generation (no backfill yet). Verify a few new articles emit clean keywords and the budget validator behaves.
2. Run `bootstrap-link-keywords` against `website/content/topics/`. Manual spot-check 5–10 random files; commit the result as a single bootstrap commit.
3. Enable backfill in `importFromS3` with auto-push. Run on the next scheduled import. Inspect the squashed commit on the remote.
4. Monitor: count of links added per run, count of files touched, validator regression rate. If a post grows more than +2 links across 3 runs, lower per-file change limit.

## Out of Scope

- Backfilling external (research) links.
- Embedding-based candidate ranking (lexical hits + cluster proximity is sufficient at current corpus size).
- Removing existing internal links that point at now-deleted articles (separate cleanup task).
- Anchor-text rewriting on pre-existing internal links.
