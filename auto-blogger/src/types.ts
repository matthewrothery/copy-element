import type { DiagramSpec } from "./diagrams/schema.js";

export type FaqItem = {
  question: string;
  answer: string;
};

export type TopicKeyword = {
  id: string;
  hubSlug: string;
  hubTitle: string;
  clusterSlug: string;
  clusterTitle: string;
  keyword: string;
};

export type ResearchResult = {
  title: string;
  url: string;
  snippet: string;
  content?: string;
  query?: string;
  focus?: "general" | "statistics";
};

export type InternalLinkCandidate = {
  title: string;
  topic: string;
  url: string;
  type: "hub" | "cluster" | "article" | "blog";
  hubSlug: string;
  hubTitle: string;
  clusterSlug?: string;
  clusterTitle?: string;
  slug?: string;
  linkKeywords?: string[];
  /** Absolute path to the article's markdown file on disk (article candidates only). */
  filePath?: string;
};

export type BackfillFileChange = {
  path: string;
  addedTargets: { id: string; anchor: string }[];
};

export type BackfillSummary = {
  filesChanged: number;
  linksAdded: number;
  perFile: BackfillFileChange[];
  commitSha?: string;
  pushed: boolean;
  warnings: string[];
};

export type GeneratedArticle = {
  hubSlug: string;
  hubTitle: string;
  clusterSlug: string;
  clusterTitle: string;
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  readTime: string;
  faq: FaqItem[];
  relatedSlugs: string[];
  body: string;
  imagePrompt: string;
  /** Structured diagram specs; rendered to SVG in the pipeline (see applyDiagrams). */
  diagrams: DiagramSpec[];
  /** Anchor-quality phrases used by the backfill pass to find link opportunities in other posts. */
  linkKeywords: string[];
};

export type ArtifactAssetMeta = {
  websiteRelativePath: string;
  s3Name: string;
  contentType: string;
  sha256: string;
};

export type NewsItem = {
  title: string;
  url: string;
  publishedAt: string;
  source: string;
  publisherUrl?: string;
  description?: string;
  content?: string;
};

export type GeneratedBlogPost = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  readTime: string;
  body: string;
  imagePrompt: string;
  sourceItems: NewsItem[];
};

export type ArticleArtifactMetadata = {
  artifactId: string;
  createdAt: string;
  targetType: "topic" | "blog";
  keywordId?: string;
  keyword?: string;
  hubSlug?: string;
  clusterSlug?: string;
  slug: string;
  title: string;
  date: string;
  articlePath: string;
  /** Cover image path under website/public (hero). */
  imagePath: string;
  /** All publishable binary assets including cover and diagram SVGs (optional on legacy artifacts). */
  assets?: ArtifactAssetMeta[];
  researchPath: string;
  model: string;
  imageModel: string;
  promptVersion: string;
  sourceUrls: string[];
  checksums: {
    articleSha256: string;
    /** Legacy pending artifacts only (pre-multi-asset). */
    imageSha256?: string;
  };
  /** Present when `validateArticleQuality` reported issues; pipeline continues so copy is not discarded. */
  qualityWarnings?: string[];
};

export type ArticleArtifact = {
  artifactId: string;
  articleMarkdown: string;
  /** Ordered publish payloads (cover first, then diagrams). */
  assetBuffers: Array<{
    s3Name: string;
    buffer: Buffer<ArrayBufferLike>;
    websiteRelativePath: string;
    contentType: string;
  }>;
  metadata: ArticleArtifactMetadata;
  research: ResearchResult[];
};

export type SeoScoreCategory = {
  score: number;
  suggestion: string;
};

export type SeoScore = {
  overall: number;
  title: SeoScoreCategory;
  excerpt: SeoScoreCategory;
  upfrontAnswer: SeoScoreCategory;
  headingOptimization: SeoScoreCategory;
  contentDepth: SeoScoreCategory;
  featuredSnippetReady: SeoScoreCategory;
  readability: SeoScoreCategory;
};

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
};

export type AutoBloggerState = {
  processedKeywordIds: string[];
  processedSlugs: string[];
  failedKeywordIds: string[];
  lastRunAt?: number;
  emailFailures: string[];
};
