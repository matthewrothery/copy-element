import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { z } from "zod";
import type { ContentRepository } from "./contentRepository.js";
import type { InternalLinkCandidate } from "./types.js";

const InternalLinkCandidateSchema = z.object({
  title: z.string(),
  topic: z.string(),
  url: z.string(),
  type: z.enum(["hub", "cluster", "article", "blog"]),
  hubSlug: z.string(),
  hubTitle: z.string(),
  clusterSlug: z.string().optional(),
  clusterTitle: z.string().optional(),
  slug: z.string().optional(),
  linkKeywords: z.array(z.string()).optional(),
});

const ManifestSchema = z.object({
  generatedAt: z.number(),
  websiteRoot: z.string().optional(),
  candidates: z.array(InternalLinkCandidateSchema),
  publishedKeywordIds: z.array(z.string()),
  existingBlogSlugs: z.array(z.string()).optional(),
});

type Manifest = z.infer<typeof ManifestSchema>;

export class S3ManifestContentRepository implements ContentRepository {
  private cached: Manifest | undefined;

  constructor(
    private readonly bucket: string,
    private readonly manifestKey: string,
    private readonly region?: string
  ) {}

  private async getManifest(): Promise<Manifest> {
    if (this.cached) return this.cached;
    const client = new S3Client({ region: this.region ?? process.env.AWS_REGION ?? "us-east-2" });
    const resp = await client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: this.manifestKey })
    );
    if (!resp.Body) throw new Error(`S3 manifest body empty: s3://${this.bucket}/${this.manifestKey}`);
    const text = await resp.Body.transformToString("utf-8");
    this.cached = ManifestSchema.parse(JSON.parse(text));
    return this.cached;
  }

  async loadCandidates(): Promise<InternalLinkCandidate[]> {
    const m = await this.getManifest();
    return m.candidates as InternalLinkCandidate[];
  }

  async loadPublishedKeywordIds(): Promise<Set<string>> {
    const m = await this.getManifest();
    return new Set(m.publishedKeywordIds);
  }

  async loadExistingBlogSlugs(): Promise<Set<string>> {
    const m = await this.getManifest();
    return new Set(m.existingBlogSlugs ?? []);
  }
}
