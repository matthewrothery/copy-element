import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { loadConfig, loadProjectConfig } from "./config.js";
import { parseTopicKeywords } from "./topics.js";
import { researchTopic } from "./research.js";
import { applyDiagramsToArticle } from "./applyDiagrams.js";
import { generateTopicArticle } from "./generateArticle.js";
import { validateArticleQuality } from "./quality.js";
import { generateCoverImage } from "./generateImage.js";
import { createArtifact } from "./artifact.js";
import { writeArtifactToWebsite, writeDryRunArtifact } from "./localPublish.js";
import { loadInternalLinkCandidates, prioritizeInternalLinks } from "./internalLinks.js";
import { TopicKeyword } from "./types.js";

type CliOptions = {
  path?: string;
  keyword?: string;
  write: boolean;
  noImage: boolean;
  date?: string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    write: false,
    noImage: false,
  };

  for (let idx = 0; idx < argv.length; idx += 1) {
    const arg = argv[idx];
    const next = argv[idx + 1];

    if (arg === "--write") {
      options.write = true;
      continue;
    }
    if (arg === "--no-image") {
      options.noImage = true;
      continue;
    }
    if (arg === "--path" && next) {
      options.path = next;
      idx += 1;
      continue;
    }
    if (arg === "--keyword" && next) {
      options.keyword = next;
      idx += 1;
      continue;
    }
    if (arg === "--date" && next) {
      options.date = next;
      idx += 1;
      continue;
    }

    throw new Error(`Unknown or incomplete argument: ${arg}`);
  }

  if (!options.path && !options.keyword) {
    throw new Error("Provide --path <article.md> or --keyword <keyword>.");
  }

  return options;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function extractFrontmatter(raw: string): Record<string, string> {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};

  const data: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const item = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(?:"([^"]*)"|(.+))\s*$/);
    if (!item) continue;
    data[item[1]] = (item[2] ?? item[3] ?? "").trim();
  }
  return data;
}

function keywordFromArticlePath(articlePath: string, websiteRoot: string): TopicKeyword {
  if (!existsSync(articlePath)) {
    throw new Error(`Article path does not exist: ${articlePath}`);
  }

  const topicsRoot = path.resolve(websiteRoot, "content", "topics");
  const relativeParts = path.relative(topicsRoot, articlePath).split(path.sep);
  if (relativeParts.length !== 3 || relativeParts[2] === "_index.md") {
    throw new Error("Article path must be a topic article under website/content/topics/<hub>/<cluster>/<slug>.md");
  }

  const raw = readFileSync(articlePath, "utf-8");
  const frontmatter = extractFrontmatter(raw);
  const hubSlug = frontmatter.hub || relativeParts[0];
  const clusterSlug = frontmatter.cluster || relativeParts[1];
  const slug = frontmatter.slug || path.parse(relativeParts[2]).name;
  const keyword = frontmatter.title || slug.replace(/-/g, " ");

  return {
    id: `${hubSlug}/${clusterSlug}/${slug}`,
    hubSlug,
    hubTitle: frontmatter.hubTitle || hubSlug.replace(/-/g, " "),
    clusterSlug,
    clusterTitle: frontmatter.clusterTitle || clusterSlug.replace(/-/g, " "),
    keyword,
  };
}

function findKeywordByText(keywords: TopicKeyword[], keywordText: string): TopicKeyword {
  const normalized = keywordText.trim().toLowerCase();
  const keyword = keywords.find(
    (item) => item.keyword.toLowerCase() === normalized || slugify(item.keyword) === slugify(keywordText)
  );
  if (!keyword) {
    throw new Error(`Could not find keyword in list.md: ${keywordText}`);
  }
  return keyword;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const config = loadConfig();
  const projectConfig = loadProjectConfig();
  const workspaceRoot = path.resolve(config.packageRoot, "..");
  const websiteRoot =
    projectConfig.contentRepository.type === "filesystem"
      ? path.resolve(workspaceRoot, projectConfig.contentRepository.websiteRoot)
      : path.resolve(workspaceRoot, "website");
  const articlePath = options.path
    ? path.resolve(process.cwd(), options.path)
    : undefined;

  const allKeywords = parseTopicKeywords(projectConfig.content.listPath);
  const keyword = articlePath
    ? keywordFromArticlePath(articlePath, websiteRoot)
    : findKeywordByText(allKeywords, options.keyword ?? "");

  const copywriterPromptPath = projectConfig.content.copywriterPromptPath ?? "./auto-blogger/copywriter-prompt.md";
  const copywriterPrompt = readFileSync(copywriterPromptPath, "utf-8");
  const guide = readFileSync(projectConfig.content.guidePath, "utf-8");
  const rules = readFileSync(projectConfig.content.rulesPath, "utf-8");
  const date = options.date ?? new Date().toISOString().slice(0, 10);

  console.log(`Generating local article: ${keyword.keyword}`);
  const research = await researchTopic(keyword.keyword, 12, projectConfig.news.userAgent);
  if (research.length === 0) {
    throw new Error("Research step returned no results.");
  }

  const internalLinkCandidates = prioritizeInternalLinks(
    loadInternalLinkCandidates(websiteRoot),
    keyword
  );

  const { article: draftArticle, resolutionWarnings } = await generateTopicArticle({
    keyword,
    date,
    textProvider: config.textProvider,
    model: config.textModel,
    copywriterPrompt,
    guide,
    rules,
    brand: projectConfig.brand,
    research,
    internalLinkCandidates,
    config: { aiCallDelayMs: config.aiCallDelayMs },
  });

  const diagramPass = applyDiagramsToArticle(draftArticle, config.maxDiagrams);

  const qualityWarnings = [
    ...validateArticleQuality(diagramPass.article, new Set()),
    ...diagramPass.warnings,
    ...resolutionWarnings,
  ];
  if (qualityWarnings.length > 0) {
    console.warn(`Quality warnings (${qualityWarnings.length}):\n- ${qualityWarnings.join("\n- ")}`);
  }

  let imageBytes: Buffer<ArrayBufferLike> = Buffer.alloc(0);
  let imageExt = config.imageFormat;
  if (!options.noImage) {
    try {
      const generated = await generateCoverImage(diagramPass.article, config);
      imageBytes = generated.bytes;
      imageExt = generated.ext;
    } catch (error) {
      if (!config.allowImageFallback) {
        throw error;
      }
      console.warn("Image generation failed; continuing with empty cover image.");
      console.warn(error);
    }
  }

  const artifact = createArtifact({
    article: diagramPass.article,
    coverBuffer: imageBytes,
    coverExt: imageExt,
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

  if (options.write) {
    const out = writeArtifactToWebsite(workspaceRoot, artifact);
    console.log(`Wrote article: ${out.articlePath}`);
    for (const p of out.assetPaths) {
      console.log(`Wrote asset: ${p}`);
    }
    return;
  }

  const out = writeDryRunArtifact(config.packageRoot, artifact);
  console.log(`Dry run article: ${out.articlePath}`);
  for (const p of out.assetPaths) {
    console.log(`Dry run asset: ${p}`);
  }
  console.log("Review the output, then rerun with --write to replace website content.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
