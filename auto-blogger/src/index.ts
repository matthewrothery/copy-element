import "dotenv/config";
import { readFileSync } from "fs";
import { applyDiagramsToArticle } from "./applyDiagrams.js";
import { loadConfig } from "./config.js";
import { researchTopic } from "./research.js";
import { parseTopicKeywords, pickNextKeyword } from "./topics.js";
import { loadState, saveState } from "./state.js";
import { generateTopicArticle } from "./generateArticle.js";
import { generateNewsArticle } from "./generateNewsArticle.js";
import { validateArticleQuality } from "./quality.js";
import { generateCoverImage } from "./generateImage.js";
import { createArtifact, createBlogArtifact } from "./artifact.js";
import { writeDryRunArtifact } from "./localPublish.js";
import { uploadArtifactToS3, getArtifactImageSignedUrl } from "./s3.js";
import { sendArticleNotification } from "./email.js";
import { buildRandomDailySchedule, minutesUntilSlot, msUntilNextWindowStart, sleep } from "./scheduler.js";
import { loadInternalLinkCandidates, prioritizeInternalLinks } from "./internalLinks.js";
import { fetchNewsItems } from "./newsSearch.js";

const NEWS_IMAGE_STYLE = `- clean editorial style
- modern geometric shapes
- flat design, minimal
- bold color blocks
- no text or logos
- no photorealism
- no stencil or street-art`;

async function runSingleCycle(): Promise<void> {
  const config = loadConfig();
  const state = loadState(config.statePath);
  const usedKeywords = new Set(state.processedKeywordIds);
  const usedSlugs = new Set(state.processedSlugs);

  const allKeywords = parseTopicKeywords(config.listPath);
  const internalLinkCandidates = loadInternalLinkCandidates(config.websiteRoot);
  const keyword = pickNextKeyword(allKeywords, usedKeywords, {
    websiteRoot: config.websiteRoot,
    skipExistingTopicFiles: config.skipExistingTopicFiles,
  });
  if (!keyword) {
    console.log(
      "No remaining keywords (state file full, list exhausted, or every list item already exists under website/content/topics). " +
        "Reset state and/or set AUTO_BLOG_ALLOW_TOPIC_OVERWRITE=true only if you intend to regenerate."
    );
    return;
  }

  const copywriterPrompt = readFileSync(config.copywriterPromptPath, "utf-8");
  const guide = readFileSync(config.guidePath, "utf-8");
  const rules = readFileSync(config.rulesPath, "utf-8");
  const today = new Date().toISOString().slice(0, 10);

  console.log(`Selected keyword: ${keyword.keyword}`);
  const research = await researchTopic(keyword.keyword, 12);
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
    research,
    internalLinkCandidates: prioritizeInternalLinks(internalLinkCandidates, keyword),
  });

  const diagramPass = applyDiagramsToArticle(draftArticle, config.maxDiagrams);

  const qualityWarnings = [
    ...validateArticleQuality(diagramPass.article, usedSlugs),
    ...diagramPass.warnings,
    ...resolutionWarnings,
  ];
  if (qualityWarnings.length > 0) {
    console.warn(`Quality warnings (${qualityWarnings.length}):\n- ${qualityWarnings.join("\n- ")}`);
  }

  let coverBuffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);
  let coverExt = config.imageFormat;
  if (!config.dryRun) {
    try {
      const image = await generateCoverImage(diagramPass.article, config);
      coverBuffer = image.bytes;
      coverExt = image.ext;
    } catch (error) {
      if (!config.allowImageFallback) {
        throw error;
      }
      console.warn("Image generation failed; using fallback blank image buffer.");
      coverBuffer = Buffer.from("");
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
    author: config.author,
    research,
    qualityWarnings,
  });

  if (config.dryRun) {
    const out = writeDryRunArtifact(config.packageRoot, artifact);
    console.log(`Dry run complete: ${out.articlePath}`);
  } else {
    if (!config.s3Bucket) {
      throw new Error("AUTO_BLOG_S3_BUCKET is required for non-dry-run execution.");
    }

    await uploadArtifactToS3(config.s3Bucket, config.s3Prefix, artifact);
    console.log(`Uploaded artifact to s3://${config.s3Bucket}/${config.s3Prefix}/pending/${artifact.artifactId}`);

    if (config.notifyTo && config.notifyFrom) {
      try {
        const imageUrl = await getArtifactImageSignedUrl(
          config.s3Bucket,
          config.s3Prefix,
          artifact.artifactId,
          coverExt
        );
        await sendArticleNotification({
          to: config.notifyTo,
          from: config.notifyFrom,
          artifact,
          model: config.textModel,
          imageUrl,
          tokenUsage,
        });
        console.log(`Notification sent to ${config.notifyTo}`);
      } catch (error) {
        state.emailFailures.push(artifact.artifactId);
        if (config.requireEmail) {
          throw error;
        }
      }
    }
  }

  state.processedKeywordIds.push(keyword.id);
  state.processedSlugs.push(diagramPass.article.slug);
  state.lastRunAt = Date.now();
  saveState(config.statePath, state);
}

async function runNewsCycle(): Promise<void> {
  const config = loadConfig();
  const today = new Date().toISOString().slice(0, 10);

  console.log("[news] Fetching news items...");
  const items = await fetchNewsItems(6);
  if (items.length === 0) {
    console.warn("[news] No recent news items found; skipping cycle.");
    return;
  }
  console.log(`[news] Fetched ${items.length} items.`);

  const { post, tokenUsage } = await generateNewsArticle({
    items,
    date: today,
    textProvider: config.textProvider,
    model: config.textModel,
  });
  console.log(`[news] Generated post: ${post.title} (${post.slug})`);

  let coverBuffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);
  let coverExt = config.imageFormat;
  if (!config.dryRun) {
    try {
      const image = await generateCoverImage(post, config, NEWS_IMAGE_STYLE);
      coverBuffer = image.bytes;
      coverExt = image.ext;
    } catch (error) {
      if (!config.allowImageFallback) {
        throw error;
      }
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
    author: config.author,
  });

  if (config.dryRun) {
    const out = writeDryRunArtifact(config.packageRoot, artifact);
    console.log(`[news] Dry run complete: ${out.articlePath}`);
  } else {
    if (!config.s3Bucket) {
      throw new Error("AUTO_BLOG_S3_BUCKET is required for non-dry-run execution.");
    }

    await uploadArtifactToS3(config.s3Bucket, config.s3Prefix, artifact);
    console.log(`[news] Uploaded artifact to s3://${config.s3Bucket}/${config.s3Prefix}/pending/${artifact.artifactId}`);

    if (config.notifyTo && config.notifyFrom) {
      try {
        const imageUrl = await getArtifactImageSignedUrl(
          config.s3Bucket,
          config.s3Prefix,
          artifact.artifactId,
          coverExt
        );
        await sendArticleNotification({
          to: config.notifyTo,
          from: config.notifyFrom,
          artifact,
          model: config.textModel,
          imageUrl,
          tokenUsage,
          subjectPrefix: "Generated news post",
        });
        console.log(`[news] Notification sent to ${config.notifyTo}`);
      } catch (error) {
        console.error("[news] Email notification failed:", error);
      }
    }
  }
}

async function runDaemon(): Promise<void> {
  const config = loadConfig();
  const windowStart = config.windowStartHour * 60;
  const windowEnd = config.windowEndHour * 60;
  console.log("Auto-blogger daemon started.");

  async function topicLoop(): Promise<void> {
    while (true) {
      const schedule = buildRandomDailySchedule(
        config.dailyArticles,
        windowStart,
        windowEnd,
        config.minGapMinutes,
        config.maxGapMinutes
      );
      console.log(`[topic] Today's schedule (${config.timezone} minutes-from-midnight): ${schedule.join(", ")}`);

      for (const slot of schedule) {
        const waitMinutes = minutesUntilSlot(slot, new Date(), config.timezone);
        if (waitMinutes > 0) {
          await sleep(waitMinutes * 60 * 1000);
        }
        await runSingleCycle();
      }

      const ms = msUntilNextWindowStart(windowStart, config.timezone);
      console.log(`[topic] All slots done. Sleeping ${Math.round(ms / 60000)} minutes until next window.`);
      await sleep(ms);
    }
  }

  async function newsLoop(): Promise<void> {
    const slotMinutes = config.newsCycleHour * 60;
    while (true) {
      const waitMinutes = minutesUntilSlot(slotMinutes, new Date(), config.timezone);
      if (waitMinutes > 0) {
        console.log(`[news] Waiting ${waitMinutes} minutes until ${config.newsCycleHour}:00 ${config.timezone}.`);
        await sleep(waitMinutes * 60 * 1000);
      }
      try {
        await runNewsCycle();
      } catch (e) {
        console.error("[news] cycle failed:", e);
      }
      const ms = msUntilNextWindowStart(slotMinutes, config.timezone);
      await sleep(ms);
    }
  }

  if (config.newsCycleEnabled) {
    await Promise.all([topicLoop(), newsLoop()]);
  } else {
    await topicLoop();
  }
}

async function main(): Promise<void> {
  const config = loadConfig();
  if (config.mode === "daemon") {
    await runDaemon();
    return;
  }
  await runSingleCycle();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
