import type { AutoBloggerProjectConfig } from "./auto-blogger/src/projectConfig.js";

/**
 * Project-specific configuration for the Element Armory auto-blogger.
 *
 * Secrets and per-env values (S3 bucket name, DynamoDB table, notify addresses)
 * come from environment variables set by terraform — see `terraform/lambda.tf`
 * and `terraform/ec2.tf` (for the EC2 dev path, until it is retired).
 */
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
    copywriterPromptPath: "./auto-blogger/copywriter-prompt.md",
  },
  news: {
    queries: ["vibe coding AI", "AI UI tools", "AI frontend tools", "AI coding agents"],
    relevanceKeywords: [
      "ai",
      "vibe cod",
      "coding agent",
      "frontend",
      "developer",
      "design system",
      "ui tool",
      "cursor",
      "windsurf",
      "claude code",
    ],
    excludeKeywords: ["one ui", "galaxy", "samsung", "android update", "smartphone"],
    excludedDomains: [
      "youtube.com",
      "reddit.com",
      "pinterest.com",
      "amazon.com",
      "facebook.com",
      "twitter.com",
      "x.com",
      "tiktok.com",
    ],
    userAgent:
      "Mozilla/5.0 (compatible; ElementArmoryAutoBlogger/1.0; +https://elementarmory.com)",
  },
  contentRepository: process.env.AUTO_BLOG_S3_BUCKET
    ? {
        type: "s3-manifest",
        bucket: process.env.AUTO_BLOG_S3_BUCKET,
        manifestKey: "manifests/element-armory/internal-links.json",
        region: process.env.AWS_REGION,
      }
    : {
        type: "filesystem",
        websiteRoot: "./website",
      },
  output: process.env.AUTO_BLOG_S3_BUCKET
    ? {
        type: "s3-staging",
        bucket: process.env.AUTO_BLOG_S3_BUCKET,
        prefix: process.env.AUTO_BLOG_S3_PREFIX ?? "auto-blogger",
        notify:
          process.env.AUTO_BLOG_NOTIFY_TO && process.env.AUTO_BLOG_NOTIFY_FROM
            ? {
                mode: "digest",
                to: process.env.AUTO_BLOG_NOTIFY_TO,
                from: process.env.AUTO_BLOG_NOTIFY_FROM,
              }
            : { mode: "none" },
      }
    : {
        type: "local-write",
        outputDir: "./auto-blogger/dry-runs",
        notify: { mode: "none" },
      },
  stateStore: process.env.AUTO_BLOG_STATE_TABLE
    ? {
        type: "dynamodb",
        tableName: process.env.AUTO_BLOG_STATE_TABLE,
        region: process.env.AWS_REGION ?? "us-east-2",
      }
    : {
        type: "filesystem",
        statePath:
          process.env.AUTO_BLOG_STATE_PATH ?? "./auto-blogger/data/auto-blogger-state.json",
      },
  author: "Element Armory Team",
};

export default config;
