import path from "path";
import { fileURLToPath } from "url";
import projectConfig from "../../auto-blogger.config.mjs";
import type { AutoBloggerProjectConfig } from "./projectConfig.js";

export type AutoBloggerConfig = {
  mode: "once" | "daemon";
  dryRun: boolean;
  dailyArticles: number;
  timezone: string;
  windowStartHour: number;
  windowEndHour: number;
  minGapMinutes: number;
  maxGapMinutes: number;
  lockPath: string;
  target: "topics" | "news";
  packageRoot: string;
  textProvider: "anthropic" | "openai";
  textModel: string;
  imageModel: string;
  /** Output tier for Gemini 3.x native image models only (ignored for gemini-2.5-flash-image). */
  geminiImageResolution: string;
  imageStyle: string;
  imagePalette: "pastel" | "vibrant" | "mixed";
  imageSize: "1024x1024" | "1024x1536" | "1536x1024";
  /** Legacy OpenAI Images setting; unused for Gemini image generation. */
  imageQuality: "low" | "medium" | "high" | "auto";
  /** Preferred filename extension when no image is generated (dry run / fallback). Actual Gemini output uses the API MIME type. */
  imageFormat: "png" | "jpeg" | "webp";
  allowImageFallback: boolean;
  requireEmail: boolean;
  importLimit: number;
  promptVersion: string;
  /** Max programmatic SVG diagrams per article (LLM output is truncated to this). */
  maxDiagrams: number;
  /** When false, topic selection ignores existing files under website/content/topics (not recommended). */
  skipExistingTopicFiles: boolean;
  /** When true, import writes even if target paths already exist. */
  importOverwrite: boolean;
  newsCycleEnabled: boolean;
  newsCycleHour: number;
  newsRecencyHours: number;
  newsMinItems: number;
  /** Minimum delay in ms between consecutive AI API calls within one article pipeline. */
  aiCallDelayMs: number;
  /** When true, runs an AI-powered SEO quality scoring pass after article generation. */
  seoScore: boolean;
  /** Quality gate mode: "off" = publish everything, "warn" = publish + log warnings, "strict" = block articles with critical SEO issues. */
  qualityGate: "off" | "warn" | "strict";
};

function parseIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer env var ${name}: "${raw}"`);
  }
  return parsed;
}

function boolEnv(name: string, fallback = false): boolean {
  const raw = process.env[name];
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

const DEFAULT_GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";

/** OpenAI Images API model ids — not valid for Gemini generateContent. */
const LEGACY_OPENAI_IMAGE_MODEL = /^(gpt-image|dall-e)/i;

function resolveImageModel(raw: string | undefined): string {
  const trimmed = raw?.trim();
  const model = trimmed || DEFAULT_GEMINI_IMAGE_MODEL;
  if (LEGACY_OPENAI_IMAGE_MODEL.test(model)) {
    console.warn(
      `[auto-blogger] AUTO_BLOG_IMAGE_MODEL="${model}" targets OpenAI Images; cover art uses Gemini only. ` +
        `Using "${DEFAULT_GEMINI_IMAGE_MODEL}" (Nano Banana). Set AUTO_BLOG_IMAGE_MODEL to a gemini-* image model id.`
    );
    return DEFAULT_GEMINI_IMAGE_MODEL;
  }
  return model;
}

/**
 * Loads the per-project configuration. Statically imported so esbuild can
 * inline the contents at bundle time — no runtime filesystem resolution
 * inside the Lambda zip. The `../../auto-blogger.config.js` path resolves to
 * `<repo-root>/auto-blogger.config.ts` at TS compile and bundle time, and to
 * the same source file when run locally via tsx.
 */
export function loadProjectConfig(): AutoBloggerProjectConfig {
  return projectConfig;
}

export function loadConfig(): AutoBloggerConfig {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const parentDir = path.dirname(currentDir);
  const packageRoot = path.basename(parentDir) === "dist" ? path.dirname(parentDir) : parentDir;
  const dataRoot = process.env.NODE_ENV === "production" ? "/data" : path.resolve(packageRoot, "data");

  const mode = (process.env.AUTO_BLOG_MODE ?? "once") as "once" | "daemon";
  const target = (process.env.AUTO_BLOG_TARGET ?? "topics") as "topics" | "news";
  const textProvider = (process.env.AUTO_BLOG_TEXT_PROVIDER ??
    (process.env.ANTHROPIC_API_KEY ? "anthropic" : "openai")) as "anthropic" | "openai";
  const imagePalette = (process.env.AUTO_BLOG_IMAGE_PALETTE ?? "vibrant") as
    | "pastel"
    | "vibrant"
    | "mixed";
  const imageSize = (process.env.AUTO_BLOG_IMAGE_SIZE ?? "1536x1024") as
    | "1024x1024"
    | "1024x1536"
    | "1536x1024";
  const imageQuality = (process.env.AUTO_BLOG_IMAGE_QUALITY ?? "auto") as
    | "low"
    | "medium"
    | "high"
    | "auto";
  const imageFormat = (process.env.AUTO_BLOG_IMAGE_FORMAT ?? "png") as
    | "png"
    | "jpeg"
    | "webp";

  if (!["once", "daemon"].includes(mode)) {
    throw new Error(`AUTO_BLOG_MODE must be "once" or "daemon", received "${mode}"`);
  }
  if (!["topics", "news"].includes(target)) {
    throw new Error(`AUTO_BLOG_TARGET must be "topics" or "news", received "${target}"`);
  }
  if (!["anthropic", "openai"].includes(textProvider)) {
    throw new Error(
      `AUTO_BLOG_TEXT_PROVIDER must be "anthropic" or "openai", received "${textProvider}"`
    );
  }

  return {
    mode,
    dryRun: boolEnv("AUTO_BLOG_DRY_RUN"),
    dailyArticles: parseIntEnv("DAILY_ARTICLES", 1),
    timezone: process.env.AUTO_BLOG_TIMEZONE ?? "Australia/Sydney",
    windowStartHour: parseIntEnv("AUTO_BLOG_WINDOW_START_HOUR", 9),
    windowEndHour: parseIntEnv("AUTO_BLOG_WINDOW_END_HOUR", 17),
    minGapMinutes: parseIntEnv("AUTO_BLOG_MIN_GAP_MINUTES", 90),
    maxGapMinutes: parseIntEnv("AUTO_BLOG_MAX_GAP_MINUTES", 120),
    lockPath:
      process.env.AUTO_BLOG_LOCK_PATH ??
      path.resolve(dataRoot, "auto-blogger.lock"),
    target,
    packageRoot,
    textProvider,
    textModel:
      process.env.AUTO_BLOG_TEXT_MODEL ??
      (textProvider === "anthropic"
        ? process.env.DEFAULT_ANTHROPIC_MODEL ?? "claude-haiku-4-5"
        : process.env.DEFAULT_OPENAI_MODEL ?? "gpt-5.4-mini"),
    imageModel: resolveImageModel(process.env.AUTO_BLOG_IMAGE_MODEL),
    geminiImageResolution: process.env.AUTO_BLOG_GEMINI_IMAGE_SIZE ?? "1K",
    imageStyle: process.env.AUTO_BLOG_IMAGE_STYLE ?? "stencil",
    imagePalette,
    imageSize,
    imageQuality,
    imageFormat,
    allowImageFallback: boolEnv("AUTO_BLOG_ALLOW_IMAGE_FALLBACK"),
    requireEmail: boolEnv("AUTO_BLOG_REQUIRE_EMAIL"),
    importLimit: parseIntEnv("AUTO_BLOG_IMPORT_LIMIT", 8),
    promptVersion: process.env.AUTO_BLOG_PROMPT_VERSION ?? "v1",
    maxDiagrams: parseIntEnv("AUTO_BLOG_MAX_DIAGRAMS", 3),
    skipExistingTopicFiles: !boolEnv("AUTO_BLOG_ALLOW_TOPIC_OVERWRITE"),
    importOverwrite: boolEnv("AUTO_BLOG_IMPORT_OVERWRITE"),
    newsCycleEnabled: boolEnv("AUTO_BLOG_NEWS_CYCLE_ENABLED"),
    newsCycleHour: parseIntEnv("AUTO_BLOG_NEWS_CYCLE_HOUR", 10),
    newsRecencyHours: parseIntEnv("AUTO_BLOG_NEWS_RECENCY_HOURS", 168),
    newsMinItems: parseIntEnv("AUTO_BLOG_NEWS_MIN_ITEMS", 3),
    aiCallDelayMs: parseIntEnv("AI_CALL_DELAY_MS", 1500),
    seoScore: boolEnv("AUTO_BLOG_SEO_SCORE"),
    qualityGate: (["off", "warn", "strict"].includes(process.env.AUTO_BLOG_QUALITY_GATE ?? "")
      ? (process.env.AUTO_BLOG_QUALITY_GATE as "off" | "warn" | "strict")
      : "off"),
  };
}
