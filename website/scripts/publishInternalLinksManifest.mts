/**
 * Publishes an internal-links manifest to S3 for the auto-blogger Lambda to
 * consume as its ContentRepository source.
 *
 * Run by the website CI after each deploy:
 *   node --import tsx website/scripts/publishInternalLinksManifest.mts
 *
 * Required env vars:
 *   AUTO_BLOG_S3_BUCKET   — the auto-blog S3 bucket name
 *   AWS_REGION            — (optional, defaults to us-east-2)
 */

import { existsSync, readdirSync, readFileSync, statSync } from "fs";
import path from "path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const MANIFEST_KEY = "manifests/element-armory/internal-links.json";
const WEBSITE_ROOT = path.resolve(import.meta.dirname, "..");

// --- Types (mirror of auto-blogger/src/types.ts InternalLinkCandidate) ---
type InternalLinkCandidate = {
  title: string;
  topic: string;
  url: string;
  type: "hub" | "cluster" | "article" | "blog";
  hubSlug: string;
  hubTitle: string;
  clusterSlug?: string;
  clusterTitle?: string;
  slug?: string;
  linkKeywords?: string[];
};

// --- Frontmatter parsing ---
type Frontmatter = { scalars: Record<string, string>; lists: Record<string, string[]> };

function extractFrontmatter(raw: string): Frontmatter {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const result: Frontmatter = { scalars: {}, lists: {} };
  if (!match) return result;
  const lines = match[1].split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const listHeader = lines[i].match(/^([A-Za-z][A-Za-z0-9]*):\s*$/);
    if (listHeader) {
      const key = listHeader[1];
      const items: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const item = lines[j].match(/^\s+-\s+(?:"([^"]*)"|(.+))\s*$/);
        if (!item) break;
        items.push((item[1] ?? item[2] ?? "").trim());
        j += 1;
      }
      if (items.length > 0) { result.lists[key] = items; i = j; continue; }
    }
    const scalar = lines[i].match(/^([A-Za-z][A-Za-z0-9]*):\s*(?:"([^"]*)"|(.+))\s*$/);
    if (scalar) result.scalars[scalar[1]] = (scalar[2] ?? scalar[3] ?? "").trim();
    i += 1;
  }
  return result;
}

function humanizeSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- Candidate collection ---
function collectCandidates(websiteRoot: string): InternalLinkCandidate[] {
  const candidates: InternalLinkCandidate[] = [];

  // Blog posts.
  const blogRoot = path.join(websiteRoot, "content", "blog");
  if (existsSync(blogRoot)) {
    for (const file of readdirSync(blogRoot, { withFileTypes: true })) {
      if (!file.isFile() || !file.name.endsWith(".md")) continue;
      const raw = readFileSync(path.join(blogRoot, file.name), "utf-8");
      const fm = extractFrontmatter(raw);
      const slug = fm.scalars.slug || path.parse(file.name).name;
      const title = fm.scalars.title;
      if (!title || !slug) continue;
      candidates.push({ title, topic: "Blog", url: `/blog/${slug}`, type: "blog", hubSlug: "blog", hubTitle: "Blog", slug });
    }
  }

  // Topic hubs / clusters / articles.
  const topicsRoot = path.join(websiteRoot, "content", "topics");
  if (!existsSync(topicsRoot)) return candidates;

  for (const hubEntry of readdirSync(topicsRoot, { withFileTypes: true })) {
    if (!hubEntry.isDirectory()) continue;
    const hubSlug = hubEntry.name;
    const hubDir = path.join(topicsRoot, hubSlug);
    const hubIndex = path.join(hubDir, "_index.md");
    const hubFm = existsSync(hubIndex) ? extractFrontmatter(readFileSync(hubIndex, "utf-8")) : { scalars: {}, lists: {} };
    const hubTitle = hubFm.scalars.title || humanizeSlug(hubSlug);
    candidates.push({ title: hubTitle, topic: "Topic hub", url: `/topics/${hubSlug}`, type: "hub", hubSlug, hubTitle });

    for (const clusterEntry of readdirSync(hubDir, { withFileTypes: true })) {
      if (!clusterEntry.isDirectory()) continue;
      const clusterSlug = clusterEntry.name;
      const clusterDir = path.join(hubDir, clusterSlug);
      const clusterIndex = path.join(clusterDir, "_index.md");
      const clusterFm = existsSync(clusterIndex) ? extractFrontmatter(readFileSync(clusterIndex, "utf-8")) : { scalars: {}, lists: {} };
      const clusterTitle = clusterFm.scalars.title || humanizeSlug(clusterSlug);
      candidates.push({ title: clusterTitle, topic: hubTitle, url: `/topics/${hubSlug}/${clusterSlug}`, type: "cluster", hubSlug, hubTitle, clusterSlug, clusterTitle });

      for (const articleEntry of readdirSync(clusterDir, { withFileTypes: true })) {
        if (!articleEntry.isFile() || !articleEntry.name.endsWith(".md") || articleEntry.name === "_index.md") continue;
        const raw = readFileSync(path.join(clusterDir, articleEntry.name), "utf-8");
        const fm = extractFrontmatter(raw);
        const slug = fm.scalars.slug || path.parse(articleEntry.name).name;
        const title = fm.scalars.title;
        if (!title || !slug) continue;
        candidates.push({
          title,
          topic: clusterTitle,
          url: `/topics/${hubSlug}/${clusterSlug}/${slug}`,
          type: "article",
          hubSlug, hubTitle, clusterSlug, clusterTitle, slug,
          linkKeywords: fm.lists.linkKeywords ?? [],
        });
      }
    }
  }

  return candidates;
}

function collectPublishedKeywordIds(websiteRoot: string): string[] {
  const ids: string[] = [];
  const topicsRoot = path.join(websiteRoot, "content", "topics");
  if (!existsSync(topicsRoot)) return ids;
  for (const hub of readdirSync(topicsRoot)) {
    const hubPath = path.join(topicsRoot, hub);
    if (!statSync(hubPath).isDirectory()) continue;
    for (const cluster of readdirSync(hubPath)) {
      const clusterPath = path.join(hubPath, cluster);
      if (!statSync(clusterPath).isDirectory()) continue;
      for (const file of readdirSync(clusterPath)) {
        if (!file.endsWith(".md") || file === "_index.md") continue;
        const raw = readFileSync(path.join(clusterPath, file), "utf-8");
        const fm = extractFrontmatter(raw);
        const id = fm.scalars.listKeywordId?.trim();
        if (id) ids.push(id);
      }
    }
  }
  return ids;
}

function collectExistingBlogSlugs(websiteRoot: string): string[] {
  const blogRoot = path.join(websiteRoot, "content", "blog");
  if (!existsSync(blogRoot)) return [];
  return readdirSync(blogRoot)
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.parse(f).name);
}

// --- Main ---
const bucket = process.env.AUTO_BLOG_S3_BUCKET;
if (!bucket) {
  console.error("AUTO_BLOG_S3_BUCKET env var is required");
  process.exit(1);
}

const candidates = collectCandidates(WEBSITE_ROOT);
const publishedKeywordIds = collectPublishedKeywordIds(WEBSITE_ROOT);
const existingBlogSlugs = collectExistingBlogSlugs(WEBSITE_ROOT);

const manifest = {
  generatedAt: Date.now(),
  websiteRoot: "elementarmory.com",
  candidates,
  publishedKeywordIds,
  existingBlogSlugs,
};

const body = JSON.stringify(manifest, null, 2);
const region = process.env.AWS_REGION ?? "us-east-2";
const client = new S3Client({ region });

await client.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: MANIFEST_KEY,
    Body: body,
    ContentType: "application/json",
  })
);

console.log(`Published internal-links manifest to s3://${bucket}/${MANIFEST_KEY}`);
console.log(`  candidates: ${candidates.length}, published keywords: ${publishedKeywordIds.length}, blog slugs: ${existingBlogSlugs.length}`);
