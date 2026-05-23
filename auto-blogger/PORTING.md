# Porting auto-blogger to another project

The `auto-blogger/` directory is a vendor-copyable unit. A sibling project copies the directory, writes one config file at its repo root, adds terraform, and gets the same Lambda deployment shape.

## Steps

### 1. Copy the directory

```bash
cp -r auto-blogger/ ../your-project/auto-blogger/
```

### 2. Write `auto-blogger.config.mts` at the target repo root

```ts
import type { AutoBloggerProjectConfig } from "./auto-blogger/src/projectConfig.js";

const config: AutoBloggerProjectConfig = {
  brand: {
    productName: "Your Product – Tagline",
    shortName: "Your Product",
    tagline: "One-line promise.",
    voice: "developer-focused, technical but clear",
    unshippedFeatureClaims: [],            // strings that must never appear in articles
  },
  content: {
    listPath: "./auto-blogger/list.md",    // keyword list for topic articles
    guidePath: "./auto-blogger/guide.md",  // article structure guide
    rulesPath: "./auto-blogger/rules.md",  // writing rules
    copywriterPromptPath: "./auto-blogger/copywriter-prompt.md",
  },
  news: {
    queries: ["your topic AI", "your topic tools"],
    relevanceKeywords: ["ai", "your-keyword"],
    excludeKeywords: ["unrelated", "noise"],
    excludedDomains: ["youtube.com", "reddit.com"],
    userAgent: "Mozilla/5.0 (compatible; YourProjectAutoBlogger/1.0; +https://yourproject.com)",
  },
  contentRepository: process.env.AUTO_BLOG_S3_BUCKET
    ? {
        type: "s3-manifest",
        bucket: process.env.AUTO_BLOG_S3_BUCKET,
        manifestKey: "manifests/your-project/internal-links.json",
        region: process.env.AWS_REGION,
      }
    : { type: "filesystem", websiteRoot: "./website" },
  output: process.env.AUTO_BLOG_S3_BUCKET
    ? {
        type: "s3-staging",
        bucket: process.env.AUTO_BLOG_S3_BUCKET,
        prefix: process.env.AUTO_BLOG_S3_PREFIX ?? "auto-blogger",
        notify: process.env.AUTO_BLOG_NOTIFY_TO
          ? { mode: "digest", to: process.env.AUTO_BLOG_NOTIFY_TO, from: process.env.AUTO_BLOG_NOTIFY_FROM! }
          : { mode: "none" },
      }
    : { type: "local-write", outputDir: "./auto-blogger/dry-runs", notify: { mode: "none" } },
  stateStore: process.env.AUTO_BLOG_STATE_TABLE
    ? { type: "dynamodb", tableName: process.env.AUTO_BLOG_STATE_TABLE, region: process.env.AWS_REGION ?? "us-east-2" }
    : { type: "filesystem", statePath: "./auto-blogger/data/auto-blogger-state.json" },
  author: "Your Team",
};

export default config;
```

Update `list.md`, `guide.md`, `rules.md`, and `copywriter-prompt.md` for your project's brand and topic area.

### 3. Add the npm dependencies

```bash
cd auto-blogger && npm install
```

Verify `auto-blogger.config.mts` is importable:

```bash
npm run typecheck
npm test
```

### 4. Add terraform

Copy `terraform/lambda.tf` from the Element Armory repo as a starting point. Adjust:

- `var.project` — your project name (namespaces the DynamoDB table and Lambda names)
- `var.environment` — `prod`, `staging`, etc.
- `var.auto_blog_notify_to` — notification email
- `var.from_email` — SES verified sender
- S3 bucket reference — point `aws_s3_bucket.auto_blog` at your project's auto-blog bucket

Add to `variables.tf`:

```hcl
variable "enable_auto_blogger_lambdas" {
  type    = bool
  default = false
}
```

### 5. Add the internal-links manifest publisher to your website CI

After each website deploy, run:

```bash
AUTO_BLOG_S3_BUCKET=<your-bucket> node --import tsx website/scripts/publishInternalLinksManifest.mts
```

Adapt `website/scripts/publishInternalLinksManifest.mts` to walk your project's content directory structure. The manifest key must match `contentRepository.manifestKey` in your config.

The deployer IAM user needs `s3:PutObject` on the auto-blog bucket.

### 6. Build and deploy

```bash
cd auto-blogger && npm run build:lambda
```

Run `terraform apply` with `enable_auto_blogger_lambdas = true`. The Lambda zip must exist at `auto-blogger/dist/lambda/lambda.zip` before the first apply.

Add a GitHub Actions job equivalent to `build_auto_blogger_lambda` in `.github/workflows/deploy-apps.yml` to push code updates automatically.

### 7. Add env vars to prod.tfvars

```hcl
enable_auto_blogger_lambdas = true
```

And ensure `auto_blog_notify_to` is set in your variables.

## Notes

- The DynamoDB table name is `{project}-{env}-auto-blogger-state`. Tables in different projects never collide even if they share an AWS account.
- Today's publish cadence with EventBridge is a bulk publish at 09:00 Sydney rather than staggered throughout the day. The importer CI schedule determines when articles appear on the website.
- The `copywriter-prompt.md` shipped with the package is the Element Armory voice. Replace it with your project's voice before deploying.
