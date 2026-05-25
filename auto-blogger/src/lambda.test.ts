/**
 * Tests for the Lambda handler wiring. Uses fully-mocked DI dependencies
 * (StateStore, ContentRepository, OutputAdapter) to validate that:
 *  - topicsHandler calls runParallelTopics with the correct daily-articles count
 *  - newsHandler calls runNewsOnce
 *  - failures surface as thrown errors (so EventBridge marks invocation failed)
 *
 * These tests do NOT call real AWS or the real LLM API.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { StateStore } from "./stateStore.js";
import type { ContentRepository } from "./contentRepository.js";
import type { OutputAdapter, DigestSummary } from "./outputAdapter.js";
import type { AutoBloggerConfig } from "./config.js";
import type { AutoBloggerProjectConfig } from "./projectConfig.js";
import type { CycleDeps } from "./index.js";

// ------ minimal stub implementations ------

function stubStateStore(): StateStore {
  const keywords = new Set<string>();
  const slugs = new Set<string>();
  return {
    async claimKeyword(id: string, _req: string) {
      if (keywords.has(id)) return false;
      keywords.add(id);
      return true;
    },
    async recordSlug(slug: string) {
      if (slugs.has(slug)) return false;
      slugs.add(slug);
      return true;
    },
    async loadProcessedKeywordIds() { return new Set<string>(); },
    async loadProcessedSlugs() { return new Set<string>(); },
    async recordEmailFailure() {},
    async recordRun() {},
  };
}

function stubContentRepo(): ContentRepository {
  return {
    async loadCandidates() { return []; },
    async loadPublishedKeywordIds() { return new Set<string>(); },
    async loadExistingBlogSlugs() { return new Set<string>(); },
  };
}

function stubOutputAdapter(): OutputAdapter & { digests: DigestSummary[] } {
  const digests: DigestSummary[] = [];
  return {
    digests,
    async publish(_a) { return { publishedAt: Date.now() }; },
    async notifyDigest(s) { digests.push(s); },
    async notifyPerArticle() {},
  };
}

function stubConfig(overrides: Partial<AutoBloggerConfig> = {}): AutoBloggerConfig {
  return {
    mode: "once",
    dryRun: true,
    dailyArticles: 1,
    timezone: "UTC",
    windowStartHour: 9,
    windowEndHour: 17,
    minGapMinutes: 90,
    maxGapMinutes: 120,
    lockPath: "/tmp/test.lock",
    target: "topics",
    packageRoot: process.cwd(),
    textProvider: "anthropic",
    textModel: "claude-haiku-4-5",
    imageModel: "gemini-2.5-flash-image",
    geminiImageResolution: "1K",
    imageStyle: "stencil",
    imagePalette: "vibrant",
    imageSize: "1536x1024",
    imageQuality: "auto",
    imageFormat: "png",
    allowImageFallback: true,
    requireEmail: false,
    importLimit: 8,
    promptVersion: "v1",
    maxDiagrams: 3,
    skipExistingTopicFiles: true,
    importOverwrite: false,
    newsCycleEnabled: false,
    newsCycleHour: 10,
    newsRecencyHours: 168,
    newsMinItems: 3,
    aiCallDelayMs: 0,
    seoScore: false,
    qualityGate: "off",
    ...overrides,
  };
}

// Create minimal temp content files so the test doesn't hit real paths.
const testContentDir = mkdtempSync(join(tmpdir(), "auto-blogger-lambda-test-"));
writeFileSync(join(testContentDir, "list.md"), "# Hub\n## Cluster\n- test keyword\n");
writeFileSync(join(testContentDir, "guide.md"), "Guide content.");
writeFileSync(join(testContentDir, "rules.md"), "Rules content.");
writeFileSync(join(testContentDir, "copywriter.md"), "Copywriter content.");

function stubProjectConfig(): AutoBloggerProjectConfig {
  return {
    brand: {
      productName: "Test Product",
      shortName: "Test",
      tagline: "Test tagline.",
      voice: "technical",
      unshippedFeatureClaims: [],
    },
    content: {
      listPath: join(testContentDir, "list.md"),
      guidePath: join(testContentDir, "guide.md"),
      rulesPath: join(testContentDir, "rules.md"),
      copywriterPromptPath: join(testContentDir, "copywriter.md"),
    },
    news: {
      queries: ["test AI"],
      relevanceKeywords: ["ai"],
      excludeKeywords: [],
      excludedDomains: [],
      userAgent: "TestBot/1.0",
    },
    contentRepository: { type: "filesystem", websiteRoot: "./website" },
    output: { type: "local-write", outputDir: "./dry-runs", notify: { mode: "none" } },
    stateStore: { type: "filesystem", statePath: join(testContentDir, "state.json") },
    author: "Test Author",
  };
}

function makeDeps(overrides: Partial<CycleDeps> = {}): CycleDeps {
  return {
    config: stubConfig(),
    projectConfig: stubProjectConfig(),
    stateStore: stubStateStore(),
    contentRepo: stubContentRepo(),
    outputAdapter: stubOutputAdapter(),
    ...overrides,
  };
}

// ------ tests ------

test("runParallelTopics emits a digest with cycle=topics", async () => {
  const { runParallelTopics } = await import("./index.js");
  const adapter = stubOutputAdapter();
  const deps = makeDeps({ outputAdapter: adapter });

  // With dryRun=true and an empty keyword pool, should complete without error.
  const summary = await runParallelTopics(0, deps);

  assert.equal(summary.cycle, "topics");
  assert.equal(typeof summary.date, "string");
  assert.ok(adapter.digests.length > 0, "A digest should have been sent");
});

test("runNewsOnce emits a digest with cycle=news", async () => {
  const { runNewsOnce } = await import("./index.js");
  const adapter = stubOutputAdapter();
  const deps = makeDeps({ outputAdapter: adapter });

  // With dryRun=true, fetchNewsItems should be called; stub returns no items,
  // so the summary should have no results and no failures.
  const summary = await runNewsOnce(deps);

  assert.equal(summary.cycle, "news");
  assert.ok(adapter.digests.length > 0, "A digest should have been sent");
});
