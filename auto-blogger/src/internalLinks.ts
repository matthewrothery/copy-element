import { existsSync, readdirSync, readFileSync } from "fs";
import path from "path";
import { InternalLinkCandidate, TopicKeyword } from "./types.js";

type Frontmatter = {
  scalars: Record<string, string>;
  lists: Record<string, string[]>;
};

function extractFrontmatterRaw(raw: string): Frontmatter {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const result: Frontmatter = { scalars: {}, lists: {} };
  if (!match) return result;

  const lines = match[1].split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const listHeader = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*$/);
    if (listHeader) {
      const key = listHeader[1];
      const items: string[] = [];
      let j = i + 1;
      while (j < lines.length) {
        const itemLine = lines[j].match(/^\s+-\s+(?:"([^"]*)"|(.+))\s*$/);
        if (!itemLine) break;
        items.push((itemLine[1] ?? itemLine[2] ?? "").trim());
        j += 1;
      }
      if (items.length > 0) {
        result.lists[key] = items;
        i = j;
        continue;
      }
    }
    const scalar = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(?:"([^"]*)"|(.+))\s*$/);
    if (scalar) {
      result.scalars[scalar[1]] = (scalar[2] ?? scalar[3] ?? "").trim();
    }
    i += 1;
  }
  return result;
}

function extractFrontmatter(raw: string): Record<string, string> {
  return extractFrontmatterRaw(raw).scalars;
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

function readFrontmatterFull(filePath: string): Frontmatter {
  return extractFrontmatterRaw(readFileSync(filePath, "utf-8"));
}

function loadArticleCandidate(
  filePath: string,
  hubSlug: string,
  hubTitle: string,
  clusterSlug: string,
  clusterTitle: string
): InternalLinkCandidate | undefined {
  const frontmatter = readFrontmatterFull(filePath);
  const parsed = path.parse(filePath);
  const slug = frontmatter.scalars.slug || parsed.name;
  const title = frontmatter.scalars.title;
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
    linkKeywords: frontmatter.lists.linkKeywords ?? [],
    filePath,
  };
}

function loadBlogCandidate(filePath: string): InternalLinkCandidate | undefined {
  const frontmatter = readFrontmatterFull(filePath);
  const parsed = path.parse(filePath);
  const slug = frontmatter.scalars.slug || parsed.name;
  const title = frontmatter.scalars.title;
  if (!title || !slug) return undefined;

  return {
    title,
    topic: "Blog",
    url: `/blog/${slug}`,
    type: "blog",
    hubSlug: "blog",
    hubTitle: "Blog",
    slug,
    filePath,
  };
}

export function loadInternalLinkCandidates(websiteRoot: string): InternalLinkCandidate[] {
  const topicsRoot = path.resolve(websiteRoot, "content", "topics");

  const candidates: InternalLinkCandidate[] = [];
  const blogRoot = path.resolve(websiteRoot, "content", "blog");
  if (existsSync(blogRoot)) {
    const blogFiles = readdirSync(blogRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => path.join(blogRoot, entry.name));

    for (const blogFile of blogFiles) {
      const blog = loadBlogCandidate(blogFile);
      if (blog) candidates.push(blog);
    }
  }

  if (!existsSync(topicsRoot)) return candidates;

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

export type KeywordIndexEntry = {
  phrase: string;
  phraseLower: string;
  candidateId: string;
  candidateUrl: string;
};

function candidateIdFor(c: InternalLinkCandidate): string {
  if (c.type === "article") return c.slug ?? c.url;
  if (c.type === "blog") return `blog:${c.slug ?? c.url}`;
  if (c.type === "cluster") return `${c.hubSlug}__${c.clusterSlug ?? ""}`;
  return c.hubSlug;
}

/**
 * Flat phrase → candidate index. Sorted by descending phrase length so a greedy
 * scan prefers the most specific match. Phrases are lowercased for matching.
 */
export function buildKeywordIndex(candidates: InternalLinkCandidate[]): KeywordIndexEntry[] {
  const entries: KeywordIndexEntry[] = [];
  for (const c of candidates) {
    const keywords = c.linkKeywords ?? [];
    for (const kw of keywords) {
      const phrase = kw.trim();
      if (phrase.length < 3) continue;
      entries.push({
        phrase,
        phraseLower: phrase.toLowerCase(),
        candidateId: candidateIdFor(c),
        candidateUrl: c.url,
      });
    }
  }
  entries.sort((a, b) => b.phraseLower.length - a.phraseLower.length);
  return entries;
}

/**
 * Collect all linkKeywords currently in use (lowercased) so a new article can
 * avoid emitting collisions.
 */
export function collectExistingKeywords(candidates: InternalLinkCandidate[]): Set<string> {
  const set = new Set<string>();
  for (const c of candidates) {
    for (const kw of c.linkKeywords ?? []) {
      const v = kw.trim().toLowerCase();
      if (v) set.add(v);
    }
  }
  return set;
}
