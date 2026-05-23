import type { ArticleArtifact, TokenUsage } from "./types.js";

export type ArticleResult = {
  artifact: ArticleArtifact;
  tokenUsage: TokenUsage;
  /** Signed URL for the cover image (S3 staging only). */
  coverUrl?: string;
};

export type DigestSummary = {
  cycle: "topics" | "news";
  date: string;
  textModel: string;
  results: ArticleResult[];
  failures: Array<{
    label: string;
    error: string;
  }>;
};

export interface OutputAdapter {
  /**
   * Stages the artifact (writes article + assets + metadata) and returns a
   * signed cover URL if applicable. Idempotent if the artifactId already
   * exists.
   */
  publish(artifact: ArticleArtifact): Promise<{ publishedAt: number; coverUrl?: string }>;

  /**
   * Sends one digest email summarising every result + failure from a cycle.
   * No-ops if the notify mode is `none`.
   */
  notifyDigest(summary: DigestSummary): Promise<void>;

  /**
   * Sends one email per article. Used for legacy per-article notification
   * mode (local dev parity).
   */
  notifyPerArticle(artifact: ArticleArtifact, tokenUsage: TokenUsage, model: string, coverUrl?: string): Promise<void>;
}
