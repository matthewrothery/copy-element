import crypto from "crypto";
import type { ArtifactAssetMeta, GeneratedArticle, GeneratedBlogPost, NewsItem, ResearchResult, ArticleArtifact } from "./types.js";
import type { DiagramAssetBuffer } from "./applyDiagrams.js";

function yyyymmddCompact(date: string): string {
  return date.replace(/-/g, "");
}

function sha256(input: Buffer<ArrayBufferLike> | string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function escapeYaml(input: string): string {
  return input.replace(/"/g, '\\"');
}

function buildBlogFrontmatter(
  post: GeneratedBlogPost,
  author: string,
  coverImage: string
): string {
  return [
    "---",
    `title: "${escapeYaml(post.title)}"`,
    `slug: "${post.slug}"`,
    `date: "${post.date}"`,
    `author: "${escapeYaml(author)}"`,
    `excerpt: "${escapeYaml(post.excerpt)}"`,
    `readTime: "${escapeYaml(post.readTime)}"`,
    `coverImage: "${coverImage}"`,
    "---",
  ].join("\n");
}

function buildFrontmatter(
  article: GeneratedArticle,
  author: string,
  coverImage: string,
  listKeywordId: string
): string {
  const faqYaml = article.faq
    .map(
      (item) =>
        `  - question: "${escapeYaml(item.question)}"\n    answer: "${escapeYaml(item.answer)}"`
    )
    .join("\n");
  const relatedYaml = article.relatedSlugs.map((slug) => `  - ${slug}`).join("\n");

  return [
    "---",
    `listKeywordId: "${escapeYaml(listKeywordId)}"`,
    `hub: ${article.hubSlug}`,
    `hubTitle: "${escapeYaml(article.hubTitle)}"`,
    `cluster: ${article.clusterSlug}`,
    `clusterTitle: "${escapeYaml(article.clusterTitle)}"`,
    `title: "${escapeYaml(article.title)}"`,
    `slug: "${article.slug}"`,
    `date: "${article.date}"`,
    `author: "${escapeYaml(author)}"`,
    `excerpt: "${escapeYaml(article.excerpt)}"`,
    `readTime: "${escapeYaml(article.readTime)}"`,
    `coverImage: "${coverImage}"`,
    "faq:",
    faqYaml || "  []",
    "relatedSlugs:",
    relatedYaml || "  []",
    "---",
  ].join("\n");
}

export function createArtifact(input: {
  article: GeneratedArticle;
  coverBuffer: Buffer<ArrayBufferLike>;
  coverExt: "png" | "jpeg" | "webp";
  diagramBuffers: DiagramAssetBuffer[];
  keywordId: string;
  keyword: string;
  sourceUrls: string[];
  model: string;
  imageModel: string;
  promptVersion: string;
  author: string;
  research: ResearchResult[];
  qualityWarnings?: string[];
}): ArticleArtifact {
  const artifactId = `${yyyymmddCompact(input.article.date)}-${input.article.slug}`;
  const baseDir = `website/public/topic-images/${input.article.hubSlug}/${input.article.clusterSlug}`;
  const coverFilename = `${input.article.slug}.${input.coverExt}`;
  const imagePath = `${baseDir}/${coverFilename}`;
  const articlePath = `website/content/topics/${input.article.hubSlug}/${input.article.clusterSlug}/${input.article.slug}.md`;
  const researchPath = `research/${artifactId}.json`;
  const coverImageField = `/topic-images/${input.article.hubSlug}/${input.article.clusterSlug}/${coverFilename}`;

  const frontmatter = buildFrontmatter(input.article, input.author, coverImageField, input.keywordId);
  const articleMarkdown = `${frontmatter}\n\n${input.article.body.trim()}\n`;

  const assetBuffers: ArticleArtifact["assetBuffers"] = [];

  const coverS3Name = `cover.${input.coverExt}`;
  assetBuffers.push({
    s3Name: coverS3Name,
    buffer: input.coverBuffer,
    websiteRelativePath: imagePath,
    contentType: `image/${input.coverExt}`,
  });

  const assetsMeta: ArtifactAssetMeta[] = [];

  for (const item of assetBuffers) {
    assetsMeta.push({
      websiteRelativePath: item.websiteRelativePath,
      s3Name: item.s3Name,
      contentType: item.contentType,
      sha256: sha256(item.buffer),
    });
  }

  for (const d of input.diagramBuffers) {
    const filename = `${input.article.slug}-diagram-${d.id}.svg`;
    const websiteRelativePath = `${baseDir}/${filename}`;
    const s3Name = `diagram-${d.id}.svg`;
    const buf = d.buffer;
    assetBuffers.push({
      s3Name,
      buffer: buf,
      websiteRelativePath,
      contentType: "image/svg+xml",
    });
    assetsMeta.push({
      websiteRelativePath,
      s3Name,
      contentType: "image/svg+xml",
      sha256: sha256(buf),
    });
  }

  const articleSha256 = sha256(articleMarkdown);

  return {
    artifactId,
    articleMarkdown,
    assetBuffers,
    metadata: {
      artifactId: artifactId,
      createdAt: new Date().toISOString(),
      targetType: "topic",
      keywordId: input.keywordId,
      keyword: input.keyword,
      hubSlug: input.article.hubSlug,
      clusterSlug: input.article.clusterSlug,
      slug: input.article.slug,
      title: input.article.title,
      date: input.article.date,
      articlePath,
      imagePath,
      assets: assetsMeta,
      researchPath,
      model: input.model,
      imageModel: input.imageModel,
      promptVersion: input.promptVersion,
      sourceUrls: input.sourceUrls,
      checksums: {
        articleSha256,
      },
      ...(input.qualityWarnings && input.qualityWarnings.length > 0
        ? { qualityWarnings: input.qualityWarnings }
        : {}),
    },
    research: input.research,
  };
}

function newsItemToResearchResult(item: NewsItem): ResearchResult {
  return {
    title: item.title,
    url: item.url,
    snippet: item.source,
    content: item.content,
  };
}

export function createBlogArtifact(input: {
  post: GeneratedBlogPost;
  coverBuffer: Buffer<ArrayBufferLike>;
  coverExt: "png" | "jpeg" | "webp";
  model: string;
  imageModel: string;
  promptVersion: string;
  author: string;
  qualityWarnings?: string[];
}): ArticleArtifact {
  const dateCompact = yyyymmddCompact(input.post.date);
  const artifactId = `news-${dateCompact}-${input.post.slug}`;
  const coverFilename = `${input.post.slug}.${input.coverExt}`;
  const articlePath = `website/content/blog/${input.post.slug}.md`;
  const imagePath = `website/public/blog/${coverFilename}`;
  const researchPath = `research/${artifactId}.json`;
  const coverImageField = `/blog/${coverFilename}`;

  const frontmatter = buildBlogFrontmatter(input.post, input.author, coverImageField);
  const articleMarkdown = `${frontmatter}\n\n${input.post.body.trim()}\n`;

  const coverS3Name = `cover.${input.coverExt}`;
  const assetBuffers: ArticleArtifact["assetBuffers"] = [
    {
      s3Name: coverS3Name,
      buffer: input.coverBuffer,
      websiteRelativePath: imagePath,
      contentType: `image/${input.coverExt}`,
    },
  ];

  const assetsMeta: ArtifactAssetMeta[] = [
    {
      websiteRelativePath: imagePath,
      s3Name: coverS3Name,
      contentType: `image/${input.coverExt}`,
      sha256: sha256(input.coverBuffer),
    },
  ];

  const articleSha256 = sha256(articleMarkdown);
  const sourceUrls = input.post.sourceItems.map((i) => i.url);

  return {
    artifactId,
    articleMarkdown,
    assetBuffers,
    metadata: {
      artifactId,
      createdAt: new Date().toISOString(),
      targetType: "blog",
      slug: input.post.slug,
      title: input.post.title,
      date: input.post.date,
      articlePath,
      imagePath,
      assets: assetsMeta,
      researchPath,
      model: input.model,
      imageModel: input.imageModel,
      promptVersion: input.promptVersion,
      sourceUrls,
      checksums: { articleSha256 },
      ...(input.qualityWarnings && input.qualityWarnings.length > 0
        ? { qualityWarnings: input.qualityWarnings }
        : {}),
    },
    research: input.post.sourceItems.map(newsItemToResearchResult),
  };
}
