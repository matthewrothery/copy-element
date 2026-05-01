import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import { InternalLinkCandidate, TopicKeyword } from "./types.js";

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

function humanizeSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function readFrontmatter(filePath: string): Record<string, string> {
  return extractFrontmatter(readFileSync(filePath, "utf-8"));
}

function loadArticleCandidate(
  filePath: string,
  hubSlug: string,
  hubTitle: string,
  clusterSlug: string,
  clusterTitle: string
): InternalLinkCandidate | undefined {
  const frontmatter = readFrontmatter(filePath);
  const parsed = path.parse(filePath);
  const slug = frontmatter.slug || parsed.name;
  const title = frontmatter.title;
  if (!title || !slug) return undefined;

  return {
    title,
    topic: clusterTitle,
    url: `/topics/${hubSlug}/${clusterSlug}/${slug}`,
    type: "article",
    hubSlug,
    hubTitle,
    clusterSlug,
    clusterTitle,
    slug,
  };
}

export function loadInternalLinkCandidates(websiteRoot: string): InternalLinkCandidate[] {
  const topicsRoot = path.resolve(websiteRoot, "content", "topics");
  if (!existsSync(topicsRoot)) return [];

  const candidates: InternalLinkCandidate[] = [];
  const hubEntries = readdirSync(topicsRoot, { withFileTypes: true }).filter((entry) =>
    entry.isDirectory()
  );

  for (const hubEntry of hubEntries) {
    const hubSlug = hubEntry.name;
    const hubDir = path.join(topicsRoot, hubSlug);
    const hubIndexPath = path.join(hubDir, "_index.md");
    const hubFrontmatter = existsSync(hubIndexPath) ? readFrontmatter(hubIndexPath) : {};
    const hubTitle = hubFrontmatter.title || humanizeSlug(hubSlug);

    candidates.push({
      title: hubTitle,
      topic: "Topic hub",
      url: `/topics/${hubSlug}`,
      type: "hub",
      hubSlug,
      hubTitle,
    });

    const clusterEntries = readdirSync(hubDir, { withFileTypes: true }).filter((entry) =>
      entry.isDirectory()
    );

    for (const clusterEntry of clusterEntries) {
      const clusterSlug = clusterEntry.name;
      const clusterDir = path.join(hubDir, clusterSlug);
      const clusterIndexPath = path.join(clusterDir, "_index.md");
      const clusterFrontmatter = existsSync(clusterIndexPath)
        ? readFrontmatter(clusterIndexPath)
        : {};
      const clusterTitle = clusterFrontmatter.title || humanizeSlug(clusterSlug);

      candidates.push({
        title: clusterTitle,
        topic: hubTitle,
        url: `/topics/${hubSlug}/${clusterSlug}`,
        type: "cluster",
        hubSlug,
        hubTitle,
        clusterSlug,
        clusterTitle,
      });

      const articleFiles = readdirSync(clusterDir, { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".md") && entry.name !== "_index.md")
        .map((entry) => path.join(clusterDir, entry.name));

      for (const articleFile of articleFiles) {
        const article = loadArticleCandidate(
          articleFile,
          hubSlug,
          hubTitle,
          clusterSlug,
          clusterTitle
        );
        if (article) candidates.push(article);
      }
    }
  }

  return candidates;
}

export function prioritizeInternalLinks(
  candidates: InternalLinkCandidate[],
  keyword: TopicKeyword
): InternalLinkCandidate[] {
  const targetSlug = slugify(keyword.keyword);

  return candidates
    .filter(
      (candidate) =>
        candidate.hubSlug !== keyword.hubSlug ||
        candidate.clusterSlug !== keyword.clusterSlug ||
        candidate.slug !== targetSlug
    )
    .sort((a, b) => {
      const aScore = scoreCandidate(a, keyword);
      const bScore = scoreCandidate(b, keyword);
      if (aScore !== bScore) return bScore - aScore;
      return a.title.localeCompare(b.title);
    });
}

function scoreCandidate(candidate: InternalLinkCandidate, keyword: TopicKeyword): number {
  let score = 0;
  if (candidate.hubSlug === keyword.hubSlug) score += 2;
  if (candidate.clusterSlug === keyword.clusterSlug) score += 3;
  if (candidate.type === "article") score += 2;
  if (candidate.type === "cluster") score += 1;
  return score;
}
