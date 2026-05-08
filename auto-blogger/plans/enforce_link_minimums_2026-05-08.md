# Plan: Enforce ≥3 Internal and ≥3 External Links via Placeholder Substitution

## Context

We still see `Article should cite at least one external source when statistics/data research is available.` in generated-article emails despite the recent remediation pass in `generateArticle.ts:225`. Two failure modes:

1. **Remediation undershoots**: existing pass triggers only when external links == 0. If the draft has 1–2 external links, no remediation runs.
2. **Remediation produces 0 links**: when the rewrite returns a body that *still* has zero `](https://...)` matches, we fall back to the original draft and the warning re-appears.

There is also no enforcement on internal-link count.

A more pragmatic root-cause fix than asking the model to retype URLs reliably: **let the model emit placeholder tokens and substitute the real URLs server-side**. This mirrors the existing `{{DIAGRAM:id}}` mechanism and removes whole classes of bugs (URL mistyping, escape errors, `/topics/` prefix drift) while making validation a deterministic substring count.

## Goal

Every generated topic article must have **≥3 inline internal links** and **≥3 inline external links** in the published body. The model is responsible for choosing where citations belong and what anchor text to use; the pipeline is responsible for resolving placeholder ids to URLs.

## Placeholder format

- **Internal**: `{{LINK:<slug>|anchor text}}` — `<slug>` is a stable id from the candidate list. Resolves to `[anchor text](<url>)`.
- **External**: `{{SRC:<n>|anchor text}}` — `<n>` is the 1-based index into the research source list. Resolves to `[anchor text](<source url>)`.

Both formats use `|` as the anchor delimiter. Anchor text may contain spaces and punctuation but not `}}` or `|`.

## Files to Create

### `auto-blogger/src/applyLinkPlaceholders.ts`

New module, parallel in shape to `applyDiagrams.ts`:

```ts
export type LinkResolutionResult = {
  body: string;
  internalLinkCount: number;     // resolved {{LINK:...}} placeholders
  externalLinkCount: number;     // resolved {{SRC:...}} placeholders
  warnings: string[];            // unknown slugs / out-of-range indexes
};

export function applyLinkPlaceholders(
  body: string,
  candidates: InternalLinkCandidate[],
  research: ResearchResult[]
): LinkResolutionResult;
```

Behaviour:

- Build two lookup maps once: `slug → url` (from candidates, see "Candidate id derivation" below) and `index → url` (1-based, from `research`).
- Replace every `{{LINK:<slug>|<anchor>}}` with `[<anchor>](<url>)` if known; if unknown, drop the placeholder (replace with bare anchor text, no link) and append a warning. Same for `{{SRC:<n>|<anchor>}}`.
- Count successful resolutions (not raw placeholder count) so validators reflect what actually shipped.
- Return the rewritten body, counts, and warnings.

#### Candidate id derivation

`InternalLinkCandidate.slug` is optional today (only set for articles). For hubs/clusters it's missing. To give every candidate a stable id, derive it inside `applyLinkPlaceholders` (and inside the prompt summariser, so the model sees the same ids):

| `type`    | derived id                          | resolved URL                                    |
| --------- | ----------------------------------- | ----------------------------------------------- |
| `hub`     | `hubSlug`                           | `/topics/${hubSlug}`                            |
| `cluster` | `${hubSlug}__${clusterSlug}`        | `/topics/${hubSlug}/${clusterSlug}`             |
| `article` | `slug` (already unique per article) | candidate `url` field (full `/topics/...` path) |

We use `__` as the cluster separator because it can't appear in a slug.

## Files to Modify

### `auto-blogger/src/generateArticle.ts`

#### 1. Prompt: switch the link instructions to placeholders

Replace the bullets that describe internal/external link composition with placeholder-format instructions. The CRITICAL block becomes:

> 1. CITATIONS: To cite a research source, emit `{{SRC:<n>|<anchor text>}}` inline at the sentence where you reference that source's claim. `<n>` is the source's number from the research list below. The body MUST contain **at least 3** `{{SRC:` tokens (aim for 4–6).
> 2. INTERNAL LINKS: To link to existing site content, emit `{{LINK:<id>|<anchor text>}}` inline. `<id>` is the id from the internal-link candidate list below. The body MUST contain **at least 3** `{{LINK:` tokens (aim for 4–8).
> 3. DIAGRAM SYNCHRONIZATION: (unchanged)

The verification checklist at the end becomes:

> (a) Does the body contain at least 3 `{{SRC:` substrings? If not, add inline citations using ids from the source list.
> (b) Does the body contain at least 3 `{{LINK:` substrings? If not, add inline internal links using ids from the candidate list.
> (c) For each diagram `id` in your diagrams array, does the body contain `{{DIAGRAM:` + id + `}}`? If not, add the placeholder or remove the diagram.

#### 2. Update the prompt summarisers to surface ids

`summarizeInternalLinks` (`generateArticle.ts:78-91`) currently shows title + URL + topic. Change it to show `id | title | hub/cluster context` (no URLs — the model doesn't need them anymore):

```
Available internal-link ids (use as <id> in {{LINK:<id>|anchor}}):
- capture-css-from-figma | "Capture CSS from Figma" | figma / css-extraction
- figma__css-extraction  | "CSS Extraction" cluster | figma
- figma                  | "Figma" hub
```

`summarizeResearch` (`generateArticle.ts:68-76`) needs each source numbered explicitly so the model can reference by index. The list is already enumerated (`Source ${idx + 1}`); also add the index in a directly copy-paste-friendly form (`Use {{SRC:1|...}} to cite this source.`).

`sourceUrlList` (`generateArticle.ts:137-139`) is no longer needed in the draft prompt — the model never sees raw URLs. Drop it from the draft prompt body. Keep the in-memory `research` array for the substitution step.

#### 3. Replace the citation-only remediation with a placeholder-floor remediation

Current code at `generateArticle.ts:220-247` only fires on zero externals. Replace with a single combined pass that runs when **either** placeholder count is below 3 in the raw draft body (count `{{LINK:` and `{{SRC:` substrings, *before* substitution).

```ts
const MIN_INTERNAL = 3;
const MIN_EXTERNAL = 3;

const countTokens = (body: string, prefix: string) =>
  (body.match(new RegExp(`\\{\\{${prefix}:`, "g")) ?? []).length;

let workingBody = draft.object.body.trim();
const initialInternal = countTokens(workingBody, "LINK");
const initialExternal = countTokens(workingBody, "SRC");

const needsRemediation =
  (initialInternal < MIN_INTERNAL && input.internalLinkCandidates.length > 0) ||
  (initialExternal < MIN_EXTERNAL && input.research.length > 0);

if (needsRemediation) {
  const rewrite = await generateText({
    model,
    system,
    prompt: buildLinkRemediationPrompt({
      body: workingBody,
      internalShortfall: Math.max(0, MIN_INTERNAL - initialInternal),
      externalShortfall: Math.max(0, MIN_EXTERNAL - initialExternal),
      internalLinksSummary,
      researchSummary,
    }),
    maxTokens: DRAFT_MAX_OUTPUT_TOKENS,
  });
  const rewritten = rewrite.text.trim();
  if (
    countTokens(rewritten, "LINK") >= MIN_INTERNAL &&
    countTokens(rewritten, "SRC") >= MIN_EXTERNAL
  ) {
    workingBody = rewritten;
  }
  tokenUsage.inputTokens += rewrite.usage?.promptTokens ?? 0;
  tokenUsage.outputTokens += rewrite.usage?.completionTokens ?? 0;
}
```

The remediation prompt is shorter than today's because it doesn't have to convey URL-formatting rules — the placeholder syntax already encapsulates them. It should:

- State both shortfalls explicitly.
- Re-include `internalLinksSummary` and `researchSummary` so the model knows which ids to pick.
- Forbid changing structure (headings, tables, FAQ rules, diagram placeholders, existing placeholders).
- Output ONLY the rewritten markdown body.

#### 4. Substitute placeholders before returning the article

After the remediation block, run `applyLinkPlaceholders(workingBody, input.internalLinkCandidates, input.research)` and use the resolved body as `article.body`. Capture warnings and surface them via the existing `qualityWarnings` channel (or via a separate side-channel — see "Validator integration" below).

The orphan-diagram filter (`generateArticle.ts:213-217`) continues to operate on `workingBody` *before* link substitution — diagram placeholders are unaffected by this change.

### `auto-blogger/src/quality.ts`

#### 5. Floor checks on resolved markdown links

After `applyLinkPlaceholders` substitutes, the body contains real markdown links again, so the existing regex approach still works. Replace the current `quality.ts:68-70` rule with two unconditional floor checks:

```ts
const internalLinkCount = (article.body.match(/\]\(\/topics\//g) ?? []).length;
const externalSourceLinkCount = (article.body.match(/\]\(https?:\/\//g) ?? []).length;

if (externalSourceLinkCount < 3) {
  issues.push(
    `Article has only ${externalSourceLinkCount} external citation${externalSourceLinkCount === 1 ? "" : "s"}; minimum is 3.`
  );
}
if (internalLinkCount < 3) {
  issues.push(
    `Article has only ${internalLinkCount} internal link${internalLinkCount === 1 ? "" : "s"}; minimum is 3.`
  );
}
```

Drop the old "≥1 external when statistics present" rule — it's a strict subset.

The existing `internalLinkCount > 10` ceiling (`quality.ts:64-66`) stays.

The `research` parameter stays in the signature (still used by other rules elsewhere if any; remove only the rule body).

### Validator integration of `applyLinkPlaceholders` warnings

Pass the warnings from `applyLinkPlaceholders` (unknown slugs, out-of-range source indexes) into the existing `qualityWarnings` array assembled in `index.ts:62-66`. They show up in the email so a human can spot a hallucinated id.

## Cost / Token Comparison

| | Today | After |
| ------- | ----- | ----- |
| Draft body output per link | ≈10–18 tokens (full URL inline) | ≈5–8 tokens (`{{LINK:slug\|anchor}}`) |
| Draft prompt: source URL block | ~80–120 tokens | dropped (model reads numbered list only) |
| Remediation pass | almost always fires when external links < target; rewrites whole body with URL handling rules | only fires when `{{LINK:` / `{{SRC:` count below floor; smaller prompt, smaller rewrite |
| URL hallucination class of bugs | possible | impossible (substitution layer owns URL strings) |
| Validator | regex on rendered markdown | unchanged regex (placeholder substitution happens upstream) |

Net: small per-token savings on draft, larger savings from remediation firing less often and being shorter when it does, plus removal of an entire bug class.

## What we deliberately do NOT do

- **No retry loop** — single remediation pass is enough; if it still fails we ship with a quality warning.
- **No hard pipeline failure** — keep the existing "warn and continue" pattern.
- **No new validator on raw `{{LINK:`/`{{SRC:` tokens** — by the time `validateArticleQuality` runs, substitution has already converted them to real markdown links. One source of truth.
- **No retroactive migration of existing topics** — only new generations use placeholders.

## Implementation Order

1. **`applyLinkPlaceholders.ts`** — write the substitution module + unit-style smoke test (run in dry-run with a fake body).
2. **`generateArticle.ts`** — update `summarizeInternalLinks` + `summarizeResearch` to expose ids, swap the prompt instructions to placeholder format, drop `sourceUrlList` from the draft prompt, replace the remediation pass, plug `applyLinkPlaceholders` in before returning the article.
3. **`quality.ts`** — replace the citation rule with two floor checks.
4. **`index.ts`** — no changes expected; `applyLinkPlaceholders` lives inside `generateTopicArticle` so the article handed to `applyDiagramsToArticle` already has resolved markdown.

## Verification

```bash
cd auto-blogger && npm run build

# Smoke-test the substitution in isolation.
node -e "
import('./dist/applyLinkPlaceholders.js').then(m => {
  const r = m.applyLinkPlaceholders(
    'See {{LINK:capture-css|how to capture}} and {{SRC:1|recent study}}.',
    [{ slug: 'capture-css', url: '/topics/figma/css-extraction/capture-css', title: 't', type: 'article', hubSlug: 'figma', hubTitle: 'F', clusterSlug: 'css-extraction', clusterTitle: 'C', topic: 'x' }],
    [{ url: 'https://example.com/study', title: 's', snippet: '' }]
  );
  console.log(r.body);
  console.log('internal:', r.internalLinkCount, 'external:', r.externalLinkCount);
});
"

# Full dry-run.
AUTO_BLOG_DRY_RUN=true AUTO_BLOG_MODE=once node dist/index.js
# In dry-runs/<artifactId>/article.md:
#   grep -oE '\]\(/topics/'   article.md | wc -l   # expect ≥ 3
#   grep -oE '\]\(https?://'  article.md | wc -l   # expect ≥ 3
#   grep -E   '\{\{(LINK|SRC):' article.md         # expect 0 — substitution should leave none
```

Confirm in three consecutive dry-runs that no `Article has only N external citations` or `Article has only N internal links` warnings appear in the email body, and no leftover `{{LINK:` / `{{SRC:` tokens survive into the final article.

<!-- mirror-plan-to: auto_blogger_2026-05-08T08:00:00Z.md -->
