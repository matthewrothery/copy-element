import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "fs";
import path from "path";
import matter from "gray-matter";

type GscRow = {
  url: string;
  path: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

type TopicMetrics = {
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  bodyH1Headings: number;
};

type TopicFile = {
  path: string;
  routePath: string;
  title: string;
  excerpt: string;
  date?: string;
  updatedAt?: string;
  hub?: string;
  hubTitle?: string;
  cluster?: string;
  clusterTitle?: string;
  slug?: string;
  metrics: TopicMetrics;
};

type Opportunity = GscRow & {
  title?: string;
  excerpt?: string;
  hub?: string;
  hubTitle?: string;
  cluster?: string;
  clusterTitle?: string;
  slug?: string;
  date?: string;
  updatedAt?: string;
  sourcePath?: string;
  metrics?: TopicMetrics;
  score: number;
  reasons: string[];
};

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");
const WEBSITE_ROOT = path.resolve(import.meta.dirname, "..");
const TOPICS_ROOT = path.join(WEBSITE_ROOT, "content", "topics");
const GSC_ROOT = path.join(REPO_ROOT, "google-search-console", "performance");
const DATA_DIR = path.join(WEBSITE_ROOT, "data");

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells.map((cell) => cell.trim());
}

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value.replace("%", ""));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function urlToPath(url: string): string {
  try {
    return new URL(url).pathname.replace(/\/$/, "") || "/";
  } catch {
    return url.replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "") || "/";
  }
}

function readPagesCsv(): GscRow[] {
  const csvPath = path.join(GSC_ROOT, "Pages.csv");
  const raw = readFileSync(csvPath, "utf-8").trim();
  const [, ...lines] = raw.split(/\r?\n/);

  return lines
    .map((line) => {
      const [url, clicks, impressions, ctr, position] = parseCsvLine(line);
      return {
        url,
        path: urlToPath(url),
        clicks: toNumber(clicks),
        impressions: toNumber(impressions),
        ctr: toNumber(ctr) / 100,
        position: toNumber(position),
      };
    })
    .filter((row) => row.path.startsWith("/topics/"));
}

function readMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) return readMarkdownFiles(fullPath);
    return entry.endsWith(".md") ? [fullPath] : [];
  });
}

function metricsForBody(body: string): TopicMetrics {
  return {
    wordCount: body.trim().split(/\s+/).filter(Boolean).length,
    internalLinks: (body.match(/\]\(\/(?:topics|blog)\//g) ?? []).length,
    externalLinks: (body.match(/\]\(https?:\/\//g) ?? []).length,
    bodyH1Headings: (body.match(/^#\s+/gm) ?? []).length,
  };
}

function readTopicFiles(): Map<string, TopicFile> {
  const topics = new Map<string, TopicFile>();
  for (const file of readMarkdownFiles(TOPICS_ROOT)) {
    if (path.basename(file) === "_index.md") continue;
    const raw = readFileSync(file, "utf-8");
    const { data, content } = matter(raw);
    const hub = data.hub as string | undefined;
    const cluster = data.cluster as string | undefined;
    const slug = data.slug as string | undefined;
    if (!hub || !cluster || !slug) continue;

    const routePath = `/topics/${hub}/${cluster}/${slug}`;
    topics.set(routePath, {
      path: path.relative(REPO_ROOT, file),
      routePath,
      title: data.title as string,
      excerpt: data.excerpt as string,
      date: data.date as string | undefined,
      updatedAt: data.updatedAt as string | undefined,
      hub,
      hubTitle: data.hubTitle as string | undefined,
      cluster,
      clusterTitle: data.clusterTitle as string | undefined,
      slug,
      metrics: metricsForBody(content),
    });
  }
  return topics;
}

function scoreOpportunity(row: GscRow, topic?: TopicFile): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = row.impressions;

  if (row.position >= 4 && row.position <= 15) {
    score *= 2.2;
    reasons.push("ranking in positions 4-15");
  }
  if (row.ctr < 0.01 && row.impressions >= 10) {
    score *= 1.5;
    reasons.push("low CTR for visible page");
  }
  if (topic?.metrics.internalLinks === 0) {
    score *= 1.25;
    reasons.push("no internal links in body");
  }
  if (topic?.metrics.externalLinks === 0) {
    reasons.push("no external citations in body");
  }
  if (topic?.metrics.bodyH1Headings && topic.metrics.bodyH1Headings > 0) {
    reasons.push("body contains H1 headings");
  }
  if (row.path.includes("copy-html") || row.path.includes("copy-css")) {
    score *= 1.15;
    reasons.push("high product-fit extraction intent");
  }
  if (row.path.includes("alternative") || row.path.includes("review")) {
    score *= 1.1;
    reasons.push("high product-fit comparison intent");
  }

  return { score: Math.round(score * 100) / 100, reasons };
}

function buildOpportunities(): Opportunity[] {
  const topics = readTopicFiles();
  return readPagesCsv()
    .map((row) => {
      const topic = topics.get(row.path);
      const { score, reasons } = scoreOpportunity(row, topic);
      return {
        ...row,
        title: topic?.title,
        excerpt: topic?.excerpt,
        hub: topic?.hub,
        hubTitle: topic?.hubTitle,
        cluster: topic?.cluster,
        clusterTitle: topic?.clusterTitle,
        slug: topic?.slug,
        date: topic?.date,
        updatedAt: topic?.updatedAt,
        sourcePath: topic?.path,
        metrics: topic?.metrics,
        score,
        reasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function writeReport(opportunities: Opportunity[]): void {
  mkdirSync(DATA_DIR, { recursive: true });
  const generatedAt = new Date().toISOString();
  const payload = {
    generatedAt,
    source: "google-search-console/performance/Pages.csv",
    opportunities,
  };
  writeFileSync(
    path.join(DATA_DIR, "topic-opportunities.json"),
    `${JSON.stringify(payload, null, 2)}\n`
  );

  const rows = opportunities.slice(0, 25).map((item, index) => {
    const ctr = `${(item.ctr * 100).toFixed(2)}%`;
    return `| ${index + 1} | ${item.path} | ${item.impressions} | ${ctr} | ${item.position.toFixed(2)} | ${item.score.toFixed(2)} | ${item.reasons.join("; ")} |`;
  });

  const report = [
    "# Topic opportunity report",
    "",
    `Generated: ${generatedAt}`,
    "",
    "| Rank | URL path | Impressions | CTR | Position | Score | Reasons |",
    "|---:|---|---:|---:|---:|---:|---|",
    ...rows,
    "",
  ].join("\n");

  writeFileSync(path.join(DATA_DIR, "topic-opportunities.md"), report);
}

writeReport(buildOpportunities());
