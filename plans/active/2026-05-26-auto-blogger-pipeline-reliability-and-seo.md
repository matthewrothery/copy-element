---
title: Auto-blogger pipeline reliability, content quality, and SEO integration
status: Planned
created: 2026-05-26
owner: matt
area: cross-cutting
tags: [bug, infra, seo, feature]
---

# Auto-blogger pipeline reliability, content quality, and SEO integration

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

## Context

The auto-blogger Lambda generates topic articles (4x daily at 9/11/14/16h AEST) and news posts (1x daily at 10h AEST), uploads them to S3 `pending/`, and a GitHub Actions workflow imports them to the repo, builds the website, and deploys. Lambda logs confirm articles are generated and uploaded — but they never appear on the live website.

Root cause analysis reveals two critical bugs:

1. **Import atomicity bug.** `importFromS3.ts` calls `movePrefixToPublished()` inside the per-artifact loop (lines 91, 117, 146) — *before* the git commit, build, and deploy steps in the GHA workflow. If the build or push fails, artifacts have already been moved from `pending/` to `published/` in S3 and will never be picked up again. They are effectively lost.

2. **Silent Lambda deploy failures.** The `deploy-apps.yml` workflow uses `continue-on-error: true` on both Lambda code update steps (lines 183, 191). If the Lambda deploy fails (IAM permissions, zip size, cold-start issues), the pipeline silently continues and the Lambda runs stale code.

Additional issues compound the problem: the import workflow runs only 2x daily (0:00 and 12:00 UTC), notification mode is `digest` (not per-article), there is no "published to website" email, and the internal-links manifest can go stale between website deploys.

This plan fixes the pipeline end-to-end, adds content quality improvements gated behind an env var, and integrates Google Search Console for automated sitemap submission and indexing requests — also env-gated.

## Requirements & constraints

- **REQ-001** Articles must NOT be moved from `pending/` to `published/` in S3 until after the git push AND website build+deploy succeed in the import workflow.
- **REQ-002** Lambda code deploy failures must be visible (fail the GHA job, not silently continue).
- **REQ-003** Import workflow runs frequently enough that no article waits more than ~2 hours in `pending/`.
- **REQ-004** Each generated article triggers a per-article email notification immediately after S3 upload.
- **REQ-005** A separate "published to website" confirmation email is sent by the import workflow after successful deployment, listing all articles that were published.
- **REQ-006** Both topic articles and news/blog posts follow the same reliable pipeline path.
- **REQ-007** Internal-links manifest is published after every import-driven deploy (not just on `deploy-website.yml` runs).
- **REQ-008** An env-gated content quality scoring pass runs after article generation, producing an SEO quality score and improvement suggestions in the email.
- **REQ-009** An env-gated quality gate can block articles with critical SEO deficiencies from being uploaded to S3.
- **REQ-010** An env-gated Google Search Console integration submits the sitemap and requests indexing of new URLs after deployment.
- **CON-001** No new AWS services beyond what exists (Lambda, EventBridge, DynamoDB, S3, SES, CloudWatch). Google APIs are external.
- **CON-002** Content quality and Search Console features are disabled by default (no env var = no behavior change).
- **GUD-001** TypeScript only. Files < 300 lines. Named exports. No `any`.
- **GUD-002** Epoch ms timestamps only (no ISO strings in state or DB).
- **GUD-003** `auto-blogger/` is server-side TypeScript only — no React, no CSS.

## References

- Internal docs: `./CLAUDE.md` (root), `./website/CLAUDE.md`
- Source files inspected: `auto-blogger/src/lambda.ts`, `auto-blogger/src/index.ts`, `auto-blogger/src/s3.ts`, `auto-blogger/src/outputAdapterS3Ses.ts`, `auto-blogger/src/importFromS3.ts`, `auto-blogger/src/email.ts`, `auto-blogger/src/generateArticle.ts`, `auto-blogger/src/generateNewsArticle.ts`, `auto-blogger/src/generateSection.ts`, `auto-blogger/src/artifact.ts`, `auto-blogger/src/quality.ts`, `auto-blogger/src/config.ts`, `auto-blogger/src/contentRepositoryS3Manifest.ts`, `auto-blogger/src/internalLinks.ts`, `auto-blogger/src/backfillInternalLinks.ts`, `auto-blogger.config.mts`, `terraform/lambda.tf`, `.github/workflows/import-auto-blog-content.yml`, `.github/workflows/deploy-apps.yml`, `.github/workflows/deploy-website.yml`, `website/scripts/publishInternalLinksManifest.mts`, `website/app/sitemap.ts`, `website/app/topics/[hub]/[cluster]/[slug]/page.tsx`, `website/app/blog/[slug]/page.tsx`
- Related plans: `./plans/active/2026-05-17-auto-blogger-lambda-migration-and-reusable-package.md` (active — this plan fixes bugs in the pipeline that plan established), `./plans/complete/2026-05-25-auto-blogger-rate-limit-fix.md`
- External docs:
  - [Google Search Console API — Sitemaps](https://developers.google.com/webmaster-tools/v1/sitemaps)
  - [Google Indexing API — URL Notifications](https://developers.google.com/search/apis/indexing-api/v3/using-api)
  - [Google Auth — Service Account](https://cloud.google.com/iam/docs/service-account-overview)

## Active plans affected

- `plans/active/2026-05-17-auto-blogger-lambda-migration-and-reusable-package.md` — REQ-007 (digest email) is superseded by this plan's switch to per-article mode (REQ-004). REQ-008 (artifact format unchanged) is honoured — this plan does not change the S3 artifact structure. No other conflicts.

## Docs to update on completion

- `auto-blogger/README.md` — document new env vars (`AUTO_BLOG_QUALITY_GATE`, `AUTO_BLOG_SEO_SCORE`, `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_SEARCH_CONSOLE_SITE_URL`), updated notification modes, import schedule changes
- Root `CLAUDE.md` — add note about env-gated SEO features under auto-blogger section if one exists

## SEO & performance

- Sitemap already exists at `website/app/sitemap.ts` — includes all topic articles and blog posts. No changes needed to the sitemap structure itself.
- Article pages already have JSON-LD (Article schema + FAQPage schema for topics, Article schema for blog). No changes needed.
- OpenGraph metadata: article pages have `title` and `description` via `generateMetadata()` but no explicit `openGraph` or `twitter` card config — adding these is out of scope for this plan but noted as a follow-up.
- BreadcrumbList JSON-LD: not present on article pages. Adding it is a quick SEO win but out of scope for this plan — noted as follow-up.
- Internal linking: the system already has a sophisticated placeholder-based linking system with remediation and backfill. Quality improvements in Phase 5 will enhance prompt-level SEO guidance.

## Architecture decisions

- **Deferred S3 move (batch after deploy) over per-artifact move** — Moving `pending/` → `published/` after successful deploy means a failed build can be retried without losing artifacts. Alternative: per-artifact move with a "failed" state in DynamoDB — rejected because it adds state management complexity for a problem that batch-deferral solves simply.
- **Per-article emails + published email (two lifecycle notifications) over single combined email** — Separating generation notification from publish confirmation gives immediate feedback on generation quality while also confirming the article is live. Alternative: single email after publish — rejected because the user wants immediate feedback on each generation.
- **Cron-aligned import schedule over event-driven (S3 notification → GHA)** — Adding more cron entries to the import workflow is simpler than wiring S3 event notifications to trigger a GitHub Actions workflow (which would require a webhook relay). Alternative: Lambda triggers GHA via GitHub API — rejected because it requires storing a GitHub PAT in Lambda env.
- **Quality gate as env var (`AUTO_BLOG_QUALITY_GATE`) over always-on** — Prevents blocking articles in production until the quality scoring is tested and tuned. Can be enabled incrementally.
- **Google Indexing API for URL ping over just sitemap submission** — The Indexing API (`URL_UPDATED`) provides faster indexing than waiting for Google to re-crawl the sitemap. Officially intended for job postings/broadcast events, but widely used for general content. Combined approach (sitemap submit + URL ping) gives the best coverage.

## Phases

### Phase 1 — Fix import atomicity (critical pipeline bug)

**Goal (GOAL-001):** Articles are never moved from `pending/` to `published/` until after the git push AND website build+deploy succeed. A failed build leaves artifacts in `pending/` so the next import run can retry.

| Task | Description | Done | Date |
|------|-------------|------|------|
| TASK-001 | Refactor `importFromS3.ts` to collect all imported artifact IDs and their asset names in a `toPublish: Array<{ artifactId: string; assetS3Names: string[] }>` array during the import loop, instead of calling `movePrefixToPublished()` inside the loop. At the end of `main()`, write the array + S3 config to a known manifest file at `auto-blogger/dist/import-manifest.json` (path constant exported from config). The manifest includes `{ bucket, prefix, artifacts: toPublish[], importedTopicSlugs: string[] }` | | |
| TASK-002 | Add a new `auto-blogger/src/markPublished.ts` script — reads `dist/import-manifest.json`, calls `movePrefixToPublished()` for each artifact. Requires the same AWS env vars as the import step (`AUTO_BLOG_S3_BUCKET`, `AUTO_BLOG_S3_PREFIX`, AWS credentials). Exits 0 on success, exits 1 on failure (but existing "skip if file exists" logic in importFromS3.ts prevents duplicate content if mark-published fails and import re-runs) | | |
| TASK-003 | Add a "Mark artifacts published" step in `import-auto-blog-content.yml` that runs AFTER successful "Build Next.js" + "Sync to S3" + "Invalidate CloudFront" steps. Runs `tsx src/markPublished.ts`. Passes the same AWS env vars (`AUTO_BLOG_S3_BUCKET`, `AUTO_BLOG_S3_PREFIX`, AWS credentials). Step condition: `if: steps.changes.outputs.has_changes == 'true'` | | |
| TASK-004 | Honour the existing `AUTO_BLOG_DRY_RUN` env var in the import script (consistent with `config.ts` pattern) — when true, writes files locally but skips the manifest write, so no S3 move can occur | | |

**Files touched:**
- `auto-blogger/src/importFromS3.ts` — remove `movePrefixToPublished()` from per-artifact loop, write `dist/import-manifest.json` at end
- `auto-blogger/src/markPublished.ts` — new file (~60 lines), reads manifest JSON, calls `movePrefixToPublished()` for each artifact
- `.github/workflows/import-auto-blog-content.yml` — add "Mark artifacts published" step after successful build+deploy, with `AUTO_BLOG_S3_BUCKET` and `AUTO_BLOG_S3_PREFIX` env vars

**Note:** If `markPublished.ts` fails (e.g., S3 permissions), artifacts remain in `pending/` and will be re-imported next run. The existing "skip if file exists" check (`importFromS3.ts` line 84) prevents duplicate content — but the git commit will be a no-op since files already exist. This is acceptable noise; a warning log is sufficient.

**Tests:** Unit test for `markImportedAsPublished` with mocked S3 calls. Test for manifest JSON write/read round-trip.

**Verify:**
- Run import locally with `AUTO_BLOG_DRY_RUN=true` — files appear in `website/content/` but no manifest is written, no S3 move
- In GHA: if the build step fails, pending artifacts remain in S3 and are picked up on the next run

---

### Phase 2 — Lambda deploy reliability + observability

**Goal (GOAL-002):** Lambda deploy failures are visible and the pipeline never runs stale code silently. S3 upload success is verifiable in CloudWatch logs.

| Task | Description | Done | Date |
|------|-------------|------|------|
| TASK-005 | Remove `continue-on-error: true` from both Lambda code update steps in `deploy-apps.yml` | | |
| TASK-006 | Add a "Wait for Lambda update" step after each update-function-code call using `aws lambda wait function-updated` to ensure the update is fully applied before the workflow completes | | |
| TASK-007 | Add S3 upload verification in `s3.ts` `uploadArtifactToS3()` — after all PutObject calls, do a `ListObjectsV2` on the artifact prefix and log the count + keys. Throw if count < expected (article.md + metadata.json + research.json + assets) | | |
| TASK-008 | Add structured log lines in `index.ts` after each publish: `[topic] S3 upload verified: s3://{bucket}/{prefix}/pending/{artifactId}/ ({n} objects)` | | |

**Files touched:**
- `.github/workflows/deploy-apps.yml` — remove `continue-on-error`, add wait steps
- `auto-blogger/src/s3.ts` — add `verifyArtifactUpload()` function
- `auto-blogger/src/outputAdapterS3Ses.ts` — call `verifyArtifactUpload()` after `uploadArtifactToS3()`

**Tests:** Unit test for `verifyArtifactUpload` with mocked S3 responses (success + missing file cases).

**Verify:**
- Push a change to `auto-blogger/**` — both Lambda update steps must succeed or the job fails
- Check CloudWatch logs after next scheduled run — verify "S3 upload verified" log line appears

---

### Phase 3 — Import schedule alignment + manifest freshness

**Goal (GOAL-003):** Articles reach the live website within ~2 hours of generation. The internal-links manifest stays current after every import-driven deploy.

| Task | Description | Done | Date |
|------|-------------|------|------|
| TASK-009 | Update `.github/workflows/import-auto-blog-content.yml` cron schedule from 2x to 5x daily, timed ~1h after each generation slot. **AEST (UTC+10) conversions:** 9am AEST = 23:00 UTC prev day, 10am AEST = 00:00 UTC, 11am AEST = 01:00 UTC, 2pm AEST = 04:00 UTC, 4pm AEST = 06:00 UTC. Import crons: `0 0 * * *` (catches 9am topic + 10am news), `30 1 * * *` (catches 11am topic), `0 5 * * *` (catches 2pm topic), `0 7 * * *` (catches 4pm topic), `0 13 * * *` (afternoon catch-all). **DST note:** GHA cron is UTC-only and does not auto-adjust. During AEDT (Oct-Apr, UTC+11), generation times shift 1h earlier in UTC, so the first import cron catches the 9am topic ~2h after generation instead of ~1h. This is within the REQ-003 target of ~2h max wait. No AEDT-specific cron adjustment needed | | |
| TASK-010 | Add a "Publish internal-links manifest" step to `import-auto-blog-content.yml` after the website deploy steps, mirroring the step in `deploy-website.yml` — runs `node --import tsx scripts/publishInternalLinksManifest.mts` from the `website/` directory | | |
| TASK-011 | Add concurrency guard to `deploy-website.yml` with group `website-deploy` and `cancel-in-progress: true`. When the import workflow pushes content changes, the triggered `deploy-website.yml` run is cancelled (since the import workflow already deployed the site). The import workflow keeps its own concurrency group (`import-auto-blog-content`, `cancel-in-progress: false`). The only value of the triggered `deploy-website.yml` run is the manifest publish step — but Phase 3 TASK-010 adds that to the import workflow, so the triggered run is fully redundant and safe to cancel | | |

**Files touched:**
- `.github/workflows/import-auto-blog-content.yml` — update cron entries, add manifest publish step
- `.github/workflows/deploy-website.yml` — add concurrency group

**Tests:** Manual — trigger a manual workflow_dispatch and verify manifest is published after deploy.

**Verify:**
- After import run: check S3 `manifests/element-armory/internal-links.json` has an updated `generatedAt` timestamp
- Verify `deploy-website.yml` respects concurrency when triggered by import push

---

### Phase 4 — Email notifications (per-article + published confirmation)

**Goal (GOAL-004):** Each generated article triggers an immediate per-article email. After import+deploy succeeds, a separate "published to website" email lists all newly-live articles with their URLs.

| Task | Description | Done | Date |
|------|-------------|------|------|
| TASK-012 | Add a new notification mode `"all"` to the `NotificationConfig` type in `projectConfig.ts` (values: `"none"`, `"digest"`, `"per-article"`, `"all"`). Change `auto-blogger.config.mts` to use `mode: "all"`. This mode sends BOTH per-article and digest emails | | |
| TASK-013 | Update `S3SesOutputAdapter.notifyDigest()` to fire when mode is `"digest"` OR `"all"`. Update `S3SesOutputAdapter.notifyPerArticle()` to fire when mode is `"per-article"` OR `"all"`. Update `LocalWriteOutputAdapter` with the same mode logic for local-dev parity | | |
| TASK-013b | Add a `notifyPerArticle` call to the `runNewsOnce()` pipeline in `index.ts` for news posts (currently only topics call it). Use the same mode check — fires when mode is `"per-article"` or `"all"`. This ensures news articles also get per-article emails | | |
| TASK-014 | Add `sendPublishedNotification()` to `auto-blogger/src/email.ts` — sends an email with subject "Published to website: N article(s)" listing each article's title, URL path (e.g., `/topics/hub/cluster/slug`), and a link to the live page. Base URL comes from env var `AUTO_BLOG_SITE_URL` (default: `https://elementarmory.com`), consistent with how `NEXT_PUBLIC_APP_URL` is used in the GHA workflow | | |
| TASK-015 | Add new `auto-blogger/src/notifyPublished.ts` script — reads the import manifest JSON from `dist/import-manifest.json` (Phase 1), loads `AUTO_BLOG_NOTIFY_TO`, `AUTO_BLOG_NOTIFY_FROM`, `AUTO_BLOG_SITE_URL` from env, calls `sendPublishedNotification()`. Requires AWS credentials for SES | | |
| TASK-016 | Add a "Send published notification" step to `import-auto-blog-content.yml` after the "Mark artifacts published" step. Runs `tsx src/notifyPublished.ts`. Passes `AUTO_BLOG_NOTIFY_TO`, `AUTO_BLOG_NOTIFY_FROM`, `AUTO_BLOG_SITE_URL`, and SES env vars. Only runs when `steps.changes.outputs.has_changes == 'true'` | | |

**Files touched:**
- `auto-blogger/src/projectConfig.ts` — add `"all"` to `NotificationConfig.mode` union type
- `auto-blogger.config.mts` — change notify mode to `"all"`
- `auto-blogger/src/outputAdapterS3Ses.ts` — update mode checks in `notifyDigest()` and `notifyPerArticle()`; update `LocalWriteOutputAdapter` with same mode logic
- `auto-blogger/src/index.ts` — add `notifyPerArticle` call in `runNewsOnce()` for news post articles
- `auto-blogger/src/email.ts` — add `sendPublishedNotification()`
- `auto-blogger/src/notifyPublished.ts` — new file, reads manifest + sends email
- `.github/workflows/import-auto-blog-content.yml` — add notification step with env vars

**Tests:** Unit test for `sendPublishedNotification` HTML/text output structure.

**Verify:**
- After Lambda run: receive per-article email for each generated article AND a digest summary
- After import+deploy: receive "Published to website" email with clickable live URLs
- If import finds no pending artifacts: no published email sent

---

### Phase 5 — Content quality scoring and quality gate (env-gated)

**Goal (GOAL-005):** When `AUTO_BLOG_SEO_SCORE=true`, each article gets an AI-powered SEO quality score with actionable suggestions included in the per-article email. When `AUTO_BLOG_QUALITY_GATE=strict`, articles with critical SEO deficiencies are not uploaded to S3.

Env vars:
- `AUTO_BLOG_SEO_SCORE` — `true` to enable the scoring pass (default: `false`). Adds one AI call per article (~$0.001/article with Haiku).
- `AUTO_BLOG_QUALITY_GATE` — `off` (default, publish everything), `warn` (publish + quality warnings in email), `strict` (block articles that fail critical checks from S3 upload).

| Task | Description | Done | Date |
|------|-------------|------|------|
| TASK-017 | Add `seoScore` and `qualityGate` fields to `AutoBloggerConfig` in `config.ts`, reading from `AUTO_BLOG_SEO_SCORE` (boolean) and `AUTO_BLOG_QUALITY_GATE` (enum: `off`/`warn`/`strict`, default `off`) | | |
| TASK-018 | Create `auto-blogger/src/seoScoring.ts` with `scoreSeoQuality(article, keyword, model)` — an AI call using the same `textModel` configured for generation (reuses the existing config, no separate model env var) that returns a structured score: `{ overall: number (0-100), title: { score, suggestion }, excerpt: { score, suggestion }, upfrontAnswer: { score, suggestion }, headingOptimization: { score, suggestion }, contentDepth: { score, suggestion }, featuredSnippetReady: { score, suggestion }, readability: { score, suggestion } }`. Only called when `AUTO_BLOG_SEO_SCORE=true` | | |
| TASK-019 | Create `auto-blogger/src/seoScoringNews.ts` with `scoreNewsSeoQuality(post)` — same structure adapted for news posts (no FAQ, shorter form, different expectations) | | |
| TASK-020 | Integrate scoring into `runOneTopicPipeline()` in `index.ts` — after `createArtifact()`, call `scoreSeoQuality()` if enabled. Add an optional `seoScore` field to `ArticleResult` in `outputAdapter.ts` so the score flows into emails and digest | | |
| TASK-021 | Integrate scoring into `runNewsOnce()` in `index.ts` — same pattern, using `scoreNewsSeoQuality()` for news posts | | |
| TASK-022 | Update `sendArticleNotification()` in `email.ts` to include the SEO score card in the email body when present — color-coded (green ≥80, yellow ≥60, red <60) with per-category suggestion text | | |
| TASK-023 | Implement quality gate logic in `runOneTopicPipeline()` and `runNewsOnce()` — when `qualityGate=strict`, check `validateArticleQuality()` results for critical warnings (duplicate slug, unshipped feature claims, body too short). If any critical warning exists, skip S3 upload, log the rejection, and include it as a failure in the digest with the specific warnings | | |
| TASK-024 | Enhance `quality.ts` to categorize warnings as `critical` vs `advisory`. Critical: duplicate slug, unshipped feature claims, body < 4000 chars, zero internal links. Advisory: everything else (link count warnings, readability suggestions, etc.) | | |
| TASK-025 | Improve generation prompts in `generateSection.ts` for better SEO: add "write for featured snippets" guidance (use definition format for what-is queries, numbered lists for how-to queries), require primary keyword in first 100 words and at least one H2 | | |
| TASK-026 | Improve metadata prompt in `generateSection.ts` `buildMetadataPrompt()` — add explicit guidance for title (50-60 chars, primary keyword near start, include a power word or number), excerpt (150-160 chars, includes primary keyword, action-oriented language that encourages clicks) | | |
| TASK-027 | Improve news article draft prompt in `generateNewsArticle.ts` — add guidance for SEO-friendly titles (include the main topic keyword, 50-60 chars), structured excerpt, and clear section hierarchy | | |

**Files touched:**
- `auto-blogger/src/config.ts` — add `seoScore` and `qualityGate` config fields
- `auto-blogger/src/seoScoring.ts` — new file, SEO quality scoring for topic articles
- `auto-blogger/src/seoScoringNews.ts` — new file, SEO quality scoring for news posts
- `auto-blogger/src/index.ts` — integrate scoring + quality gate
- `auto-blogger/src/email.ts` — add SEO score card rendering
- `auto-blogger/src/quality.ts` — add critical/advisory categorization
- `auto-blogger/src/generateSection.ts` — enhance section and metadata prompts
- `auto-blogger/src/generateNewsArticle.ts` — enhance news prompts
- `auto-blogger/src/types.ts` — add `SeoScore` type
- `auto-blogger/src/outputAdapter.ts` — add optional `seoScore` field to `ArticleResult`

**Tests:**
- Unit test for `scoreSeoQuality` with mocked AI response
- Unit test for critical/advisory categorization in `quality.ts`
- Unit test for quality gate logic (strict mode blocks critical warnings)

**Verify:**
- Set `AUTO_BLOG_SEO_SCORE=true` locally, run `npm run dev` — verify scoring AI call fires and score appears in console output
- Set `AUTO_BLOG_QUALITY_GATE=strict` locally, generate an article with a known duplicate slug — verify it is NOT uploaded to S3
- Check email output includes the SEO score card with color-coded categories

---

### Phase 6 — Google Search Console integration (env-gated)

**Goal (GOAL-006):** When Google credentials and site URL are configured, the import workflow automatically submits the sitemap and requests indexing of each newly-published URL. Disabled by default — enabled by setting `GOOGLE_APPLICATION_CREDENTIALS` (or `GOOGLE_SERVICE_ACCOUNT_JSON`) and `GOOGLE_SEARCH_CONSOLE_SITE_URL`.

Env vars (set in GHA secrets, not in Lambda):
- `GOOGLE_APPLICATION_CREDENTIALS` — path to Google Cloud service account JSON key file, OR
- `GOOGLE_SERVICE_ACCOUNT_JSON` — inline JSON string of the service account key (for GHA secrets where file paths are impractical)
- `GOOGLE_SEARCH_CONSOLE_SITE_URL` — the property URL in Search Console (e.g., `https://elementarmory.com`)

Prerequisites (manual, one-time):
- Create a Google Cloud project with Search Console API and Indexing API enabled
- Create a service account and download the JSON key
- Add the service account email as a user on the Search Console property (Owner or Full permissions)
- Store the JSON key as a GHA secret (`GOOGLE_SERVICE_ACCOUNT_JSON`)

| Task | Description | Done | Date |
|------|-------------|------|------|
| TASK-028 | Add `@googleapis/webmasters` and `@googleapis/indexing` (scoped packages, not the monolithic `googleapis` which is ~280 sub-packages) as dependencies in `auto-blogger/package.json`. These are lightweight and won't bloat the Lambda zip. Add `google-auth-library` for auth | | |
| TASK-029 | Create `auto-blogger/src/googleSearchConsole.ts` with: `submitSitemap(siteUrl, sitemapUrl, auth)` — calls Search Console sitemaps API. `requestIndexing(urls, auth)` — calls Indexing API `urlNotifications:publish` with `type: URL_UPDATED` for each URL. `createAuth(credentialsJson)` — creates a Google JWT auth client from inline service account JSON (parsed from env var) | | |
| TASK-030 | Create `auto-blogger/src/notifySearchConsole.ts` — CLI script for GHA step. Reads the import manifest JSON (same one from Phase 1), authenticates via env vars, calls `submitSitemap()` and `requestIndexing()` for each published article URL. Logs results. Non-fatal — catches and warns on all errors so it never blocks the deploy | | |
| TASK-031 | Add a "Notify Google Search Console" step to `import-auto-blog-content.yml` after the "Send published notification" step. Only runs when `GOOGLE_SERVICE_ACCOUNT_JSON` is set (use `if: env.GOOGLE_SERVICE_ACCOUNT_JSON != ''`). Writes the JSON key to a temp file, sets `GOOGLE_APPLICATION_CREDENTIALS`, runs the script | | |
| TASK-032 | Add rate limiting to `requestIndexing()` — Google Indexing API has a quota of 200 requests/day. Log remaining quota after each call. If quota is exhausted, skip remaining URLs and log a warning | | |

**Files touched:**
- `auto-blogger/package.json` — add `googleapis` dependency
- `auto-blogger/src/googleSearchConsole.ts` — new file, Search Console + Indexing API client
- `auto-blogger/src/notifySearchConsole.ts` — new file, CLI script for GHA
- `.github/workflows/import-auto-blog-content.yml` — add Search Console notification step

**Tests:**
- Unit test for `createAuth` with mock credentials
- Unit test for `submitSitemap` and `requestIndexing` with mocked Google API responses
- Unit test for rate limiting logic

**Verify:**
- Set `GOOGLE_SERVICE_ACCOUNT_JSON` and `GOOGLE_SEARCH_CONSOLE_SITE_URL` in GHA secrets
- Trigger a manual import workflow with pending articles
- Check GHA logs for "Sitemap submitted" and "Indexing requested for: <url>" messages
- Verify in Google Search Console UI that the sitemap was submitted and URLs show "Crawled" status within 24-48h
- Without env vars set: step is skipped silently, no errors

---

## Alternatives considered

- **ALT-001** — Event-driven import (S3 notification → SNS → webhook → GHA). Rejected: requires an SNS topic, a webhook relay service (or Lambda), and GitHub webhook auth — significantly more infrastructure than adding cron entries.
- **ALT-002** — Lambda triggers GHA import via GitHub API after publishing. Rejected: requires a GitHub PAT stored in Lambda env vars, which is a security surface. Cron-aligned schedule achieves the same latency target (~2h) without cross-service auth.
- **ALT-003** — Quality gate always-on in strict mode. Rejected: until the scoring model is tuned, strict mode could block valid articles. Better to default to `off` and let the operator enable it after reviewing scores.
- **ALT-004** — Use Google URL Inspection API instead of Indexing API. Rejected: URL Inspection can check status but cannot request indexing. The Indexing API's `URL_UPDATED` notification is the closest to a "please index this" signal.
- **ALT-005** — DynamoDB "failed import" state instead of deferred S3 move. Rejected: adds state management complexity. Leaving artifacts in `pending/` and letting the next import run retry is simpler and achieves the same result.

## Dependencies

- **DEP-001** — `@googleapis/webmasters`, `@googleapis/indexing`, `google-auth-library` — scoped Google API packages (much smaller than monolithic `googleapis`). Only required for Phase 6. Will not significantly impact Lambda zip size.
- **DEP-002** — Google Cloud service account with Search Console API + Indexing API enabled. Manual one-time setup. Only required for Phase 6.
- **DEP-003** — Existing `@aws-sdk/client-s3`, `@aws-sdk/client-ses` packages already in `auto-blogger/package.json`.

## Testing strategy

- **Unit (node --test):** Quality categorization, SEO scoring response parsing, S3 verification logic, published notification HTML rendering, Search Console auth + API calls (all with mocked external services).
- **Integration:** Run import locally with `--dry-run` against real S3 bucket to verify atomicity fix.
- **Manual verification fallback:**
  - **Verify (human):** After Phase 1 deploy, intentionally break the build step and confirm artifacts remain in `pending/` after import run.
  - **Verify (human):** After Phase 4, confirm per-article email arrives within 2 minutes of Lambda completion.
  - **Verify (human):** After Phase 6, check Google Search Console UI for sitemap submission and indexing status.

## Code-quality principles applied

- Server: no business logic in scripts — import/publish logic in service functions, scripts are thin wrappers.
- DB: epoch-ms timestamps for DynamoDB state store. Note: `metadata.json` `createdAt` field is currently an ISO string (`new Date().toISOString()` in `artifact.ts`) — this is a pre-existing convention violation not addressed by this plan.
- Naming: named exports only; no `any`; `camelCase` / `PascalCase` / `UPPER_CASE`.
- Files: one responsibility per file; under 300 lines; `seoScoring.ts` and `seoScoringNews.ts` split from main quality module.
- Errors: all external calls (S3 verify, SES email, Google APIs) wrapped in try/catch with structured logging. Non-critical failures (email, Search Console) log warnings but never block the pipeline.

## Risks & assumptions

- **RISK-001** — Google Indexing API is officially for JobPosting/BroadcastEvent structured data, but is widely used for general content indexing requests. Google may start enforcing the content type restriction, in which case the indexing request step would become a no-op (sitemap submission would still work).
- **RISK-002** — More frequent imports (5x daily) increase GHA minutes usage. At ~5 minutes per run with early exit when no pending artifacts, this adds ~25 minutes/day of GHA compute.
- **RISK-003** — SEO scoring adds one AI call per article (~$0.001 with Haiku). At 4 articles/day, this is ~$0.004/day — negligible.
- **ASSUMPTION-001** — The import workflow can push to master without merge conflicts. This is currently true because the import only adds new files and the backfill commits are pushed before the content commit.
- **ASSUMPTION-002** — The `deploy-website.yml` workflow triggered by the import push will not conflict with the import's own build+deploy, given the concurrency guard added in Phase 3.
- **ASSUMPTION-003** — Lambda `uploadArtifactToS3()` currently succeeds (based on CloudWatch logs showing "Published artifact") — the primary failure is in the import workflow, not the Lambda itself.

## Out of scope

- Restructuring Lambda architecture (covered by the active migration plan)
- OpenGraph/Twitter card metadata on article pages (noted as follow-up)
- BreadcrumbList JSON-LD on article pages (noted as follow-up)
- Website UI changes
- Changing the article generation model or AI provider
- Automated A/B testing of titles or excerpts
- Google Analytics integration

## Architect notes

Architect review completed 2026-05-26. Three blocking issues were identified and fixed in-plan:

1. **B1 — Manifest passing contract underspecified.** Fixed: TASK-001/002/003 now specify the exact path (`auto-blogger/dist/import-manifest.json`), the manifest schema, and the env vars needed by the mark-published step.
2. **B2 — Notification mode logic incomplete.** Fixed: introduced a new `"all"` mode (TASK-012) instead of removing guards. Updated both `S3SesOutputAdapter` and `LocalWriteOutputAdapter` (TASK-013). Added per-article notification to the news pipeline (TASK-013b).
3. **B3 — Cron schedule labels wrong + DST not addressed.** Fixed: TASK-009 now has accurate AEST→UTC conversions and a DST note.

Warnings addressed in-plan:
- **W1** — Concurrency approach specified: `deploy-website.yml` gets `cancel-in-progress: true` since the import workflow already deploys.
- **W3** — Corrected code-quality claim about `metadata.json` `createdAt` (pre-existing ISO string, not addressed here).
- **W4** — Added `outputAdapter.ts` to Phase 5 files touched.
- **W5** — Added TASK-013b to add per-article notification for news posts.
- **W6** — Added note about markPublished failure being non-fatal (existing skip-if-exists logic prevents duplicates).

Suggestions adopted:
- S1: reuse `AUTO_BLOG_DRY_RUN` env var pattern instead of CLI flag.
- S2: use `AUTO_BLOG_SITE_URL` env var for published email base URL.
- S3: scoring reuses configured `textModel`, no separate model env var.
- S4: use scoped `@googleapis/webmasters` + `@googleapis/indexing` instead of monolithic `googleapis`.

Follow-up opportunities (not in scope):
- OpenGraph/Twitter card metadata on article pages
- BreadcrumbList JSON-LD on article pages
- Fix pre-existing `createdAt` ISO string violation in `artifact.ts`
