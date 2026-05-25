import "dotenv/config";
import { readFileSync } from "fs";
import crypto from "crypto";
import { sleep } from "./utils.js";
import { applyDiagramsToArticle } from "./applyDiagrams.js";
import { loadConfig, loadProjectConfig } from "./config.js";
import { researchTopic } from "./research.js";
import { parseTopicKeywords } from "./topics.js";
import { generateTopicArticle } from "./generateArticle.js";
import { generateNewsArticle } from "./generateNewsArticle.js";
import { validateArticleQuality, validateNewsPostQuality } from "./quality.js";
import { generateCoverImage } from "./generateImage.js";
import { createArtifact, createBlogArtifact } from "./artifact.js";
import { writeDryRunArtifact } from "./localPublish.js";
import { prioritizeInternalLinks } from "./internalLinks.js";
import { fetchNewsItems } from "./newsSearch.js";
import { FilesystemStateStore } from "./stateStoreFilesystem.js";
import { FilesystemContentRepository } from "./contentRepositoryFilesystem.js";
import { S3SesOutputAdapter, LocalWriteOutputAdapter } from "./outputAdapterS3Ses.js";
import type { AutoBloggerConfig } from "./config.js";
import type { AutoBloggerProjectConfig } from "./projectConfig.js";
import type { StateStore } from "./stateStore.js";
import type { ContentRepository } from "./contentRepository.js";
import type { OutputAdapter, ArticleResult, DigestSummary } from "./outputAdapter.js";
import type { TopicKeyword } from "./types.js";

const NEWS_IMAGE_STYLE = `- clean editorial style
- modern geometric shapes
- flat design, minimal
- bold color blocks
- no text or logos
- no photorealism
- no stencil or street-art`;

export type CycleDeps = {
  config: AutoBloggerConfig;
  projectConfig: AutoBloggerProjectConfig;
  stateStore: StateStore;
  contentRepo: ContentRepository;
  outputAdapter: OutputAdapter;
};

function newRequestId(): string {
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Attempts to claim N unique keywords from the candidate pool. Skips
 * already-claimed ids via `stateStore.claimKeyword`. Returns the actually
 * claimed list (length may be < N if the pool is exhausted).
 */
export async function pickAndClaimKeywords(
  pool: TopicKeyword[],
  alreadyUsed: Set<string>,
  alreadyPublished: Set<string>,
  stateStore: StateStore,
  n: number,
  requestId: string
): Promise<TopicKeyword[]> {
  const available = pool.filter(
    (kw) => !alreadyUsed.has(kw.id) && !alreadyPublished.has(kw.id)
  );
  const claimed: TopicKeyword[] = [];
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  for (const kw of shuffled) {
    if (claimed.length >= n) break;
    const ok = await stateStore.claimKeyword(kw.id, requestId);
    if (ok) claimed.push(kw);
  }
  return claimed;
}

async function runOneTopicPipeline(
  keyword: TopicKeyword,
  deps: CycleDeps,
  copywriterPrompt: string,
  guide: string,
  rules: string,
  internalLinkCandidates: ReturnType<typeof prioritizeInternalLinks>,
  today: string
): Promise<ArticleResult> {
  const { config, projectConfig, stateStore, outputAdapter } = deps;
  console.log(`[topic] Selected keyword: ${keyword.keyword}`);

  const research = await researchTopic(keyword.keyword, 12, projectConfig.news.userAgent);
  if (research.length === 0) {
    throw new Error("Research step returned no results.");
  }

  const { article: draftArticle, tokenUsage, resolutionWarnings } = await generateTopicArticle({
    keyword,
    date: today,
    textProvider: config.textProvider,
    model: config.textModel,
    copywriterPrompt,
    guide,
    rules,
    brand: projectConfig.brand,
    research,
    internalLinkCandidates: prioritizeInternalLinks(internalLinkCandidates, keyword),
    config: { aiCallDelayMs: config.aiCallDelayMs },
  });

  const diagramPass = applyDiagramsToArticle(draftArticle, config.maxDiagrams);
  const usedSlugs = await stateStore.loadProcessedSlugs();

  const qualityWarnings = [
    ...validateArticleQuality(diagramPass.article, usedSlugs),
    ...diagramPass.warnings,
    ...resolutionWarnings,
  ];
  if (qualityWarnings.length > 0) {
    console.warn(
      `[topic] Quality warnings (${qualityWarnings.length}):\n- ${qualityWarnings.join("\n- ")}`
    );
  }

  let coverBuffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);
  let coverExt = config.imageFormat;
  if (!config.dryRun) {
    try {
      const image = await generateCoverImage(diagramPass.article, config);
      coverBuffer = image.bytes;
      coverExt = image.ext;
    } catch (error) {
      if (!config.allowImageFallback) throw error;
      console.warn("[topic] Image generation failed; using fallback blank image buffer.");
    }
  }

  const artifact = createArtifact({
    article: diagramPass.article,
    coverBuffer,
    coverExt,
    diagramBuffers: diagramPass.diagramBuffers,
    keywordId: keyword.id,
    keyword: keyword.keyword,
    sourceUrls: research.map((item) => item.url),
    model: `${config.textProvider}:${config.textModel}`,
    imageModel: config.imageModel,
    promptVersion: config.promptVersion,
    author: projectConfig.author,
    research,
    qualityWarnings,
  });

  let coverUrl: string | undefined;
  if (config.dryRun) {
    const out = writeDryRunArtifact(config.packageRoot, artifact);
    console.log(`[topic] Dry run complete: ${out.articlePath}`);
  } else {
    const result = await outputAdapter.publish(artifact);
    coverUrl = result.coverUrl;
    console.log(`[topic] Published artifact ${artifact.artifactId}`);
    await stateStore.recordSlug(diagramPass.article.slug);
    if (deps.projectConfig.output.type === "s3-staging" && deps.projectConfig.output.notify.mode === "per-article") {
      try {
        await outputAdapter.notifyPerArticle(artifact, tokenUsage, config.textModel, coverUrl);
      } catch (error) {
        await stateStore.recordEmailFailure(artifact.artifactId);
        if (config.requireEmail) throw error;
      }
    }
  }

  return { artifact, tokenUsage, coverUrl };
}

/**
 * Runs N topic article pipelines sequentially. Picks + atomically claims N
 * keywords up front, then processes each one in a `for` loop with an
 * inter-article delay to stay within the Anthropic 50k-token/min rate limit.
 * Aggregates results into a digest summary and triggers a single digest email at the end.
 */
export async function runParallelTopics(n: number, deps: CycleDeps): Promise<DigestSummary> {
  const { config, projectConfig, stateStore, contentRepo, outputAdapter } = deps;
  const requestId = newRequestId();
  const today = new Date().toISOString().slice(0, 10);

  const allKeywords = parseTopicKeywords(projectConfig.content.listPath);
  const usedKeywords = await stateStore.loadProcessedKeywordIds();
  const publishedKeywords = await contentRepo.loadPublishedKeywordIds();
  const internalLinkCandidates = await contentRepo.loadCandidates();

  const claimed = await pickAndClaimKeywords(
    allKeywords,
    usedKeywords,
    publishedKeywords,
    stateStore,
    n,
    requestId
  );
  if (claimed.length === 0) {
    console.log("[topic] No unclaimed keywords; skipping cycle.");
    const summary: DigestSummary = {
      cycle: "topics",
      date: today,
      textModel: config.textModel,
      results: [],
      failures: [],
    };
    await outputAdapter.notifyDigest(summary);
    return summary;
  }
  console.log(`[topic] Claimed ${claimed.length} keyword(s) for this cycle.`);

  const copywriterPromptPath = projectConfig.content.copywriterPromptPath ?? "./auto-blogger/copywriter-prompt.md";
  const copywriterPrompt = readFileSync(copywriterPromptPath, "utf-8");
  const guide = readFileSync(projectConfig.content.guidePath, "utf-8");
  const rules = readFileSync(projectConfig.content.rulesPath, "utf-8");

  const results: ArticleResult[] = [];
  const failures: DigestSummary["failures"] = [];
  for (let i = 0; i < claimed.length; i++) {
    if (i > 0) await sleep(config.aiCallDelayMs * 4);
    const kw = claimed[i];
    try {
      const result = await runOneTopicPipeline(kw, deps, copywriterPrompt, guide, rules, internalLinkCandidates, today);
      results.push(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[topic] Pipeline failed for "${kw.keyword}":`, err);
      failures.push({ label: kw.keyword, error: message });
    }
  }

  await stateStore.recordRun(Date.now());
  const summary: DigestSummary = {
    cycle: "topics",
    date: today,
    textModel: config.textModel,
    results,
    failures,
  };
  try {
    await outputAdapter.notifyDigest(summary);
  } catch (error) {
    console.warn("[topic] Digest notification failed:", error);
  }

  return summary;
}

/**
 * Runs a single news commentary pipeline.
 */
export async function runNewsOnce(deps: CycleDeps): Promise<DigestSummary> {
  const { config, projectConfig, stateStore, contentRepo, outputAdapter } = deps;
  const today = new Date().toISOString().slice(0, 10);

  const internalLinkCandidates = await contentRepo.loadCandidates();
  const usedBlogSlugs = await contentRepo.loadExistingBlogSlugs();

  console.log("[news] Fetching news items...");
  const items = await fetchNewsItems(6, {
    recencyHours: config.newsRecencyHours,
    minItems: config.newsMinItems,
    config: projectConfig.news,
  });
  if (items.length === 0) {
    console.warn("[news] No recent news items found; skipping cycle.");
    const summary: DigestSummary = {
      cycle: "news",
      date: today,
      textModel: config.textModel,
      results: [],
      failures: [],
    };
    await outputAdapter.notifyDigest(summary);
    return summary;
  }
  console.log(`[news] Fetched ${items.length} items.`);

  const failures: DigestSummary["failures"] = [];
  const results: ArticleResult[] = [];

  try {
    const { post, tokenUsage, resolutionWarnings } = await generateNewsArticle({
      items,
      date: today,
      textProvider: config.textProvider,
      model: config.textModel,
      brand: projectConfig.brand,
      internalLinkCandidates,
    });
    console.log(`[news] Generated post: ${post.title} (${post.slug})`);

    const qualityWarnings = [...validateNewsPostQuality(post, usedBlogSlugs), ...resolutionWarnings];
    if (qualityWarnings.length > 0) {
      console.warn(`[news] Quality warnings (${qualityWarnings.length}):\n- ${qualityWarnings.join("\n- ")}`);
    }

    let coverBuffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);
    let coverExt = config.imageFormat;
    if (!config.dryRun) {
      try {
        const image = await generateCoverImage(post, config, NEWS_IMAGE_STYLE);
        coverBuffer = image.bytes;
        coverExt = image.ext;
      } catch (error) {
        if (!config.allowImageFallback) throw error;
        console.warn("[news] Image generation failed; using fallback blank image buffer.");
      }
    }

    const artifact = createBlogArtifact({
      post,
      coverBuffer,
      coverExt,
      model: `${config.textProvider}:${config.textModel}`,
      imageModel: config.imageModel,
      promptVersion: config.promptVersion,
      author: projectConfig.author,
      qualityWarnings,
    });

    let coverUrl: string | undefined;
    if (config.dryRun) {
      const out = writeDryRunArtifact(config.packageRoot, artifact);
      console.log(`[news] Dry run complete: ${out.articlePath}`);
    } else {
      const result = await outputAdapter.publish(artifact);
      coverUrl = result.coverUrl;
      console.log(`[news] Published artifact ${artifact.artifactId}`);
      await stateStore.recordSlug(post.slug);
    }
    results.push({ artifact, tokenUsage, coverUrl });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[news] Pipeline failed:", error);
    failures.push({ label: "news cycle", error: message });
  }

  await stateStore.recordRun(Date.now());
  const summary: DigestSummary = {
    cycle: "news",
    date: today,
    textModel: config.textModel,
    results,
    failures,
  };
  try {
    await outputAdapter.notifyDigest(summary);
  } catch (error) {
    console.warn("[news] Digest notification failed:", error);
  }
  return summary;
}

/**
 * Instantiates the runtime dependencies (StateStore, ContentRepository,
 * OutputAdapter) from the project + env configs. DynamoDB / S3-manifest
 * implementations are picked up by the lambda entry; this default wires the
 * filesystem implementations for local dev parity.
 */
export async function buildCycleDeps(): Promise<CycleDeps> {
  const config = loadConfig();
  const projectConfig = loadProjectConfig();

  let stateStore: StateStore;
  if (projectConfig.stateStore.type === "dynamodb") {
    const mod = await import("./stateStoreDynamoDb.js");
    stateStore = new mod.DynamoDbStateStore(
      projectConfig.stateStore.tableName,
      projectConfig.stateStore.region
    );
  } else {
    stateStore = new FilesystemStateStore(projectConfig.stateStore.statePath);
  }

  let contentRepo: ContentRepository;
  if (projectConfig.contentRepository.type === "s3-manifest") {
    const mod = await import("./contentRepositoryS3Manifest.js");
    contentRepo = new mod.S3ManifestContentRepository(
      projectConfig.contentRepository.bucket,
      projectConfig.contentRepository.manifestKey,
      projectConfig.contentRepository.region
    );
  } else {
    contentRepo = new FilesystemContentRepository(projectConfig.contentRepository.websiteRoot);
  }

  let outputAdapter: OutputAdapter;
  if (projectConfig.output.type === "s3-staging") {
    outputAdapter = new S3SesOutputAdapter(
      projectConfig.output.bucket,
      projectConfig.output.prefix,
      projectConfig.output.notify
    );
  } else {
    outputAdapter = new LocalWriteOutputAdapter(projectConfig.output.notify);
  }

  return { config, projectConfig, stateStore, contentRepo, outputAdapter };
}

async function main(): Promise<void> {
  const deps = await buildCycleDeps();
  if (deps.config.target === "news") {
    await runNewsOnce(deps);
  } else {
    await runParallelTopics(deps.config.dailyArticles, deps);
  }
}

// Only run main when invoked directly (not when imported by lambda.ts or tests).
const isDirectInvocation = (() => {
  try {
    const argv1 = process.argv[1] ?? "";
    return argv1.endsWith("index.js") || argv1.endsWith("index.ts");
  } catch {
    return false;
  }
})();

if (isDirectInvocation) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
