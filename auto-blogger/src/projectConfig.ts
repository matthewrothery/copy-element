/**
 * Project-agnostic configuration shape for the auto-blogger.
 *
 * Consuming projects supply one `auto-blogger.config.ts` at the repo root
 * exporting an `AutoBloggerProjectConfig` default. All Element-Armory-specific
 * values live there — brand identity, news queries, content paths, output
 * destination, content-repository source, state-store backend.
 *
 * Secrets and per-environment settings (API keys, S3 bucket name, notify
 * addresses, DynamoDB table name) come from environment variables that the
 * config file references via `process.env.*` — terraform owns those values.
 */

export type BrandConfig = {
  /** Long product name used in system prompts (e.g. "Element Armory – Capture UI Elements"). */
  productName: string;
  /** Short product name used in UI labels and references. */
  shortName: string;
  /** Core tagline string included verbatim in voice instructions. */
  tagline: string;
  /** Voice descriptor injected into LLM system prompts. */
  voice: string;
  /**
   * Phrases the model must never claim are currently available. Used to build
   * "Never claim X is currently available" lines in system prompts. Each entry
   * is a complete claim (e.g. "JSX export is currently available").
   */
  unshippedFeatureClaims: string[];
};

export type NewsConfig = {
  /** Google News RSS query strings. */
  queries: string[];
  /** Lowercase keywords/phrases an item must match (any one) to be considered relevant. */
  relevanceKeywords: string[];
  /** Lowercase keywords/phrases that disqualify an item regardless of relevance. */
  excludeKeywords: string[];
  /** Hostnames to drop wholesale (substring match on lowercase host). */
  excludedDomains: string[];
  /** HTTP User-Agent string used for news + research fetches. */
  userAgent: string;
};

export type ContentConfig = {
  /** Path to the markdown keyword list (relative to project root). */
  listPath: string;
  /** Path to the topical strategy guide markdown. */
  guidePath: string;
  /** Path to the extra-rules markdown. */
  rulesPath: string;
  /**
   * Path to the master copywriter prompt. Defaults to the bundled
   * `auto-blogger/copywriter-prompt.md` if omitted.
   */
  copywriterPromptPath?: string;
};

export type S3ManifestContentRepositoryConfig = {
  type: "s3-manifest";
  bucket: string;
  /** S3 key of the JSON manifest published by the website CI. */
  manifestKey: string;
  region?: string;
};

export type FilesystemContentRepositoryConfig = {
  type: "filesystem";
  /** Absolute or project-relative path to the website root (containing content/topics, content/blog). */
  websiteRoot: string;
};

export type ContentRepositoryConfig =
  | S3ManifestContentRepositoryConfig
  | FilesystemContentRepositoryConfig;

export type NotificationConfig =
  | {
      mode: "digest";
      to: string;
      from: string;
    }
  | {
      mode: "per-article";
      to: string;
      from: string;
    }
  | { mode: "none" };

export type S3StagingOutputConfig = {
  type: "s3-staging";
  bucket: string;
  prefix: string;
  notify: NotificationConfig;
};

export type LocalWriteOutputConfig = {
  type: "local-write";
  /** Local directory for dry-run artifact output. */
  outputDir: string;
  notify: NotificationConfig;
};

export type OutputConfig = S3StagingOutputConfig | LocalWriteOutputConfig;

export type DynamoDbStateStoreConfig = {
  type: "dynamodb";
  tableName: string;
  region: string;
};

export type FilesystemStateStoreConfig = {
  type: "filesystem";
  /** Path to the state JSON file. */
  statePath: string;
};

export type StateStoreConfig = DynamoDbStateStoreConfig | FilesystemStateStoreConfig;

export type AutoBloggerProjectConfig = {
  brand: BrandConfig;
  content: ContentConfig;
  news: NewsConfig;
  contentRepository: ContentRepositoryConfig;
  output: OutputConfig;
  stateStore: StateStoreConfig;
  /** Display name used as the article author in frontmatter. */
  author: string;
};
