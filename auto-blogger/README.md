# Auto Blogger

Generates topical authority articles and daily news commentary for a project's blog. Runs as two AWS Lambda functions on EventBridge Scheduler.

- `topicsHandler` — picks N keywords from `list.md`, generates N articles in parallel via `Promise.all`, stages artifacts in S3, sends one digest email.
- `newsHandler` — fetches recent AI/developer news, generates one commentary post, stages in S3, sends digest email.

State (claimed keywords, published slugs) lives in DynamoDB. Internal-link candidates come from an S3 manifest published by the website CI after each deploy.

## Local dev

```bash
cp .env.example .env          # fill in ANTHROPIC_API_KEY + GEMINI_API_KEY at minimum
npm install
npm run dev                   # runs runParallelTopics(1) against filesystem state + local website content
```

Without `AUTO_BLOG_S3_BUCKET` set, the config falls back to filesystem `StateStore` and filesystem `ContentRepository` (reads `../website/content/topics` directly). With `AUTO_BLOG_DRY_RUN=true`, no S3 uploads or emails are sent and artifacts are written to `auto-blogger/dry-runs/<id>/`.

```bash
AUTO_BLOG_DRY_RUN=true npm run dev          # topic cycle, dry run
AUTO_BLOG_TARGET=news AUTO_BLOG_DRY_RUN=true npm run dev   # news cycle, dry run
```

## Local single-article generation

Regenerate one existing article and test image generation locally.

```bash
# Preview — writes to auto-blogger/dry-runs/<id>/
npm run generate:local -- --path ../website/content/topics/<hub>/<cluster>/<slug>.md

# Write — replaces the markdown and image in the website directories
npm run generate:local -- --path ../website/content/topics/<hub>/<cluster>/<slug>.md --write

# By keyword
npm run generate:local -- --keyword "how to copy css from any website"
```

Options: `--path`, `--keyword`, `--write`, `--no-image`, `--date YYYY-MM-DD`.

## Building the Lambda zip

```bash
npm run build:lambda      # produces dist/lambda/lambda.zip (~2–3 MB compressed)
npm run package:lambda    # same + prints zip stats
```

The zip is built by `build.lambda.mjs` (esbuild + adm-zip). `@aws-sdk/*` is excluded (provided by the Lambda Node 22 runtime). `jsdom` and `@mozilla/readability` are shipped as plain `node_modules` inside the zip because esbuild minification breaks jsdom's self-inspection.

## Production topology

Two Lambda functions in `terraform/lambda.tf`, both in `us-east-2`:

| Function | Handler | Schedule (Australia/Sydney) |
|---|---|---|
| `element-armory-prod-auto-blogger-topics` | `index.topicsHandler` | `09:00` daily |
| `element-armory-prod-auto-blogger-news` | `index.newsHandler` | `10:00` daily |

State: DynamoDB on-demand table `element-armory-prod-auto-blogger-state`.

Code updates: GitHub Actions `build_auto_blogger_lambda` job builds the zip and calls `aws lambda update-function-code` on every push to `master` touching `auto-blogger/**`.

Config updates (env vars, memory, timeout): `terraform apply`.

## Production env vars (set by terraform)

| Variable | Source |
|---|---|
| `ANTHROPIC_API_KEY` | `var.anthropic_api_key` |
| `GEMINI_API_KEY` | `var.gemini_api_key` |
| `OPENAI_API_KEY` | `var.openai_api_key` |
| `AUTO_BLOG_S3_BUCKET` | auto-blog S3 bucket name |
| `AUTO_BLOG_S3_PREFIX` | `auto-blogger` |
| `AUTO_BLOG_NOTIFY_TO` | `var.auto_blog_notify_to` |
| `AUTO_BLOG_NOTIFY_FROM` | `var.from_email` |
| `AUTO_BLOG_STATE_TABLE` | DynamoDB table name |
| `AWS_SES_REGION` | `us-east-1` |
| `DAILY_ARTICLES` | `4` |
| `AUTO_BLOG_IMAGE_MODEL` | `gemini-2.5-flash-image` |
| `AUTO_BLOG_IMAGE_STYLE` | `stencil` |
| `AUTO_BLOG_IMAGE_PALETTE` | `vibrant` |

## Project config shape

All Element-Armory-specific values live in `auto-blogger.config.mts` at the repo root. To point the auto-blogger at a different project, copy `auto-blogger/` to the target repo and write a new config file — see `PORTING.md`.

```ts
import type { AutoBloggerProjectConfig } from "./auto-blogger/src/projectConfig.js";

const config: AutoBloggerProjectConfig = {
  brand: { productName, shortName, tagline, voice, unshippedFeatureClaims },
  content: { listPath, guidePath, rulesPath, copywriterPromptPath },
  news: { queries, relevanceKeywords, excludeKeywords, excludedDomains, userAgent },
  contentRepository: { type: "s3-manifest", bucket, manifestKey, region },
  output: { type: "s3-staging", bucket, prefix, notify: { mode: "digest", to, from } },
  stateStore: { type: "dynamodb", tableName, region },
  author: "...",
};
export default config;
```

## Smoke-testing a Lambda manually

```bash
aws lambda invoke \
  --function-name element-armory-prod-auto-blogger-topics \
  --payload '{}' --cli-binary-format raw-in-base64-out \
  --region us-east-2 /tmp/out.json && cat /tmp/out.json
```

Then check CloudWatch Logs (`/aws/lambda/element-armory-prod-auto-blogger-topics`) and S3 (`s3://<bucket>/auto-blogger/pending/`) for the artifact.
