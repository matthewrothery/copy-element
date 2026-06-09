import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { TopicKeyword } from "./types.js";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function isKeywordLine(line: string): boolean {
  return line.trim().startsWith("- ");
}

export function parseTopicKeywords(listPath: string): TopicKeyword[] {
  const raw = readFileSync(listPath, "utf-8");
  const lines = raw.split(/\r?\n/);

  const keywords: TopicKeyword[] = [];
  let currentHubTitle = "";
  let currentClusterTitle = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") continue;

    if (trimmed.startsWith("# ")) {
      currentHubTitle = trimmed.slice(2).replace(/^\d+\.\s*/, "").trim();
      continue;
    }

    if (trimmed.startsWith("## ")) {
      currentClusterTitle = trimmed.slice(3).trim();
      continue;
    }

    if (isKeywordLine(trimmed)) {
      const keyword = trimmed.slice(2).trim();
      if (!keyword || !currentHubTitle || !currentClusterTitle) {
        continue;
      }

      const hubSlug = slugify(currentHubTitle);
      const clusterSlug = slugify(currentClusterTitle);
      const id = `${hubSlug}/${clusterSlug}/${slugify(keyword)}`;

      keywords.push({
        id,
        hubSlug,
        hubTitle: currentHubTitle,
        clusterSlug,
        clusterTitle: currentClusterTitle,
        keyword,
      });
    }
  }

  return keywords;
}

function extractFrontmatterKeys(raw: string): Record<string, string> {
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

/** Stable on-disk path for a list.md keyword (third segment of keyword.id is slugify(keyword)). */
export function topicArticlePathForKeyword(websiteRoot: string, keyword: TopicKeyword): string {
  const slug = keyword.id.split("/").pop() ?? "";
  return path.join(websiteRoot, "content", "topics", keyword.hubSlug, keyword.clusterSlug, `${slug}.md`);
}

const SCHEDULED_EXCLUDED_HUBS = new Set(["tool-alternatives"]);
const COMPETITOR_INTENT_PATTERN =
  /\b(?:alternative|alternatives|vs|versus|review|pros and cons|pricing|competitor|replacement)\b/i;
const COMPETITOR_NAME_PATTERN =
  /\b(?:divmagic|snipcss|snip css|css scan|cssscan|copycss|visbug)\b/i;

export function isScheduledTopicKeywordAllowed(keyword: TopicKeyword): boolean {
  if (SCHEDULED_EXCLUDED_HUBS.has(keyword.hubSlug)) return false;
  const text = `${keyword.keyword} ${keyword.clusterTitle} ${keyword.hubTitle}`;
  if (COMPETITOR_NAME_PATTERN.test(text) && COMPETITOR_INTENT_PATTERN.test(text)) {
    return false;
  }
  return true;
}

/**
 * Collect listKeywordId values from topic article frontmatter (see artifact frontmatter).
 */
export function loadPublishedListKeywordIds(websiteRoot: string): Set<string> {
  const topicsDir = path.join(websiteRoot, "content", "topics");
  const ids = new Set<string>();
  if (!existsSync(topicsDir)) return ids;

  for (const hub of readdirSync(topicsDir)) {
    const hubPath = path.join(topicsDir, hub);
    if (!statSync(hubPath).isDirectory()) continue;

    for (const cluster of readdirSync(hubPath)) {
      const clusterPath = path.join(hubPath, cluster);
      if (!statSync(clusterPath).isDirectory()) continue;

      for (const file of readdirSync(clusterPath)) {
        if (!file.endsWith(".md") || file === "_index.md") continue;
        const raw = readFileSync(path.join(clusterPath, file), "utf-8");
        const fm = extractFrontmatterKeys(raw);
        const id = fm.listKeywordId?.trim();
        if (id) ids.add(id);
      }
    }
  }

  return ids;
}

export function pickNextKeyword(
  allKeywords: TopicKeyword[],
  usedKeywordIds: Set<string>,
  options?: {
    websiteRoot?: string;
    /** When true (default), skip keywords that already have an article on disk or listKeywordId in frontmatter. */
    skipExistingTopicFiles?: boolean;
  }
): TopicKeyword | undefined {
  const websiteRoot = options?.websiteRoot;
  const skipExisting = options?.skipExistingTopicFiles !== false && Boolean(websiteRoot);
  const fmIds = skipExisting && websiteRoot ? loadPublishedListKeywordIds(websiteRoot) : new Set<string>();

  const pool = allKeywords.filter((item) => {
    if (!isScheduledTopicKeywordAllowed(item)) return false;
    if (usedKeywordIds.has(item.id)) return false;
    if (fmIds.has(item.id)) return false;
    if (skipExisting && websiteRoot && existsSync(topicArticlePathForKeyword(websiteRoot, item))) {
      return false;
    }
    return true;
  });
  if (pool.length === 0) return undefined;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx];
}
