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
  type: "hub" | "cluster" | "article";
  hubSlug: string;
  hubTitle: string;
  clusterSlug?: string;
  clusterTitle?: string;
  slug?: string;
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
};

export type ArtifactAssetMeta = {
  websiteRelativePath: string;
  s3Name: string;
  contentType: string;
  sha256: string;
};

export type ArticleArtifactMetadata = {
  artifactId: string;
  createdAt: string;
  targetType: "topic";
  keywordId: string;
  keyword: string;
  hubSlug: string;
  clusterSlug: string;
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
