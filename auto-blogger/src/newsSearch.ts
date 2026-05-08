import httpcloak from "httpcloak";
import { NewsItem } from "./types.js";
import { extractReadableContent } from "./extractContent.js";

export const NEWS_QUERIES = [
  "vibe coding",
  "vibe code",
  "ui capture",
  "building ui with ai",
  "design with ai",
  "ai ui generation",
  "ai frontend tools",
  "cursor windsurf",
  "ai coding agents",
];

export const NEWS_RECENCY_HOURS = 24;

const EXCLUDED_DOMAINS = [
  "youtube.com",
  "reddit.com",
  "pinterest.com",
  "amazon.com",
  "facebook.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
];

const CHROME_PRESETS = ["chrome-146", "chrome-145", "chrome-144", "chrome-143"] as const;

function randomPreset(): string {
  return CHROME_PRESETS[Math.floor(Math.random() * CHROME_PRESETS.length)];
}

function createSession(): InstanceType<typeof httpcloak.Session> {
  return new httpcloak.Session({ preset: randomPreset() });
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchText(session: InstanceType<typeof httpcloak.Session>, url: string): Promise<string> {
  const response = await session.get(url);
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(`Failed request ${url} (${response.statusCode})`);
  }
  return response.text ?? "";
}

/**
 * Map an arbitrary recency window in hours to Bing's `qft=+filterui:age-...`
 * date bucket. Bing only supports these four buckets.
 */
function bingAgeFilter(hours: number): string {
  if (hours <= 24) return "age-lt24h";
  if (hours <= 24 * 7) return "age-lt7d";
  if (hours <= 24 * 30) return "age-lt1month";
  return "age-lt1year";
}

function buildExclusionSuffix(): string {
  return EXCLUDED_DOMAINS.map((d) => `-site:${d}`).join(" ");
}

function isExcludedUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return EXCLUDED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return true;
  }
}

function parseBingResults(html: string): NewsItem[] {
  const items: NewsItem[] = [];
  const seen = new Set<string>();
  // Bing wraps each organic result in <li class="b_algo"> ... <h2><a href="...">title</a></h2>
  const blocks = [...html.matchAll(/<li[^>]*class="[^"]*b_algo[^"]*"[^>]*>([\s\S]*?)<\/li>/g)];
  for (const block of blocks) {
    const inner = block[1] ?? "";
    const anchorMatch = inner.match(/<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!anchorMatch) continue;
    const url = decodeHtmlEntities(anchorMatch[1] ?? "").trim();
    const title = decodeHtmlEntities(stripTags(anchorMatch[2] ?? ""));
    if (!url || !title || seen.has(url)) continue;
    if (!/^https?:\/\//i.test(url)) continue;
    if (isExcludedUrl(url)) continue;
    seen.add(url);

    let source = "";
    try {
      source = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      // ignore
    }

    items.push({ title, url, publishedAt: "", source });
  }
  return items;
}

export async function fetchBingResults(query: string): Promise<NewsItem[]> {
  const exclusion = buildExclusionSuffix();
  const fullQuery = `${query} ${exclusion}`.trim();
  const ageFilter = bingAgeFilter(NEWS_RECENCY_HOURS);
  const url =
    `https://www.bing.com/search?q=${encodeURIComponent(fullQuery)}` +
    `&qft=${encodeURIComponent("+filterui:" + ageFilter)}&form=QBRE&cc=au&setlang=en`;
  const session = createSession();
  const html = await fetchText(session, url);
  return parseBingResults(html);
}

export async function fetchNewsItems(limit = 6): Promise<NewsItem[]> {
  const results = await Promise.allSettled(NEWS_QUERIES.map((q) => fetchBingResults(q)));

  const seenUrls = new Set<string>();
  const allItems: NewsItem[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") {
      console.warn(`[news] Bing query failed: ${result.reason}`);
      continue;
    }
    for (const item of result.value) {
      if (!item.url || seenUrls.has(item.url)) continue;
      seenUrls.add(item.url);
      allItems.push(item);
    }
  }

  const top = allItems.slice(0, limit);

  const enriched: NewsItem[] = [];
  for (const item of top) {
    const content = await extractReadableContent(item.url);
    enriched.push({ ...item, content });
  }

  return enriched;
}
