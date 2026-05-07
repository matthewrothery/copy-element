import httpcloak from "httpcloak";
import { NewsItem } from "./types.js";

export const NEWS_QUERIES = [
  "vibe coding AI",
  "AI UI tools",
  "cursor windsurf AI coding",
  "AI agent frontend development",
];

const CHROME_PRESETS = [
  "chrome-146",
  "chrome-145",
  "chrome-144",
  "chrome-143",
] as const;

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

async function fetchContent(url: string): Promise<string | undefined> {
  try {
    const session = createSession();
    const html = await fetchText(session, url);
    return stripTags(html).slice(0, 7000);
  } catch {
    return undefined;
  }
}

function parseGoogleNewsRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];

  for (const block of itemBlocks) {
    const content = block[1] ?? "";

    const titleMatch =
      content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ??
      content.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = content.match(/<link>([\s\S]*?)<\/link>/);
    const pubDateMatch = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const sourceMatch = content.match(/<source[^>]*>([\s\S]*?)<\/source>/);

    const title = decodeHtmlEntities(stripTags(titleMatch?.[1] ?? ""));
    const url = decodeHtmlEntities((linkMatch?.[1] ?? "").trim());
    const publishedAt = (pubDateMatch?.[1] ?? "").trim();
    const source = decodeHtmlEntities(stripTags(sourceMatch?.[1] ?? ""));

    if (title && url) {
      items.push({ title, url, publishedAt, source });
    }
  }

  return items;
}

export async function fetchGoogleNewsRss(query: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-AU&gl=AU&ceid=AU:en`;
  const session = createSession();
  const xml = await fetchText(session, url);
  return parseGoogleNewsRss(xml);
}

function isWithin48Hours(pubDateStr: string): boolean {
  if (!pubDateStr) return false;
  try {
    const pub = new Date(pubDateStr).getTime();
    const cutoff = Date.now() - 48 * 60 * 60 * 1000;
    return pub >= cutoff;
  } catch {
    return false;
  }
}

export async function fetchNewsItems(limit = 6): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    NEWS_QUERIES.map((q) => fetchGoogleNewsRss(q))
  );

  const seenUrls = new Set<string>();
  const allItems: NewsItem[] = [];

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    for (const item of result.value) {
      if (!item.url || seenUrls.has(item.url)) continue;
      seenUrls.add(item.url);
      allItems.push(item);
    }
  }

  const recent = allItems
    .filter((item) => isWithin48Hours(item.publishedAt))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const top = recent.slice(0, limit);

  const enriched: NewsItem[] = [];
  for (const item of top) {
    const content = await fetchContent(item.url);
    enriched.push({ ...item, content });
  }

  return enriched;
}
