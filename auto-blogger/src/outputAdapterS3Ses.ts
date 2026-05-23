import { uploadArtifactToS3, getArtifactImageSignedUrl } from "./s3.js";
import { sendArticleNotification, sendDigestNotification } from "./email.js";
import type { ArticleArtifact, TokenUsage } from "./types.js";
import type { NotificationConfig } from "./projectConfig.js";
import type { ArticleResult, DigestSummary, OutputAdapter } from "./outputAdapter.js";

export class S3SesOutputAdapter implements OutputAdapter {
  constructor(
    private readonly bucket: string,
    private readonly prefix: string,
    private readonly notify: NotificationConfig
  ) {}

  async publish(artifact: ArticleArtifact): Promise<{ publishedAt: number; coverUrl?: string }> {
    await uploadArtifactToS3(this.bucket, this.prefix, artifact);
    const coverExt = artifact.metadata.imagePath.split(".").pop() ?? "png";
    const coverUrl = await getArtifactImageSignedUrl(
      this.bucket,
      this.prefix,
      artifact.artifactId,
      coverExt
    );
    return { publishedAt: Date.now(), coverUrl };
  }

  async notifyDigest(summary: DigestSummary): Promise<void> {
    if (this.notify.mode !== "digest") return;
    await sendDigestNotification({
      to: this.notify.to,
      from: this.notify.from,
      summary,
    });
  }

  async notifyPerArticle(
    artifact: ArticleArtifact,
    tokenUsage: TokenUsage,
    model: string,
    coverUrl?: string
  ): Promise<void> {
    if (this.notify.mode !== "per-article") return;
    await sendArticleNotification({
      to: this.notify.to,
      from: this.notify.from,
      artifact,
      model,
      imageUrl: coverUrl,
      tokenUsage,
    });
  }
}

export class LocalWriteOutputAdapter implements OutputAdapter {
  // Lightweight wrapper used by dry-runs / local-write mode. Delegates the
  // actual filesystem write to localPublish.ts via the caller; here we only
  // expose a minimal contract that lets index.ts treat dry-run vs. S3
  // uniformly.
  constructor(private readonly notify: NotificationConfig = { mode: "none" }) {}

  async publish(_artifact: ArticleArtifact): Promise<{ publishedAt: number; coverUrl?: string }> {
    return { publishedAt: Date.now() };
  }

  async notifyDigest(_summary: DigestSummary): Promise<void> {
    if (this.notify.mode === "none") return;
    console.log("[output] local-write mode: skipping digest email.");
  }

  async notifyPerArticle(
    _artifact: ArticleArtifact,
    _tokenUsage: TokenUsage,
    _model: string,
    _coverUrl?: string
  ): Promise<void> {
    if (this.notify.mode === "none") return;
    console.log("[output] local-write mode: skipping per-article email.");
  }
}

export type { ArticleResult, DigestSummary };
