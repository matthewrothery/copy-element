---
title: Migrate auto-blogger to AWS Lambda and extract a project-agnostic reusable package
status: Planned
created: 2026-05-17
owner: matt
area: cross-cutting
tags: [infra, migration, refactor]
---

# Migrate auto-blogger to AWS Lambda and extract a project-agnostic reusable package

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

> Status colours: `Planned` blue, `In progress` yellow, `Completed` brightgreen, `On hold` orange, `Deprecated` red. Update the badge alongside the front-matter `status` field.

## Context

The auto-blogger runs today as one-shot Docker containers fired by `systemd` timers on the prod EC2 host (per the now-deployed plan `plans/active/2026-05-14-ec2-stability-auto-blogger-offload.md`). It uses a `/data` bind-mount for `auto-blogger-state.json` + a PID lock, generates topic articles at four staggered Sydney times (`09:30, 11:30, 13:30, 15:30`) and one news post at `10:00`, then stages artifacts in S3 for the GitHub Actions importer to pull into the website repo. Brand identity (`Element Armory – Capture UI Elements`), the news-query list, the relevance regex, the user-agent strings, the list/guide/rules/copywriter markdown paths, and the output S3 bucket are all hardcoded against this single project.

Two things change with this plan:

1. **Substrate move to Lambda.** Each cycle becomes a single Lambda invocation that runs all four article generations in parallel via `Promise.all`. The news cycle becomes a second Lambda on its own EventBridge schedule. State moves from a filesystem JSON to a DynamoDB on-demand table with conditional writes (atomic keyword claiming for parallel-safe selection). The on-host `/data` mount, the PID lock, and every `systemd` timer artifact go away. Cost falls to ≈ $0/month (Lambda free tier covers ~30 invocations × ≤ 15 minutes; DynamoDB on-demand at this volume is below the always-free band).
2. **Project-agnostic package extraction.** Every Element-Armory-specific value is lifted into a single `./auto-blogger.config.ts` at the consuming repo's root. The `auto-blogger/` directory becomes a vendor-copyable unit: a sibling project clones the directory, writes its own config file, and gets the same Lambda deployment shape via its own terraform. The `copywriter-prompt.md` ships as the bundled default with an override path. Three new interfaces (`StateStore`, `ContentRepository`, `OutputAdapter`) draw clean seams between project-specific concerns and the generation core.

The previously-active plan is fully superseded; its swap + `mem_limit` changes (Phase 1) stay because they continue to benefit the remaining server, mcp, and nginx containers.

## Requirements & constraints

- **REQ-001** Topic-article cadence after migration matches today's pattern (4 articles per weekday by default; one news post per day). No missed days during cutover. No duplicate slug published.
- **REQ-002** The four topic articles in a single daily run execute in parallel inside one Lambda invocation via `Promise.all` (not staggered, not fan-out).
- **REQ-003** State (which keywords/slugs are already taken) is read and updated atomically across the parallel pipelines so two simultaneous picks cannot collide.
- **REQ-004** All Element-Armory-specific values move out of `auto-blogger/src/*` into a single `./auto-blogger.config.ts` at the repo root. No `grep -r "Element Armory" auto-blogger/src` match after the refactor (excluding `copywriter-prompt.md` if mentioned there, which is acceptable as a default-bundled asset).
- **REQ-005** Copying `auto-blogger/` to another project + adding an `auto-blogger.config.ts` is sufficient to run it locally and deploy it as Lambda in the target project's terraform.
- **REQ-006** Two Lambda functions (`element-armory-auto-blogger-topics`, `element-armory-auto-blogger-news`) on two EventBridge Scheduler entries: topics at `09:00 Australia/Sydney`, news at `10:00 Australia/Sydney`. Per-function timeout 15 min, memory 1024 MiB (revisit per measured peak).
- **REQ-007** One digest email per Lambda run summarising every generated artifact (cover thumbnail, token usage, cost, quality warnings) — replaces the per-article email today.
- **REQ-008** The artifact format on S3 (`pending/<artifactId>/article.md`, `cover.<ext>`, `metadata.json`, `research.json`) and the importer flow (`importFromS3.ts`, `import-auto-blog-content.yml`) are unchanged. Backfill of internal links continues to run on the importer side.
- **REQ-009** All deployed EC2 systemd-timer infra is removed: `auto-blogger@.service`, `auto-blogger-topics.timer`, `auto-blogger-news.timer`, the `install_auto_blogger_timers` SSM association, the `auto-blogger` block in `auto_blogger_env_file`, and the unused `enable_auto_blogger_timers` variable.
- **CON-001** Lambda zip package + esbuild bundle, not container image. Stay under the 250 MiB unzipped (50 MiB zipped) limit. Container image is the documented fallback if bundle size grows past the limit (RISK-001).
- **CON-002** No managed services beyond Lambda + EventBridge Scheduler + DynamoDB on-demand + CloudWatch Logs + the existing S3 buckets and SES configuration. No Step Functions, no SQS, no Secrets Manager.
- **CON-003** Secrets reach Lambda as plain function env vars set by terraform from existing `var.anthropic_api_key`, `var.gemini_api_key`, `var.openai_api_key` (already in `terraform/variables.tf`).
- **CON-004** Two handler exports (`topicsHandler`, `newsHandler`) at the package's Lambda entry point — not a single handler dispatching on env var. Local CLI invocation (`npm run dev`, `npm start`) preserves the `AUTO_BLOG_TARGET` env-var path for parity with existing dev flow.
- **CON-005** The website CI must publish an `internal-links.json` manifest to the existing auto-blog S3 bucket on each website deploy. No scraping of `sitemap.xml`; no separate API.
- **GUD-001** Root `CLAUDE.md` Global Coding Standards: TypeScript only, named exports, no `any`, files < 300 lines, functional code (no classes), camelCase / PascalCase / UPPER_CASE naming.
- **GUD-002** Database conventions: any timestamp persisted (DynamoDB items, S3 metadata, in-state fields) uses epoch milliseconds (`Date.now()`), not ISO strings.
- **GUD-003** `auto-blogger/` is server-side TypeScript only — no React, no CSS, no Tailwind concerns.
- **PAT-001** Reuse existing terraform module structure (`terraform/*.tf` flat, per-resource files). New file: `terraform/lambda.tf`. Variables added to `terraform/variables.tf`. Outputs to `terraform/outputs.tf` if external systems need them.
- **PAT-002** Reuse `aws_iam_role` + `aws_iam_role_policy` shape from `terraform/iam.tf` (jsonencode bodies, project + normalized_env naming).
- **PAT-003** Existing GitHub Actions `.github/workflows/deploy-apps.yml` is extended (or a parallel `deploy-lambda.yml` is added) to build the Lambda zip and update the Lambda function on `auto-blogger/**` push to `master`. The existing `build_auto_blogger` Docker step is removed.
- **PAT-004** Existing artifact shape (`ArticleArtifact`, `ArticleArtifactMetadata`, `metadata.assets[]`) is unchanged — guarantees importer compatibility.
- **SEC-001** Lambda env vars contain secrets; the function execution role is least-privilege (DynamoDB read/write scoped to the project's table; S3 PutObject scoped to `auto-blog/<prefix>/*`; SES SendEmail scoped to the configured `from` identity; CloudWatch Logs).
- **SEC-002** DynamoDB table name namespaced per project (`{project}-{env}-auto-blogger-state`) so a vendored copy in another project cannot collide.

## References

- Internal docs: `./CLAUDE.md` (root), `./auto-blogger/README.md`, `./terraform/README.md`, `./server-setup.md`.
- Source files inspected: `auto-blogger/src/index.ts`, `auto-blogger/src/config.ts`, `auto-blogger/src/state.ts`, `auto-blogger/src/lock.ts`, `auto-blogger/src/scheduler.ts`, `auto-blogger/src/topics.ts`, `auto-blogger/src/internalLinks.ts`, `auto-blogger/src/generateArticle.ts`, `auto-blogger/src/generateNewsArticle.ts`, `auto-blogger/src/newsSearch.ts`, `auto-blogger/src/research.ts`, `auto-blogger/src/s3.ts`, `auto-blogger/src/email.ts`, `auto-blogger/src/generateImage.ts`, `auto-blogger/src/artifact.ts`, `auto-blogger/src/importFromS3.ts`, `auto-blogger/src/types.ts`, `auto-blogger/Dockerfile`, `auto-blogger/package.json`, `auto-blogger/copywriter-prompt.md`, `auto-blogger/list.md`, `auto-blogger/rules.md`, `auto-blogger/guide.md`, `terraform/ec2.tf`, `terraform/iam.tf`, `terraform/variables.tf`, `terraform/templates/systemd/*`, `.github/workflows/deploy-apps.yml`.
- Active plan superseded: `plans/active/2026-05-14-ec2-stability-auto-blogger-offload.md` (mark **Deprecated** as part of TASK-707).
- External docs:
  - [AWS Lambda Node.js runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
  - [AWS Lambda zip deployment limits](https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-limits.html)
  - [EventBridge Scheduler cron + timezone](https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html#cron-based)
  - [DynamoDB conditional writes](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.ConditionExpressions.html)
  - [esbuild bundling for Lambda](https://esbuild.github.io/api/)

## Active plans affected

- `plans/active/2026-05-14-ec2-stability-auto-blogger-offload.md` — fully superseded by this plan. Phase 1 (swap + `mem_limit`s) stays in place because it benefits the remaining `server`, `mcp`, and `nginx` containers. Phase 2 (systemd timer install, `AUTO_BLOG_TARGET` union, lock acquisition) is **rolled back** by Phase 6 of this plan and the deprecated-plan file is moved to `plans/complete/` with a status note (TASK-707) — not via `/plan-done`, because the work is being reversed rather than finished.

## Docs to update on completion

- `auto-blogger/README.md` — rewrite the "Required Production Env" + "how this runs in prod" sections: Lambda topics + news handlers, DynamoDB state, env vars, the `auto-blogger.config.ts` shape, how to copy to another project.
- Root `CLAUDE.md` — add a one-line note under Database Conventions (or new "Auto-blogger" subsection) pointing at the Lambda topology and the `auto-blogger.config.ts` location.
- `ARCHITECTURE.md` if present (none in repo today — skip; otherwise add an "Auto-blogger Lambda" section).
- `terraform/README.md` — document the new `lambda.tf`, the DynamoDB table, the EventBridge schedules, and how to disable a Lambda via a new bool variable (`enable_auto_blogger_lambdas`).
- `plans/active/2026-05-14-ec2-stability-auto-blogger-offload.md` — set front-matter `status: Deprecated`, update badge colour to red, add a deprecation note pointing here, then move to `plans/complete/`.
- New file: `auto-blogger/PORTING.md` (or a "Copying to another project" section in `auto-blogger/README.md`) — step-by-step for a sibling project (config file shape, terraform variables to add, IAM scope, EventBridge schedule, manifest publisher in the consumer's website CI).

## Data & API design

### DynamoDB table

Table name: `${project}-${normalized_env}-auto-blogger-state` (e.g. `element-armory-prod-auto-blogger-state`). Pay-per-request billing. Composite-key design (HASH + RANGE) so `Query` works for bucketed reads.

| Attribute      | Type | Notes                                                                                                |
|----------------|------|------------------------------------------------------------------------------------------------------|
| `pk` (HASH)    | S    | Bucket: literal `KEYWORD`, `SLUG`, `EMAIL_FAIL`, or `META`. Required so `Query` can scope by bucket.|
| `sk` (RANGE)   | S    | Within-bucket identifier: keyword id, slug string, artifact id, or fixed `last_run`.                |
| `claimedAt`    | N    | Epoch ms (`Date.now()`). Set on creation. **GUD-002**.                                              |
| `claimedBy`    | S    | Lambda request ID (for debugging which run took the slot).                                          |
| `articleSlug`  | S    | On `pk=KEYWORD` items, the slug produced by this keyword (denormalised — enables fast existence check). |
| `cycle`        | S    | `topics` or `news`.                                                                                  |
| `ttl`          | N    | **Epoch SECONDS** (DynamoDB TTL hard requirement — NOT ms). Set on `pk=EMAIL_FAIL` items only (90-day retention). The plan-wide GUD-002 rule (epoch ms everywhere) has this single exception, scoped to the `ttl` attribute. `claimedAt` remains ms. Items in `pk=KEYWORD` and `pk=SLUG` persist forever (no TTL set). |

Atomic keyword claim:
- `PutItem` with `ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"` on `pk=KEYWORD, sk=<id>` plus `claimedAt: Date.now()`, `claimedBy: <requestId>`, `cycle: "topics"`. On `ConditionalCheckFailedException` retry with the next candidate keyword. Loop within a single Lambda's `Promise.all` worker to find N unclaimed keywords.
- Slug write is a second `PutItem` after the article is staged in S3, with `pk=SLUG, sk=<slug>` and the same `attribute_not_exists` guard. Conflict → quality warning logged + email flagged (rare; previous staged drafts already cover this).
- Bucketed reads use `Query` with `KeyConditionExpression: "pk = :p"` (e.g. `:p = "KEYWORD"`), paginated. **Do NOT** attempt `begins_with(pk, ...)` on the HASH key — DynamoDB disallows `begins_with` on the partition key. The bucket-as-pk design above is exactly what avoids that pitfall.

### Lambda handler API

```ts
// auto-blogger/src/lambda.ts
export const topicsHandler: Handler<ScheduledEvent, void>;
export const newsHandler: Handler<ScheduledEvent, void>;
```

- Each handler loads `auto-blogger.config.ts` (bundled at build time via esbuild), instantiates `StateStore` / `ContentRepository` / `OutputAdapter` from the config, runs the cycle, and returns. Failures rethrow so EventBridge marks the invocation failed (CloudWatch metric + standard Lambda alarms).

### `auto-blogger.config.ts` shape (vendor-facing contract)

```ts
import type { AutoBloggerProjectConfig } from "./auto-blogger/src/projectConfig.js";

const config: AutoBloggerProjectConfig = {
  brand: {
    productName: "Element Armory – Capture UI Elements",
    shortName: "Element Armory",
    tagline: "Capture UI from any site and rebuild it with AI.",
    voice: "developer-focused, technical but clear, minimal, confident",
    unshippedFeatureClaims: [
      "JSX export is currently available",
      "Tailwind output is currently available",
    ],
  },
  content: {
    listPath: "./auto-blogger/list.md",
    guidePath: "./auto-blogger/guide.md",
    rulesPath: "./auto-blogger/rules.md",
    copywriterPromptPath: "./auto-blogger/copywriter-prompt.md", // defaults to bundled
  },
  news: {
    queries: ["vibe coding AI", "AI UI tools", "AI frontend tools", "AI coding agents"],
    relevanceKeywords: ["ai", "vibe cod", "coding agent", "frontend", "developer", "design system", "ui tool", "cursor", "windsurf", "claude code"],
    excludeKeywords: ["one ui", "galaxy", "samsung", "android update", "smartphone"],
    excludedDomains: ["youtube.com", "reddit.com", "pinterest.com", "amazon.com", "facebook.com", "twitter.com", "x.com", "tiktok.com"],
    userAgent: "Mozilla/5.0 (compatible; ElementArmoryAutoBlogger/1.0; +https://elementarmory.com)",
  },
  contentRepository: {
    type: "s3-manifest",
    bucket: process.env.AUTO_BLOG_S3_BUCKET!,
    manifestKey: "manifests/element-armory/internal-links.json",
  },
  output: {
    type: "s3-staging",
    bucket: process.env.AUTO_BLOG_S3_BUCKET!,
    prefix: "auto-blogger",
    notify: {
      mode: "digest",
      to: process.env.AUTO_BLOG_NOTIFY_TO!,
      from: process.env.AUTO_BLOG_NOTIFY_FROM!,
    },
  },
  stateStore: {
    type: "dynamodb",
    tableName: process.env.AUTO_BLOG_STATE_TABLE!,
    region: process.env.AWS_REGION!,
  },
};

export default config;
```

### Internal-link manifest shape (`s3://auto-blog/manifests/<project>/internal-links.json`)

```json
{
  "generatedAt": 1747440000000,
  "websiteRoot": "elementarmory.com",
  "candidates": [
    {
      "title": "...",
      "topic": "...",
      "url": "/topics/...",
      "type": "article",
      "hubSlug": "...",
      "hubTitle": "...",
      "clusterSlug": "...",
      "clusterTitle": "...",
      "slug": "...",
      "linkKeywords": ["..."]
    }
  ],
  "publishedKeywordIds": ["copy-ui-from-websites/copy-css-from-website/how-to-copy-css-from-any-website"]
}
```

The manifest matches the existing in-memory shape returned by `loadInternalLinkCandidates()` + `loadPublishedListKeywordIds()` so the only swap is the data source, not the consumer code paths in `generateArticle.ts` / `generateNewsArticle.ts`.

## Architecture decisions

- **DEC-001 — Lambda topology: single Lambda per cycle, in-process `Promise.all`.** Rejected: orchestrator fan-out (more IAM, two Lambda layers, harder digest email) and SQS fan-out (DLQ overkill at 4 articles/day). For 4 articles each ~90–180 s, in-process parallel I/O fits the 15-min cap with margin.
- **DEC-002 — Two Lambdas, two EventBridge schedules.** Rejected: one combined daily Lambda (couples topics and news budgets; can't disable independently). Confirmed via interview.
- **DEC-003 — DynamoDB on-demand for state.** Rejected: S3 JSON with ETag CAS (in-process parallel claim still needs in-memory coordination; less idiomatic for atomic single-row writes) and server-API coupling (introduces server-availability dependency).
- **DEC-004 — Vendor-copy reusability model (no npm package, no submodule).** Decided. `auto-blogger/` is a directory you copy; `auto-blogger.config.ts` is the only per-project file at the consuming repo's root. Confirmed via interview.
- **DEC-005 — Zip + esbuild Lambda deployment.** Rejected: container image (5–15 s cold start; larger image registry surface; new ECR repo). Documented fallback: switch to container image if bundle exceeds 250 MiB unzipped (RISK-001).
- **DEC-006 — Two handler exports, not one dispatching on `AUTO_BLOG_TARGET`.** Clearer Lambda config, no env-var ambiguity. CLI (`npm run dev`) keeps the existing env-var path for local dev parity.
- **DEC-007 — Plain Lambda env vars for secrets.** Rejected: Secrets Manager (~$2/mo, rotation not needed), SSM Parameter Store SecureString (extra cold-start fetch). Existing `var.*_api_key` plumbing in terraform reused as-is.
- **DEC-008 — Internal-link candidates published as S3 JSON manifest by website CI.** Rejected: backfill-only (loses inline linking in first-draft articles, weaker SEO signal), sitemap scrape (lossy — no `linkKeywords`, fragile). Each consuming project publishes its own manifest under `manifests/<project>/`.
- **DEC-009 — One digest email per Lambda run.** Rejected: per-article email (5 emails/day noise). The digest contains thumbnails, token usage, quality warnings, and per-article markdown previews.
- **DEC-010 — `copywriter-prompt.md` ships bundled in the package as the default; `content.copywriterPromptPath` in config can override.** Treats it as the "essential won't change" asset per the user's stated intent while keeping the door open for projects that want a different voice.
- **DEC-011 — Lock semantics removed.** `lock.ts` deleted. Atomic DynamoDB conditional writes on `KEYWORD#<id>` replace the PID lock; Lambda invocations are intrinsically isolated.
- **DEC-012 — DAILY_ARTICLES stays at 4.** No change to publishing cadence; the env-var-driven knob is preserved for projects that want a different number.
- **DEC-013 — Tear down deployed systemd-timer infra entirely.** The earlier plan's Phase 1 swap + `mem_limit` changes stay in place (still benefit the remaining containers); everything Phase 2 added is removed in one terraform apply.
- **DEC-014 — `auto-blogger.config.ts` at repo root.** Not under `auto-blogger/projects/`. Each consuming repo has exactly one such file at its root; the auto-blogger package imports it via a relative path resolved at bundle time. Confirmed via interview.

## Phases

### Phase 1 — Extract project-agnostic config + interfaces (no behaviour change)

**Goal (GOAL-001):** Lift every Element-Armory-specific value into `./auto-blogger.config.ts` and define the three pluggable interfaces (`StateStore`, `ContentRepository`, `OutputAdapter`, plus `BrandConfig` / `NewsConfig` value types). No runtime behaviour change yet; the existing systemd/EC2 path keeps publishing daily.

| Task     | Description                                                                                                                                                                                                                                                                                                                                  | Done | Date |
|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------|------|
| TASK-101 | Create `auto-blogger/src/projectConfig.ts` with exported types: `AutoBloggerProjectConfig`, `BrandConfig`, `NewsConfig`, `ContentConfig`, `ContentRepositoryConfig` (discriminated union `s3-manifest` / `filesystem`), `OutputConfig` (discriminated union `s3-staging` / `local-write`), `StateStoreConfig` (discriminated union `dynamodb` / `filesystem`), `NotificationConfig` (`digest` / `per-article` / `none`). All scalars required; no `any`.            |      |      |
| TASK-102 | Create `./auto-blogger.config.ts` at the repo root with the current Element Armory values (brand block lifted from `generateArticle.ts:60-73` + `generateNewsArticle.ts:27-34`; news block lifted from `newsSearch.ts:4-30,128` + `research.ts:5`; content paths matching `auto-blogger/list.md` etc.; manifest key `manifests/element-armory/internal-links.json`).         |      |      |
| TASK-103 | Refactor `auto-blogger/src/config.ts`: keep `loadConfig()` for env-driven values (mode, dryRun, dailyArticles, image model/style/palette, schedule, model selection) but remove path-resolution for `listPath` / `guidePath` / `rulesPath` / `copywriterPromptPath` / `s3Bucket` / `s3Prefix` / `notifyTo` / `notifyFrom`. Those now come from `projectConfig`. Add `loadProjectConfig()`: it is a **static** `import projectConfig from "../../auto-blogger.config.js"` (a default export) so esbuild inlines the config at bundle time — no runtime filesystem resolution from inside the Lambda zip. From `auto-blogger/src/` the relative path is `../../auto-blogger.config` (resolves to repo-root `auto-blogger.config.ts` at TS compile and esbuild time; the `.js` suffix is required for NodeNext module resolution). For local dev (`npm run dev` via `tsx`), this static import works identically because `tsx` resolves the TS source from the same path. **No dynamic `import()`; no `path.resolve` against `import.meta.url`.** |      |      |
| TASK-104 | Refactor `auto-blogger/src/generateArticle.ts:60-73` — replace the hardcoded "Element Armory – Capture UI Elements" + "Never claim JSX export or Tailwind output" lines with `buildSystemPrompt(copywriterPrompt, guide, rules, brand)`. Brand-driven sentences are generated from `brand.productName`, `brand.voice`, `brand.unshippedFeatureClaims`.                                |      |      |
| TASK-105 | Refactor `auto-blogger/src/generateNewsArticle.ts:27-34` — replace `SYSTEM_PROMPT` constant with a function `buildNewsSystemPrompt(brand)` that interpolates `brand.productName`, `brand.voice`, `brand.unshippedFeatureClaims`. Call it once per `generateNewsArticle` invocation.                                                                                                  |      |      |
| TASK-106 | Refactor `auto-blogger/src/newsSearch.ts`: `NEWS_QUERIES`, `EXCLUDED_DOMAINS`, `USER_AGENT`, and the `isRelevantNewsItem` regex move out of module scope into parameters of `fetchNewsItems(limit, options)`. Build `relevanceRegex` + `excludeRegex` from `news.relevanceKeywords` + `news.excludeKeywords` at call time. Existing test `newsSearch.test.ts` updated to pass explicit config.                                  |      |      |
| TASK-107 | Refactor `auto-blogger/src/research.ts:5` — `USER_AGENT` becomes a parameter on `researchTopic(query, limit, userAgent)`. Update callers.                                                                                                                                                                                                                                              |      |      |
| TASK-108 | Create `auto-blogger/src/stateStore.ts` with `interface StateStore { claimKeyword(id: string, requestId: string): Promise<boolean>; recordSlug(slug: string): Promise<boolean>; loadProcessedKeywordIds(): Promise<Set<string>>; loadProcessedSlugs(): Promise<Set<string>>; recordEmailFailure(artifactId: string): Promise<void>; recordRun(timestamp: number): Promise<void>; }`. Filesystem implementation in `auto-blogger/src/stateStoreFilesystem.ts` wraps the existing `state.ts` logic (one-shot read + one-shot write per cycle) so EC2 dev parity is preserved.    |      |      |
| TASK-109 | Create `auto-blogger/src/contentRepository.ts` with `interface ContentRepository { loadCandidates(): Promise<InternalLinkCandidate[]>; loadPublishedKeywordIds(): Promise<Set<string>>; loadExistingBlogSlugs(): Promise<Set<string>>; }`. Filesystem implementation in `auto-blogger/src/contentRepositoryFilesystem.ts` wraps existing `internalLinks.ts` + `topics.ts` + the `loadExistingBlogSlugs` helper from `index.ts:30-38`. S3 manifest implementation deferred to Phase 4.   |      |      |
| TASK-110 | Create `auto-blogger/src/outputAdapter.ts` with `interface OutputAdapter { publish(artifact: ArticleArtifact): Promise<{ publishedAt: number; coverUrl?: string }>; notifyDigest(summary: DigestSummary): Promise<void>; notifyPerArticle(artifact: ArticleArtifact, tokenUsage: TokenUsage): Promise<void>; }`. S3+SES implementation in `auto-blogger/src/outputAdapterS3Ses.ts` wraps `uploadArtifactToS3` + `sendArticleNotification` + a new `sendDigestNotification` helper.                                |      |      |
| TASK-111 | Refactor `auto-blogger/src/index.ts` `runSingleCycle` / `runNewsCycle` to take `(config, projectConfig, stateStore, contentRepo, outputAdapter)` as injected dependencies. Daemon path keeps working for local dev. Behaviour identical to today; only seams change.                                                                                                                  |      |      |
| TASK-112 | Update `auto-blogger/Dockerfile` for the repo-root build context. **Two coupled changes:** (a) every existing `COPY` path inside the Dockerfile must gain the `auto-blogger/` prefix because the build context is now the repo root, not `./auto-blogger`. Specifically: `COPY package.json package-lock.json* ./` → `COPY auto-blogger/package.json auto-blogger/package-lock.json* ./`; `COPY . .` → `COPY auto-blogger/ ./` (with a `.dockerignore` at repo root excluding `node_modules`, `dist`, `.git`, `terraform/.terraform`, etc., to keep context-tar small); `COPY copywriter-prompt.md guide.md list.md rules.md ./` → `COPY auto-blogger/copywriter-prompt.md auto-blogger/guide.md auto-blogger/list.md auto-blogger/rules.md ./`. (b) add `COPY auto-blogger.config.ts ./auto-blogger.config.ts` so the local dev image (still used by `npm run dev` parity tests) can resolve the config. (c) flip GHA `.github/workflows/deploy-apps.yml:174` `context: ./auto-blogger` → `context: .` and `file: ./auto-blogger/Dockerfile`. Create `.dockerignore` at repo root if absent. Validate locally with `docker build -f auto-blogger/Dockerfile .` before pushing.        |      |      |
| TASK-113 | Add `auto-blogger/src/projectConfig.test.ts` — loads `./auto-blogger.config.ts`, asserts required fields are present and discriminated unions parse.                                                                                                                                                                                                                                 |      |      |
| TASK-114 | Add unit tests: `stateStoreFilesystem.test.ts` (claim → claim same id returns false; record slug works), `outputAdapterS3Ses.test.ts` (mock S3 + SES clients).                                                                                                                                                                                                                          |      |      |
| TASK-115 | Run `npm test` + `npm run typecheck` + `npm run build` in `auto-blogger/`. All pass.                                                                                                                                                                                                                                                                                                |      |      |
| TASK-116 | Commit and let GitHub Actions `deploy-apps.yml` build + push the new Docker image. The deployed EC2 systemd-timer path continues to run with the refactored code (still filesystem state, still per-article emails, no behaviour drift). Verify next scheduled topic run on the host completes successfully.                                                                  |      |      |

**Files touched (FILE-…):**
- `auto-blogger/src/projectConfig.ts` — new (types only).
- `./auto-blogger.config.ts` — new at repo root.
- `auto-blogger/src/config.ts` — narrowed scope, no path resolution.
- `auto-blogger/src/generateArticle.ts` — accept `brand` param.
- `auto-blogger/src/generateNewsArticle.ts` — accept `brand` param.
- `auto-blogger/src/newsSearch.ts` — accept news config object.
- `auto-blogger/src/research.ts` — accept user-agent param.
- `auto-blogger/src/stateStore.ts` — new interface.
- `auto-blogger/src/stateStoreFilesystem.ts` — new impl wrapping `state.ts`.
- `auto-blogger/src/contentRepository.ts` — new interface.
- `auto-blogger/src/contentRepositoryFilesystem.ts` — new impl wrapping `internalLinks.ts` + `topics.ts`.
- `auto-blogger/src/outputAdapter.ts` — new interface.
- `auto-blogger/src/outputAdapterS3Ses.ts` — new impl wrapping `s3.ts` + `email.ts` + new digest helper.
- `auto-blogger/src/index.ts` — DI wiring.
- `auto-blogger/Dockerfile` — build context change.
- `.github/workflows/deploy-apps.yml` — build context change.
- `auto-blogger/src/projectConfig.test.ts`, `auto-blogger/src/stateStoreFilesystem.test.ts`, `auto-blogger/src/outputAdapterS3Ses.test.ts` — new tests.

**Tests added in this phase:** the three listed above, plus updates to `newsSearch.test.ts`.

**Verify:**
- `npm run typecheck && npm test && npm run build` in `auto-blogger/` all pass.
- `grep -r "Element Armory" auto-blogger/src/` returns nothing (except possibly in test fixtures or `copywriter-prompt.md` if imported).
- After deploy, `journalctl -u auto-blogger@topics.service --since '1d ago'` on the EC2 host shows a successful run with the refactored code.

### Phase 2 — DynamoDB StateStore implementation

**Goal (GOAL-002):** Add the DynamoDB-backed `StateStore` implementation. EC2 path keeps using the filesystem implementation; this phase is pure addition, no swap.

| Task     | Description                                                                                                                                                                                                                                                                  | Done | Date |
|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------|------|
| TASK-201 | Add `@aws-sdk/client-dynamodb` and `@aws-sdk/lib-dynamodb` to `auto-blogger/package.json`. Run `npm install`.                                                                                                                                                                                                                  |      |      |
| TASK-202 | Create `auto-blogger/src/stateStoreDynamoDb.ts`: implements `StateStore` against the composite-key schema defined under **Data & API design**. `claimKeyword(id, requestId)` uses `PutItem` with `Key {pk: "KEYWORD", sk: id}` + `ConditionExpression: "attribute_not_exists(pk) AND attribute_not_exists(sk)"` + `claimedAt: Date.now()`. Returns `true` on success, `false` on `ConditionalCheckFailedException`. `recordSlug` mirrors the pattern with `pk: "SLUG", sk: slug`. `loadProcessedKeywordIds` / `loadProcessedSlugs` use `Query` with `KeyConditionExpression: "pk = :p"` (`:p = "KEYWORD"` or `"SLUG"`), paginated via `LastEvaluatedKey`. `recordEmailFailure` writes `pk: "EMAIL_FAIL", sk: artifactId, ttl: Math.floor(Date.now() / 1000) + 90 * 86400` (epoch seconds for TTL per the schema note). `recordRun` writes `pk: "META", sk: "last_run", claimedAt: Date.now()` as upsert. Use `@aws-sdk/lib-dynamodb` `DynamoDBDocumentClient` so attribute marshalling is automatic.        |      |      |
| TASK-203 | Update `auto-blogger/src/index.ts` keyword-selection loop: instead of `pickNextKeyword` returning a single keyword, call a new `pickAndClaimKeywords(allKeywords, used, stateStore, n)` that loops candidate picks, attempting `claimKeyword` until N successes or pool exhaustion. Guarantees no two parallel pipelines pick the same id.                                                              |      |      |
| TASK-204 | Add `auto-blogger/src/stateStoreDynamoDb.test.ts` — uses `@localstack/aws-sdk` or a small in-memory mock (existing pattern: `localstack/` dir in repo). Cover claim-then-reclaim returns false, list returns all claimed ids, slug uniqueness enforcement.                                                                                                                          |      |      |
| TASK-205 | Update the project config to use `stateStore.type = "dynamodb"` only when the matching env vars are present; fall back to filesystem when running under `npm run dev`. Document the switch in `auto-blogger/README.md` (in TASK-707, alongside the other doc updates).                                                                                                              |      |      |
| TASK-206 | Add new variables to `terraform/variables.tf`: `enable_auto_blogger_lambdas` (bool, default `false` — flipped to `true` in Phase 5 once verified). Add nothing else yet (table + Lambdas land in Phase 5).                                                                                                                                                                          |      |      |

**Files touched (FILE-…):**
- `auto-blogger/package.json`, `auto-blogger/package-lock.json` — new deps.
- `auto-blogger/src/stateStoreDynamoDb.ts` — new.
- `auto-blogger/src/stateStoreDynamoDb.test.ts` — new.
- `auto-blogger/src/index.ts` — `pickAndClaimKeywords` helper.
- `terraform/variables.tf` — `enable_auto_blogger_lambdas` flag.

**Tests added in this phase:** `stateStoreDynamoDb.test.ts` (in-memory or localstack-backed).

**Verify:**
- `npm test` in `auto-blogger/` passes including the new DynamoDB suite.
- Running `npm run dev` locally with `AUTO_BLOG_STATE_STORE=filesystem` (default) behaves identically to today.

### Phase 3 — Lambda handlers + esbuild bundle

**Goal (GOAL-003):** Add the two Lambda handler exports and the build pipeline that produces a deploy-ready zip. Nothing is deployed yet.

| Task     | Description                                                                                                                                                                                                                                                                                                | Done | Date |
|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------|------|
| TASK-301 | Create `auto-blogger/src/lambda.ts`: exports `topicsHandler` and `newsHandler`. Each loads `loadProjectConfig()` + `loadConfig()`, instantiates the DynamoDB `StateStore`, the S3 manifest `ContentRepository` (added in Phase 4 — for now use the filesystem stub that throws if used), the S3+SES `OutputAdapter`, and runs the equivalent of `runParallelTopics(n)` or `runNewsOnce()`.        |      |      |
| TASK-302 | Add `runParallelTopics(n, deps)` and `runNewsOnce(deps)` exports in `auto-blogger/src/index.ts`. `runParallelTopics` picks N keywords via `pickAndClaimKeywords`, then `Promise.allSettled` runs the existing `runSingleCycle` body (refactored to take a claimed keyword as input, not call `pickNextKeyword` itself). Aggregates results into a `DigestSummary` for `outputAdapter.notifyDigest`.                                       |      |      |
| TASK-303 | Replace per-article email send in `runSingleCycle` with a per-pipeline `ArticleResult` returned to the parent; the parent aggregates and calls `notifyDigest` once. Per-article email path remains available via `notify.mode = "per-article"` for local-dev parity.                                                                                                              |      |      |
| TASK-304 | Implement `sendDigestNotification` in `auto-blogger/src/email.ts` (or `outputAdapterS3Ses.ts`): one SES email with a thumbnail block per article (signed-URL cover), token usage totals, cost totals (extends `calcCostSummary`), quality warnings grouped by article, source URL list per article.                                                                                |      |      |
| TASK-305 | Add `auto-blogger/build.lambda.mjs`: an esbuild script that bundles `auto-blogger/src/lambda.ts` into `auto-blogger/dist/lambda/index.cjs` with `platform: "node"`, `target: "node22"`, `format: "cjs"`, `bundle: true`, `minify: true`, `external: ["@aws-sdk/*"]` (AWS SDK v3 is in the Lambda Node 22 runtime — keeps bundle small). Zip output to `auto-blogger/dist/lambda/lambda.zip` (esbuild script + `node:zlib`/`adm-zip` or shell `zip -r`).               |      |      |
| TASK-306 | Add npm script `build:lambda` (`node build.lambda.mjs`) and `package:lambda` (`npm run build:lambda && ls -lh dist/lambda/lambda.zip`). Verify the zip is well under 50 MiB compressed, under 250 MiB unzipped.                                                                                                                                                                       |      |      |
| TASK-307 | Add `auto-blogger/src/lambda.test.ts` — invokes `topicsHandler` against a fully-mocked DI bundle (mock StateStore, ContentRepository, OutputAdapter) and asserts the digest is built with the right shape.                                                                                                                                                                          |      |      |
| TASK-308 | Run `npm run build:lambda` locally; verify the bundle imports cleanly with `node -e "require('./auto-blogger/dist/lambda/index.cjs')"` (no missing externals, no native-binding errors). **Specifically validate**: (a) `jsdom` survives esbuild minify (known to inspect its own source — may need `external: ["jsdom"]` + bundled `node_modules/jsdom` shipped alongside in the zip, or `minify: false` for the jsdom subtree); (b) `@zhafron/mcp-web-search` (used transitively via the search path) does not spawn subprocesses or rely on a stdio MCP transport that Lambda cannot provide — if it does, replace with a direct HTTP call before Phase 5; (c) `@google/genai` and `@ai-sdk/anthropic` 1.2 dynamic requires resolve under the bundle. Record the final unzipped bundle size in the plan body or a comment in `build.lambda.mjs` (target: under 200 MiB; 250 MiB is the Lambda hard cap). If any of (a)/(b)/(c) cannot be made to work cleanly under zip, fall back to RISK-001 (container image deployment) — do NOT proceed to Phase 5 until the bundle is verified loadable.             |      |      |

**Files touched (FILE-…):**
- `auto-blogger/src/lambda.ts` — new.
- `auto-blogger/src/index.ts` — `runParallelTopics` / `runNewsOnce` exports.
- `auto-blogger/src/email.ts` (or `outputAdapterS3Ses.ts`) — `sendDigestNotification`.
- `auto-blogger/build.lambda.mjs` — new build script.
- `auto-blogger/package.json` — `build:lambda` script; `esbuild`, `adm-zip` devDeps.
- `auto-blogger/src/lambda.test.ts` — new.

**Tests added in this phase:** `lambda.test.ts`.

**Verify:**
- `npm run build:lambda` produces `auto-blogger/dist/lambda/lambda.zip`.
- `unzip -l auto-blogger/dist/lambda/lambda.zip | tail -1` reports unzipped size under 200 MiB (margin against 250 MiB cap).
- `node -e "const h = require('./auto-blogger/dist/lambda/index.cjs'); console.log(typeof h.topicsHandler, typeof h.newsHandler)"` prints `function function`.

### Phase 4 — S3-manifest ContentRepository + website CI manifest publisher

**Goal (GOAL-004):** Have the website CI publish `internal-links.json` to the auto-blog bucket, and have the auto-blogger Lambda consume it.

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                | Done | Date |
|----------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------|------|
| TASK-401 | Create `auto-blogger/src/contentRepositoryS3Manifest.ts` implementing `ContentRepository` against `s3://<bucket>/manifests/<project>/internal-links.json`. Reads once at construction, caches in-memory for the Lambda lifetime. Validates shape with a zod schema (`InternalLinkManifestSchema`).                                                                                                                                                                                       |      |      |
| TASK-402 | Add `auto-blogger/src/contentRepositoryS3Manifest.test.ts` — mock S3 client returning a fixture manifest, assert `loadCandidates` + `loadPublishedKeywordIds` shape.                                                                                                                                                                                                                                                                                                                       |      |      |
| TASK-403 | Add `website/scripts/publishInternalLinksManifest.ts` (TypeScript via `tsx`): walks `website/content/topics/` + `website/content/blog/` with the same logic as `auto-blogger/src/internalLinks.ts` and `auto-blogger/src/topics.ts` `loadPublishedListKeywordIds`. Writes JSON. Pushes to S3 via `@aws-sdk/client-s3` using the GitHub Actions deployer's existing creds + bucket. (**Reuses logic** — extract the walker into `auto-blogger/src/internalLinks.ts`'s exported helpers if not already exported, or duplicate the small walker in the script; do not import auto-blogger from website to avoid cross-package coupling.) |      |      |
| TASK-404 | Update `.github/workflows/deploy-website.yml`: add a final step after the website deploy that runs `node --import tsx website/scripts/publishInternalLinksManifest.ts` and uploads to `s3://${{ secrets.AUTO_BLOG_BUCKET }}/manifests/element-armory/internal-links.json`. (Reuses existing AWS credentials in the workflow; ensure the `github_actions_deployment` IAM policy in `terraform/iam.tf:160` already covers PutObject on the auto-blog bucket — confirmed at `terraform/iam.tf:183`.)                                                                                                                              |      |      |
| TASK-405 | Run the website deploy workflow once on master (or via `workflow_dispatch`) and confirm the manifest object appears in S3 with the expected shape (`aws s3 cp s3://.../manifests/element-armory/internal-links.json - | jq '.candidates | length'`).                                                                                                                                                                                                                                  |      |      |
| TASK-406 | Update `auto-blogger.config.ts` to point `contentRepository.manifestKey` at the published path. Confirm the local `npm run dev` flow still uses the filesystem repository when run outside Lambda (fallback when `AUTO_BLOG_S3_BUCKET` not set).                                                                                                                                                                                                                                                  |      |      |

**Files touched (FILE-…):**
- `auto-blogger/src/contentRepositoryS3Manifest.ts` — new.
- `auto-blogger/src/contentRepositoryS3Manifest.test.ts` — new.
- `website/scripts/publishInternalLinksManifest.ts` — new.
- `.github/workflows/deploy-website.yml` — new step.

**Tests added in this phase:** `contentRepositoryS3Manifest.test.ts`.

**Verify:**
- Manifest JSON exists in S3 at the documented key, with `.candidates.length` matching `loadInternalLinkCandidates(websiteRoot).length` run locally.
- Running `npm run dev` locally in `auto-blogger/` with `AUTO_BLOG_S3_BUCKET` unset uses the filesystem ContentRepository (proven by log line: `[auto-blogger] Using filesystem ContentRepository (no AUTO_BLOG_S3_BUCKET set)`).

### Phase 5 — Terraform: DynamoDB table, Lambda functions, EventBridge schedules, IAM

**Goal (GOAL-005):** Deploy the two Lambdas + DynamoDB + EventBridge in `terraform apply`, behind the `enable_auto_blogger_lambdas` flag (default `false` for the first apply, flipped to `true` once smoke-tested).

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                  | Done | Date |
|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------|------|
| TASK-501 | Create `terraform/lambda.tf`:<br>• `aws_dynamodb_table.auto_blogger_state` — `${var.project}-${local.normalized_env}-auto-blogger-state`, billing `PAY_PER_REQUEST`, hash key `pk` (S), **range key `sk` (S)** per the schema (`Query` requires the composite). TTL on `ttl` (N, epoch seconds). Point-in-time recovery enabled (a few cents/month at this scale; documented in `tfvars` example).<br>• `aws_iam_role.lambda_auto_blogger` — assume by `lambda.amazonaws.com`.<br>• `aws_iam_role_policy.lambda_auto_blogger_dynamodb` — `dynamodb:PutItem`, `dynamodb:Query`, `dynamodb:GetItem`, `dynamodb:UpdateItem`, `dynamodb:DeleteItem` on `arn:aws:dynamodb:${region}:${account}:table/${table}`.<br>• `aws_iam_role_policy.lambda_auto_blogger_s3` — `s3:GetObject`, `s3:PutObject`, `s3:ListBucket` on `auto_blog` bucket only (no assets bucket needed).<br>• `aws_iam_role_policy.lambda_auto_blogger_ses` — `ses:SendEmail`, `ses:SendRawEmail` scoped to the configured SES identity (same as the existing EC2 SES policy at `terraform/iam.tf:118`).<br>• `aws_iam_role_policy.lambda_auto_blogger_logs` — `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents`. |      |      |
| TASK-502 | Same file: define `aws_cloudwatch_log_group.auto_blogger_topics` and `..._news` with `retention_in_days = 30` and predictable names (`/aws/lambda/${var.project}-${local.normalized_env}-auto-blogger-topics`).                                                                                                                                                                                                                                                                                                                       |      |      |
| TASK-503 | Same file: define `aws_lambda_function.auto_blogger_topics` and `aws_lambda_function.auto_blogger_news`. `runtime = "nodejs22.x"`, `handler = "index.topicsHandler"` / `index.newsHandler`, `filename = "${path.module}/../auto-blogger/dist/lambda/lambda.zip"`, `memory_size = 1024`, `timeout = 900`, `reserved_concurrent_executions = 1` (prevents EventBridge retry double-fire), `role = aws_iam_role.lambda_auto_blogger.arn`. **Ownership model decision:** GHA owns code updates via `aws lambda update-function-code`; terraform owns config. Therefore add `lifecycle { ignore_changes = [source_code_hash, filename, last_modified] }` to both function resources so terraform does not fight GHA. Initial creation still uses `filename = "${path.module}/../auto-blogger/dist/lambda/lambda.zip"` + `source_code_hash = filebase64sha256("${path.module}/../auto-blogger/dist/lambda/lambda.zip")` — the operator runs `npm run build:lambda` once locally before the first apply (documented in `terraform/README.md`). `environment.variables` block reuses existing `var.anthropic_api_key`, `var.gemini_api_key`, `var.openai_api_key`, plus `AUTO_BLOG_S3_BUCKET`, `AUTO_BLOG_S3_PREFIX`, `AUTO_BLOG_NOTIFY_TO`, `AUTO_BLOG_NOTIFY_FROM`, `AUTO_BLOG_STATE_TABLE`, `AWS_SES_REGION=us-east-1`, `NODE_ENV=production`, `DAILY_ARTICLES=4`, `AUTO_BLOG_IMAGE_MODEL`, `AUTO_BLOG_IMAGE_STYLE`, `AUTO_BLOG_IMAGE_PALETTE`. Gate both Lambdas with `count = var.enable_auto_blogger_lambdas ? 1 : 0`.   |      |      |
| TASK-504 | Same file: define `aws_scheduler_schedule.auto_blogger_topics` with `schedule_expression = "cron(0 9 ? * MON-FRI *)"` and `schedule_expression_timezone = "Australia/Sydney"`. `target.arn = aws_lambda_function.auto_blogger_topics[0].arn` and `target.role_arn = aws_iam_role.scheduler_auto_blogger.arn`. Define `auto_blogger_news` with `cron(0 10 ? * MON-FRI *)`. Decide MON-FRI vs `*` based on current cadence — match today's `OnCalendar=*-*-*` (every day) by default; can tighten later. Gate with `count = var.enable_auto_blogger_lambdas ? 1 : 0`.   |      |      |
| TASK-505 | Same file: `aws_iam_role.scheduler_auto_blogger` assumed by `scheduler.amazonaws.com`, with `aws_iam_role_policy` granting `lambda:InvokeFunction` on the two function ARNs. **Also add** the resource-policy half: two `aws_lambda_permission` resources, one per function, with `action = "lambda:InvokeFunction"`, `principal = "scheduler.amazonaws.com"`, and `source_arn` scoped to the corresponding `aws_scheduler_schedule.*.arn`. Without both halves, EventBridge Scheduler invocations fail with `AccessDeniedException` even with the role attached.                                                                                                                                                                                                                                                                                          |      |      |
| TASK-506 | Add `terraform/outputs.tf` entries: `auto_blogger_topics_lambda_name`, `auto_blogger_news_lambda_name`, `auto_blogger_state_table_name`. Useful for GHA deploy step + manual `aws lambda invoke` smoke tests.                                                                                                                                                                                                                                                                                          |      |      |
| TASK-507 | Run `terraform apply` with `enable_auto_blogger_lambdas = false`. Confirms the new file parses and creates nothing yet (zero diff for the Lambda block). DynamoDB table is created regardless because it is unconditional (or, optionally, also gated — decide: gate the table behind the flag too so the first apply is truly zero-diff, then a second apply with the flag flipped creates everything together).                                                                                                                                |      |      |
| TASK-508 | **Atomic cutover apply.** Set BOTH `enable_auto_blogger_lambdas = true` AND `enable_auto_blogger_timers = false` in `terraform/variables/prod.tfvars` in the SAME commit and `terraform apply` them together. The `install_auto_blogger_timers` SSM association takes its disable branch (removes unit files, runs `daemon-reload`) at the same time the Lambdas + EventBridge schedules come up. There is a ≤ 60 s window where neither path runs; the next Lambda fire (09:00 Sydney) is the first new run. **Zero overlap = zero duplicate publishes.** Before applying, build the zip locally: `cd auto-blogger && npm run build:lambda`. After apply, smoke-test manually via `aws lambda invoke --function-name <name> /tmp/out.json`; inspect CloudWatch logs for `topicsHandler` execution. (Previous draft of this task allowed an overlap window for smoke-testing; that is rejected because the EC2 filesystem state and DynamoDB state diverge during overlap and would publish duplicates.)   |      |      |

**Files touched (FILE-…):**
- `terraform/lambda.tf` — new.
- `terraform/outputs.tf` — new outputs.
- `terraform/variables.tf` — `enable_auto_blogger_lambdas` (already added in Phase 2 TASK-206).
- `terraform/variables/prod.tfvars` — flip the flag.

**Tests added in this phase:** none (infra-only). Smoke tests are manual.

**Verify:**
- `aws dynamodb describe-table --table-name element-armory-prod-auto-blogger-state` returns a `ACTIVE` table.
- `aws lambda get-function --function-name element-armory-prod-auto-blogger-topics` returns the expected handler / memory / timeout.
- Manual `aws lambda invoke` runs the handler end-to-end (S3 artifact written, digest email sent, DynamoDB items written). No timeout, no unhandled exception.

### Phase 6 — Tear down EC2 systemd-timer infra and remove dead code paths

**Goal (GOAL-006):** Disable the systemd timers, remove the unit-file install/uninstall SSM associations, drop the `auto-blogger` references from the prod env file template, and delete the unused TS code paths (`AUTO_BLOG_MODE=daemon`, `scheduler.ts`, `lock.ts`, `state.ts`).

| Task     | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Done | Date |
|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------|------|
| TASK-601 | (Folded into TASK-508's atomic apply.) Verify on the EC2 host after the cutover: `systemctl list-timers auto-blogger-*` shows nothing; `/etc/systemd/system/auto-blogger*` files are gone; `journalctl -u 'auto-blogger@*' --since '24h ago'` shows no new entries.                                                                                                                                |      |      |
| TASK-602 | Run a single Lambda smoke test for each handler after cutover: `aws lambda invoke ... auto-blogger-topics` and `... auto-blogger-news` succeed (out-of-band of the daily schedule). Inspect S3 + email + DynamoDB.                                                                                                                                                                                                                                                                                                                                |      |      |
| TASK-603 | **48-hour soak.** With timers off and Lambdas on schedule, watch for two daily cycles. Confirm: 4 topic artifacts + 1 news artifact land in S3 each weekday; one digest email per cycle; no duplicate slugs in DynamoDB; CloudWatch Lambda errors metric remains zero.                                                                                                                                                                                                                                                                            |      |      |
| TASK-604 | Delete `terraform/templates/systemd/auto-blogger@.service.tftpl`, `auto-blogger-news.timer.tftpl`, `auto-blogger-topics.timer`. Delete the `install_auto_blogger_timers` `aws_ssm_association`, the `auto_blogger_service_unit`, `auto_blogger_topics_timer`, `auto_blogger_news_timer`, `auto_blogger_timers_install_cmd`, `auto_blogger_timers_uninstall_cmd` locals from `terraform/ec2.tf`. Delete the `enable_auto_blogger_timers` variable from `terraform/variables.tf` and `terraform/variables/prod.tfvars`. |      |      |
| TASK-605 | In `terraform/ec2.tf`, **delete** the `auto_blogger_env_file` local entirely (every line is now Lambda-owned). Delete the corresponding `cat > .env.auto-blogger` heredoc block + `chown`/`chmod` lines from the `aws_ssm_association.upload_runtime_env` `commands` parameter. Delete the `[ -f ${local.ec2_app_path}/.env.auto-blogger ]` guard from `aws_ssm_association.run_deployment` `commands`. Run `terraform apply`; the SSM association re-runs and the now-orphaned `.env.auto-blogger` file on the host can be left in place (cosmetic) or removed via a one-shot SSM `rm -f` command (optional cleanup).                                                                                                                                            |      |      |
| TASK-606 | Delete from `auto-blogger/src/`: `lock.ts`, `state.ts`, `scheduler.ts`. **Pre-requisite:** confirm `stateStoreFilesystem.ts` (added in TASK-108) has *inlined* the JSON read/write logic (mkdir, readFileSync, writeFileSync, `INITIAL_STATE` shape) rather than `import`-ing from `state.ts` — TASK-108 says "wraps the existing `state.ts` logic" but the wrapper must duplicate the code so this deletion is safe. If TASK-108 was implemented as a re-export, copy the body into `stateStoreFilesystem.ts` before deleting. Update `auto-blogger/src/index.ts` `runDaemon` removal: the function is deleted along with the `mode === "daemon"` branch in `main()`. Update `package.json` `dev` script to call `runParallelTopics(1)` directly (or `AUTO_BLOG_MODE=once` is preserved as the only path; document accordingly).                                                                                                                                                          |      |      |
| TASK-607 | Update `auto-blogger/Dockerfile`: with no daemon and no `/data` mount needed (state is DynamoDB; nothing else writes to disk in the steady-state path), drop the `VOLUME ["/data"]` line and any data-dir bootstrap. The image is now used only for local dev parity; the Lambda zip is what ships.                                                                                                                                                                                                                                              |      |      |
| TASK-608 | Optionally remove the `build_auto_blogger` job from `.github/workflows/deploy-apps.yml` since the EC2 host no longer pulls the image (the Lambda zip path replaces it). Decision point: keep the job if you want a Docker image available for ad-hoc EC2 dry runs; remove if you do not. Recommend: remove and add a new `build_auto_blogger_lambda` job that runs `npm run build:lambda` and `aws lambda update-function-code` for both functions. **Use existing GHA AWS creds** (`secrets.AWS_ACCESS_KEY_ID`); add `lambda:UpdateFunctionCode` to `aws_iam_policy.github_actions_deployment` (`terraform/iam.tf:160`). |      |      |
| TASK-609 | Run `npm test && npm run typecheck && npm run build` in `auto-blogger/`. Build the Lambda zip. Commit and let `deploy-apps.yml` push the new zip + update both Lambda functions.                                                                                                                                                                                                                                                                                                                                |      |      |

**Files touched (FILE-…):**
- `terraform/variables/prod.tfvars` — flip `enable_auto_blogger_timers`, eventually remove.
- `terraform/ec2.tf` — remove systemd-related locals + SSM association; simplify env file.
- `terraform/templates/systemd/` — delete three files.
- `terraform/variables.tf` — remove `enable_auto_blogger_timers`.
- `auto-blogger/src/lock.ts`, `state.ts`, `scheduler.ts` — delete.
- `auto-blogger/src/index.ts` — remove `runDaemon`, `mode === "daemon"` branch.
- `auto-blogger/Dockerfile` — drop `VOLUME ["/data"]`.
- `.github/workflows/deploy-apps.yml` — swap `build_auto_blogger` job for `build_auto_blogger_lambda`.
- `terraform/iam.tf` — add `lambda:UpdateFunctionCode` to `github_actions_deployment` policy.

**Tests added in this phase:** none (deletions only).

**Verify:**
- `git ls-files auto-blogger/src/ | xargs grep -l 'AUTO_BLOG_MODE\|lockPath\|scheduler'` returns no production code matches (test fixtures excluded).
- `systemctl list-timers --all` on the EC2 host shows no `auto-blogger-*` timers.
- `terraform plan` shows zero diff after the cleanup commit (steady state reached).
- 7-day soak: 4 topic articles + 1 news article per weekday land in S3 via Lambda only; no missed days; CloudWatch Lambda error count zero.

### Phase 7 — Documentation, plan deprecation, porting guide

**Goal (GOAL-007):** Capture the new operational shape and the "drop into another project" workflow.

| Task     | Description                                                                                                                                                                                                                                                                                                                       | Done | Date |
|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------|------|
| TASK-701 | Rewrite `auto-blogger/README.md`: replace "how this runs in prod" with the Lambda topology. Document `npm run build:lambda` / `npm run package:lambda`. Document the `auto-blogger.config.ts` shape with a working example. Document local dev (`npm run dev` still works via filesystem `StateStore` + filesystem `ContentRepository`).                                            |      |      |
| TASK-702 | Add `auto-blogger/PORTING.md` (or a section in README): step-by-step for a sibling project. Outline: (1) copy `auto-blogger/` directory to target repo; (2) write `auto-blogger.config.ts` at target root with new brand/news/content paths; (3) add `terraform/lambda.tf` (reference template); (4) add manifest-publisher step to target project's website CI; (5) add `AUTO_BLOG_NOTIFY_*` + `AUTO_BLOG_STATE_TABLE` env vars to terraform variables.            |      |      |
| TASK-703 | Update root `CLAUDE.md`: add a one-line under "Database Conventions" or a new "Scheduled jobs" subsection pointing at the Lambda topology and the `auto-blogger.config.ts` file at repo root.                                                                                                                                                                                                                                                                  |      |      |
| TASK-704 | Update `terraform/README.md`: document `terraform/lambda.tf`, the DynamoDB table, EventBridge schedules, and the `enable_auto_blogger_lambdas` flag (how to disable + how to re-enable).                                                                                                                                                                                                                                                                       |      |      |
| TASK-705 | Move `plans/active/2026-05-14-ec2-stability-auto-blogger-offload.md` to `plans/complete/` after editing front-matter `status: Deprecated`, swap badge colour to red, and append a "Superseded by" link to this plan. **Do not** use `/plan-done` — that skill is for finished work; this plan is being rolled back, not completed.                                                                                                                                                              |      |      |
| TASK-706 | Add a `dry-run` smoke command for the Lambda path: `AUTO_BLOG_DRY_RUN=true npm run dev` runs `runParallelTopics(2)` against the filesystem `ContentRepository` + a no-op `OutputAdapter`. Useful for local prompt iteration without spending API tokens or hitting S3.                                                                                                                                                                                            |      |      |
| TASK-707 | One-page changelog post in `auto-blogger/CHANGELOG.md` (new file): summarise the substrate change for future readers. Link this plan + the deprecated plan.                                                                                                                                                                                                                                                                                                            |      |      |

**Files touched (FILE-…):**
- `auto-blogger/README.md`, `auto-blogger/PORTING.md`, `auto-blogger/CHANGELOG.md`.
- `terraform/README.md`.
- Root `CLAUDE.md`.
- `plans/active/2026-05-14-ec2-stability-auto-blogger-offload.md` → `plans/complete/`.

**Tests added in this phase:** none.

**Verify:**
- A fresh reading of `auto-blogger/README.md` + `auto-blogger/PORTING.md` is sufficient for a new engineer to deploy the auto-blogger into a sibling project without consulting this plan.

## Alternatives considered

- **ALT-001 — Container image Lambda.** Better for large dependency trees; longer cold start; new ECR repo. Kept as documented fallback (RISK-001) if the bundled zip exceeds limits.
- **ALT-002 — Orchestrator + worker Lambdas (fan-out).** Per-article 15-min budget isolation, harder digest email, more IAM. Rejected for the 4-article scale.
- **ALT-003 — SQS fan-out with DLQ.** Cleanest retry semantics. Overkill at this volume. Reconsider only if articles per day grow to dozens.
- **ALT-004 — S3 JSON state with ETag CAS.** Simpler infra; awkward for in-process parallel claim under `Promise.all`. DynamoDB conditional writes are the natural fit.
- **ALT-005 — Secrets Manager / SSM Parameter Store SecureString.** Rotation features unneeded; adds cold-start fetch latency; ~$2/mo for Secrets Manager. Plain env vars are sufficient and match the existing EC2 pattern.
- **ALT-006 — npm package or git submodule for reuse.** Versioning + release flow overhead unjustified for a 2-project use case. Vendor-copy keeps the package change-velocity high.
- **ALT-007 — Sitemap scraping for internal-link candidates.** Fragile; lossy (no `linkKeywords`); rate-fragile against the public site. S3 manifest is explicit and cheap.
- **ALT-008 — Keep daemon mode for local dev.** Removed. Local dev uses `npm run dev` which now calls `runParallelTopics(n)` directly; daemon abstraction was only there to support the EC2 long-running container, which is gone.

## Dependencies

- **DEP-001** AWS Lambda Node.js 22 runtime (includes AWS SDK v3 — `external: ["@aws-sdk/*"]` in esbuild keeps the bundle small).
- **DEP-002** `@aws-sdk/client-dynamodb` + `@aws-sdk/lib-dynamodb` (new auto-blogger deps; both already excluded from the bundle by DEP-001 marking).
- **DEP-003** `esbuild` + `adm-zip` (devDeps in `auto-blogger/package.json`) for `build:lambda`.
- **DEP-004** Existing terraform variables `var.anthropic_api_key`, `var.gemini_api_key`, `var.openai_api_key`, `var.auto_blog_notify_to`, `var.from_email`. No new secret intake.
- **DEP-005** GitHub Actions deployer IAM (`aws_iam_policy.github_actions_deployment` at `terraform/iam.tf:160`) already covers `s3:PutObject` on the `auto_blog` bucket (`terraform/iam.tf:183`). Add `lambda:UpdateFunctionCode` for both Lambda function ARNs (TASK-608).
- **DEP-006** Existing SES configuration set + identity (`terraform/ses.tf`) — Lambda reuses the same `FROM_EMAIL` and config sets.

## Testing strategy

- **Unit (`node --test` via `tsx`):** every new file gets a test — `projectConfig.test.ts`, `stateStoreFilesystem.test.ts`, `stateStoreDynamoDb.test.ts` (in-memory mock), `contentRepositoryS3Manifest.test.ts`, `outputAdapterS3Ses.test.ts`, `lambda.test.ts` (mocked DI). Existing `newsSearch.test.ts` updated for the parameterised signature.
- **Integration:** the Lambda smoke test (TASK-508, TASK-602) is the integration boundary — real DynamoDB, real S3, real SES, real Anthropic + Gemini APIs. Run via `aws lambda invoke` from a developer machine with credentials. The first successful invocation is the integration test pass.
- **48-hour soak (TASK-603):** observation against EC2-timer-off + Lambda-on. AC-001..005 must hold.
- **7-day soak (Phase 6 Verify):** longer observation against the cleaned-up state. Confirms no regression.
- **Manual verification fallback:** none required — every behaviour is observable via CloudWatch Logs, S3 object listings, DynamoDB scans, and SES delivery logs.

## Acceptance criteria

- **AC-001** Both Lambdas (`topics`, `news`) execute on their EventBridge cron without error for 7 consecutive days (`AWS/Lambda Errors` metric = 0 over the window).
- **AC-002** Each topic run lands exactly `DAILY_ARTICLES` (=4) new pending artifacts in `s3://auto-blog/auto-blogger/pending/` with distinct slugs.
- **AC-003** Each news run lands exactly one new blog artifact.
- **AC-004** Digest email arrives within 5 min of Lambda completion, contains thumbnails + token usage + cost + quality warnings per article.
- **AC-005** DynamoDB `KEYWORD#*` and `SLUG#*` item counts grow monotonically; no duplicate `SLUG#<slug>` `PutItem` succeeds.
- **AC-006** `grep -r "Element Armory" auto-blogger/src/` returns zero matches outside test fixtures.
- **AC-007** Copying `auto-blogger/` into a fresh sibling project + writing an `auto-blogger.config.ts` is sufficient (per the porting doc) to run `npm run dev` against the new project's brand without touching `auto-blogger/src/`.
- **AC-008** `terraform plan` after Phase 6 shows zero drift (steady state).
- **AC-009** No `systemd` `auto-blogger-*` units exist on the EC2 host (`systemctl list-units --all 'auto-blogger-*'` returns nothing).

## Code-quality principles applied

- **Server / Node:** services/models split N/A (this is a standalone Node tool). Module-per-responsibility honoured: `stateStore.ts` interface + impl files, `contentRepository.ts` interface + impl files, `outputAdapter.ts` interface + impl files, `projectConfig.ts` types-only.
- **DB:** all DynamoDB timestamps as epoch ms via `Date.now()` (`claimedAt` is `N`, not `S`).
- **TS:** named exports throughout; no `any`; discriminated unions for config variants; files stay under 300 lines (split impls if approaching the limit).
- **Errors:** every `PutItem` checks `ConditionalCheckFailedException` explicitly. Promise.allSettled in the parallel topic loop captures per-article failures into the digest email instead of crashing the whole run. S3 / SES / DynamoDB / Anthropic / Gemini errors all bubble back to the handler so EventBridge marks the invocation failed and CloudWatch alarms can fire.
- **Frontend:** N/A (no UI).
- **Naming:** Lambda functions, DynamoDB table, IAM roles all namespaced with `${project}-${normalized_env}-auto-blogger-*`.
- **No `--no-verify` / `--no-gpg-sign` shortcuts** at any commit step.

## Risks & assumptions

- **RISK-001 — Lambda zip exceeds 250 MiB unzipped.** jsdom, ai-sdk, google-genai, AWS SDK clients are heavy. Mitigation: esbuild bundle + `external: ["@aws-sdk/*"]` (runtime-provided). Measured at TASK-306. **Fallback:** flip deployment format to container image (existing `auto-blogger/Dockerfile` works; switch `aws_lambda_function.package_type = "Image"` + `image_uri = "<ecr-uri>"`). ~1 day extra terraform + GHA rework.
- **RISK-002 — `jsdom` does not survive esbuild bundling cleanly** (uses dynamic imports + native modules in some transitive deps). Mitigation: mark `jsdom` and `@mozilla/readability` as externals and include them as a Lambda layer, OR replace the readability path with a lighter HTML-text extractor at the cost of news-cycle quality. Decide at TASK-308.
- **RISK-003 — Total cycle exceeds 15 min** when one article takes unusually long. With 4 articles in parallel, the longest article gates the run. Mitigation: Promise.allSettled means a 15-min individual stall fails only that article, not the whole digest. If repeated stalls happen, drop concurrency to 2+2 batches (re-introduce a small sequential layer) or switch to fan-out (ALT-002).
- **RISK-004 — DuckDuckGo / Google News blocks Lambda egress IPs.** AWS Lambda IPs are well-known and sometimes rate-limited. Mitigation: monitor news-discovery error rates; if blocked, route research traffic through a paid search API (Brave Search, SerpAPI). Out of scope for this plan.
- **RISK-005 — EventBridge Scheduler timezone semantics.** `Australia/Sydney` honoured natively by EventBridge Scheduler (not legacy CloudWatch Events). Verify at TASK-507 that the first scheduled run fires at the correct local wall-clock time.
- **RISK-006 — `auto-blogger.config.ts` at repo root is committed to git, including the news-queries list and brand block.** No secrets in it. Safe. Mitigation: explicit `.gitignore` entry NOT added — file must be tracked.
- **RISK-007 — Manifest publisher race on website deploys.** Two near-simultaneous website deploys could overwrite the manifest with a partial view. Mitigation: PUT is idempotent; last write wins; transient inconsistency self-heals on next deploy. Acceptable.
- **RISK-008 — Lambda + `Promise.all` LLM rate limit.** 4 simultaneous Claude Haiku 4.5 calls + 4 Gemini image calls per cycle. Anthropic tier-1 RPM is generous; Gemini image RPM may need check. Mitigation: stagger image generation by 100–200 ms inside the topic pipeline if 429s appear. Trivial fix.
- **ASSUMPTION-001** The website CI (`deploy-website.yml`) has S3 PutObject access to the auto-blog bucket. Confirmed at `terraform/iam.tf:183`.
- **ASSUMPTION-002** The `auto-blog` S3 bucket and SES identity are already provisioned (`terraform/s3.tf` for the bucket, `terraform/ses.tf` for the identity). No new bucket / identity created.
- **ASSUMPTION-003** Topic and news cycles will continue to run weekdays-only by default to match current product cadence. EventBridge cron uses `MON-FRI` — flip to `*` if 7-day publishing is desired.
- **ASSUMPTION-004** `DAILY_ARTICLES=4` will not be raised without revisiting per-Lambda concurrency limits and the LLM rate-limit risk (RISK-008).
- **ASSUMPTION-005** Importer side (`importFromS3.ts`, `import-auto-blog-content.yml`, `backfillInternalLinks.ts`) is unaffected. The artifact shape (`ArticleArtifactMetadata`, `assets[]`) is unchanged.

## Out of scope

- Importer-side changes (`importFromS3.ts`, `backfillInternalLinks.ts`, `bootstrapLinkKeywords.ts`, `import-auto-blog-content.yml`).
- Removing EC2 swap or per-container `mem_limit`s from the earlier plan — they continue to benefit the remaining containers.
- Migrating the `server`, `mcp-server`, `admin-daily-summary` workloads off EC2.
- Switching text or image model defaults.
- Adding CloudWatch alarms / PagerDuty integration (recommended follow-up, not part of this plan).
- Multi-project deployment automation (e.g. a shared terraform module) — out of scope until the second consuming project is committed.
- Replacing the manifest publisher with an event-driven trigger (S3 notification → Lambda) — adequate for daily publish cadence today.

---

## Applying this to production

### Deployment paths in this repo (recap)

| Change type                                                                       | Channel                                                                                                                                              | Triggered by                                                                                                  |
|----------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------|
| Code in `auto-blogger/**`                                                         | GitHub Actions — `deploy-apps.yml` (`build_auto_blogger_lambda` job, added in Phase 6) builds the zip and calls `aws lambda update-function-code`. | Push to `master` matching the workflow's `paths` filter.                                                      |
| `terraform/lambda.tf` and other terraform                                          | `/release terraform-only` (`docker compose run --rm terraform apply` under `aws-vault`).                                                            | Manual.                                                                                                       |
| Website manifest publisher (`website/scripts/publishInternalLinksManifest.ts`)    | `deploy-website.yml` runs it after the website S3 sync.                                                                                              | Push to `master` matching the website workflow's `paths` filter.                                              |
| `auto-blogger.config.ts` at repo root                                              | GitHub Actions builds it into the Lambda zip on next `auto-blogger/**` push, or directly via `aws lambda update-function-code` after a manual rebuild. | Push to `master` touching the file (add it to `deploy-apps.yml` `paths` filter under `auto-blogger/**` OR add `./auto-blogger.config.ts` explicitly). |

### Roll-out sequence

1. **Commit 1 — Phase 1.** Code refactor for the project-agnostic seam. No behaviour change. Deploy via existing GHA → `auto-blogger:latest` Docker image rebuilt with new code; systemd timers continue to fire it. Verify next scheduled run on the EC2 host.

2. **Commit 2 — Phase 2.** DynamoDB `StateStore` impl + new variable. Still no behaviour change. Deploy via GHA.

3. **Commit 3 — Phase 3.** Lambda handlers + esbuild bundle. Verify `npm run build:lambda` locally. No deploy yet.

4. **Commit 4 — Phase 4.** Manifest publisher in website CI. Run website deploy; confirm manifest in S3.

5. **Commit 5 — Phase 5.** `terraform/lambda.tf` + the `enable_auto_blogger_lambdas = false` first apply (zero diff if also gating the DynamoDB table). Then flip the flag in `prod.tfvars` and apply again to create the table + Lambdas + schedules. Smoke-test via `aws lambda invoke`. EC2 systemd timers still running in parallel during this window — duplicate runs guarded by the `KEYWORD#<id>` claim collision (filesystem state on EC2 vs. DynamoDB state in Lambda diverge briefly; for the smoke-test window this is acceptable because we accept up to one duplicate run). To eliminate the overlap window, flip `enable_auto_blogger_timers = false` in the **same apply** as the Lambda flip.

6. **Commit 6 — Phase 6 (part 1).** Flip `enable_auto_blogger_timers = false`; apply. Run the 48-hour soak (TASK-603). If clean, proceed.

7. **Commit 7 — Phase 6 (part 2).** Delete systemd templates, EC2 env file lines, lock/state/scheduler TS files; swap the GHA build job to `build_auto_blogger_lambda`; add `lambda:UpdateFunctionCode` to the GHA IAM policy. Apply terraform. Validate.

8. **Commit 8 — Phase 7.** Docs + plan deprecation. No infra change.

### Rollback

- **Roll back the Lambda flip only:** set `enable_auto_blogger_lambdas = false` AND `enable_auto_blogger_timers = true`. Run `terraform apply`. The systemd timers fire on EC2 again; the Lambdas + EventBridge schedules disappear (DynamoDB table persists, harmless). Inflight items in DynamoDB are ignored by the EC2 filesystem path. Re-publish duplicates are guarded by `processedSlugs` in `/data/auto-blogger-state.json` (separate state), so one or two duplicates are possible during the rollback window — acceptable.
- **Roll back the code refactor (Phases 1–3):** `git revert` the commit range and re-deploy via GHA. EC2 path reverts to the pre-refactor behaviour. Lambdas (if not torn down) start failing because they reference deleted handler exports — `enable_auto_blogger_lambdas = false` simultaneously to silence them.
- **Full rollback to pre-2026-05-14 (pre-systemd):** out of scope. The systemd Phase 2 work is being rolled back as part of this plan; if you also wanted the swap + `mem_limit`s reverted, that is a separate manual SSM step (`swapoff /swapfile && rm /swapfile && sed -i '/swapfile/d' /etc/fstab` plus a compose edit).

## Architect notes

Senior-architect review run 2026-05-17 via the `Plan` subagent (no `architect` subagent registered in `.agents/` or `~/.claude/agents/`; `Plan` is described as the architect-equivalent). Verdict: **fix-blocking-then-ship**. The three BLOCKING items were fixed in-plan before this section was written:

1. **TASK-103 bundler resolution pinned** — `loadProjectConfig` now uses a static `import` of `../../auto-blogger.config.js` so esbuild inlines it at bundle time; no runtime FS resolution.
2. **TASK-112 Docker COPY mechanics corrected** — every `COPY` requalified with the `auto-blogger/` prefix after the build-context flip to repo root; `auto-blogger.config.ts` added explicitly; new repo-root `.dockerignore` required.
3. **TASK-202 DynamoDB schema redesigned** — composite-key (HASH `pk` = bucket literal, RANGE `sk` = identifier) replaces the prior single-key-with-prefix design that would have failed `Query`. All `Query` calls scope by `pk = :bucket`.

WARNINGS folded into the plan body:

- **Cutover overlap eliminated.** TASK-508 now requires a single atomic apply that enables Lambdas + disables systemd timers in the same `terraform apply`. The prior "accept up to 4 dupes/day during smoke-test overlap" wording is rejected.
- **Scheduler → Lambda invoke permission.** TASK-505 now requires both the role-side `lambda:InvokeFunction` policy AND `aws_lambda_permission` resources granting `scheduler.amazonaws.com` invoke per-function. Without both, EventBridge fires return `AccessDeniedException`.
- **Terraform vs GHA ownership of Lambda code.** TASK-503 now mandates `lifecycle { ignore_changes = [source_code_hash, filename, last_modified] }` on both function resources so `aws lambda update-function-code` from GHA does not fight `terraform apply`.
- **`reserved_concurrent_executions = 1`** added to TASK-503 to prevent EventBridge retry storms from double-firing the daily cycle.
- **TTL units clarified.** Data & API design now explicitly notes that `ttl` is the one epoch-seconds exception to GUD-002; `claimedAt` and all other timestamps remain ms.
- **TASK-606 deletion safety.** Calls out that `stateStoreFilesystem.ts` must inline (not re-export) the `state.ts` JSON read/write logic so the deletion is safe.
- **TASK-605 env-file deletion** is now explicit about removing the heredoc + the run-deployment guard, not merely "if the file becomes empty".
- **TASK-308 bundling validation** now requires explicit checks for `jsdom`, `@zhafron/mcp-web-search`, `@google/genai`, and `@ai-sdk/anthropic 1.2` under esbuild minify, with container-image fallback as the documented exit if any fails.

Observations the executing agent should keep in mind but that did not warrant inline plan changes:

- **Publish-cadence change.** Today: 4 topic articles staggered across the working day. After cutover: 4 topic articles published in a bulk at 09:00 Sydney (the importer GHA still runs on its own schedule, so the website-visible cadence depends on when `import-auto-blog-content.yml` next fires — verify the importer schedule when cutover lands). Mention this explicitly in `auto-blogger/CHANGELOG.md` (TASK-707) and in `PORTING.md` (TASK-702).
- **Pre-validate the esbuild bundle in Phase 3.** Do not commit Phase 4 or Phase 5 work until TASK-308 passes locally — a bundle failure discovered after Phase 5 lands will block rollout while infra is half-deployed.
- **Follow-up plan**: CloudWatch alarms on `AWS/Lambda Errors >= 1` + SNS-to-email for both functions. Listed in Out of scope but trivial to ship as a sibling plan once the cutover is stable.
- **Manifest publisher race** (RISK-007) is real but self-healing on next website deploy; not worth additional infra at this scale.

No issues raised that required revisiting any of the eight Step-3 settled decisions.
