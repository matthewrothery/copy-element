import type { NewsConfig } from "./projectConfig.js";
import { NewsItem } from "./types.js";
import { extractReadableContent } from "./extractContent.js";

export const DEFAULT_NEWS_RECENCY_HOURS = 168;
export const MIN_NEWS_CONTENT_CHARS = 300;
const FETCH_TIMEOUT_MS = 12_000;
const CONTENT_TIMEOUT_MS = 8_000;
const MAX_ENRICHMENT_ATTEMPTS = 12;
const ENRICHMENT_CONCURRENCY = 4;

function escapeRegExpClass(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildRelevanceRegex(keywords: string[]): RegExp {
  const alternation = keywords.map(escapeRegExpClass).join("|");
  return new RegExp(`\\b(${alternation})\\b`);
}

function buildExcludeRegex(keywords: string[]): RegExp {
  const alternation = keywords.map(escapeRegExpClass).join("|");
  return new RegExp(`\\b(${alternation})\\b`);
}

type RawNewsItem = NewsItem & {
  sourceUrl?: string;
  discoveryProvider: "google-news-rss" | "duckduckgo";
  discoveryQuery: string;
};

type SearchResult = {
  title: string;
  url: string;
  snippet?: string;
};

type DiscoveryStats = {
  queryCount: number;
  rawItems: number;
  dedupedItems: number;
  enrichedItems: number;
  skipped: Record<string, number>;
  selected: { title: string; url: string; source: string; publishedAt: string }[];
};

function incrementSkipped(stats: DiscoveryStats, reason: string): void {
  stats.skipped[reason] = (stats.skipped[reason] ?? 0) + 1;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function readTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return stripTags(decodeHtmlEntities(match?.[1] ?? ""));
}

function readTagAttribute(block: string, tag: string, attribute: string): string | undefined {
  const tagMatch = block.match(new RegExp(`<${tag}\\s+([^>]*)>`, "i"));
  const attrs = tagMatch?.[1] ?? "";
  const attrMatch = attrs.match(new RegExp(`${attribute}=["']([^"']+)["']`, "i"));
  const value = attrMatch?.[1];
  return value ? decodeHtmlEntities(value) : undefined;
}

function isGoogleNewsUrl(url: string): boolean {
  try {
    return new URL(url).hostname.toLowerCase().endsWith("news.google.com");
  } catch {
    return false;
  }
}

function makeIsExcludedUrl(excludedDomains: string[]): (url: string) => boolean {
  return (url: string) => {
    try {
      const host = new URL(url).hostname.toLowerCase();
      return excludedDomains.some((d) => host === d || host.endsWith(`.${d}`));
    } catch {
      return true;
    }
  };
}

function normalizeUrlForDedupe(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^utm_/i.test(key) || key === "fbclid" || key === "gclid") {
        parsed.searchParams.delete(key);
      }
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim().toLowerCase();
  }
}

function normalizeTitleForDedupe(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+-\s+[^-]+$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function makeIsRelevantNewsItem(
  relevanceRegex: RegExp,
  excludeRegex: RegExp
): (item: Pick<NewsItem, "title" | "description" | "source">) => boolean {
  return (item) => {
    const text = `${item.title} ${item.description ?? ""} ${item.source}`.toLowerCase();
    if (excludeRegex.test(text)) return false;
    return relevanceRegex.test(text);
  };
}

function titleWithoutSource(title: string, source: string): string {
  const suffix = source ? new RegExp(`\\s+-\\s+${escapeRegExpClass(source)}\\s*$`, "i") : undefined;
  return (suffix ? title.replace(suffix, "") : title.replace(/\s+-\s+[^-]+$/, "")).trim();
}

function googleNewsRssUrl(query: string): string {
  const fullQuery = `${query} when:7d`;
  return (
    `https://news.google.com/rss/search?q=${encodeURIComponent(fullQuery)}` +
    "&hl=en-US&gl=US&ceid=US:en"
  );
}

function googleNewsArticleId(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("news.google.com")) return undefined;
    const match = parsed.pathname.match(/\/articles\/([^/?#]+)/);
    return match?.[1];
  } catch {
    return undefined;
  }
}

async function fetchHtml(url: string, userAgent: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const response = await fetch(url, {
    headers: { "user-agent": userAgent },
    signal: controller.signal,
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) {
    throw new Error(`Failed request ${url} (${response.status})`);
  }
  return response.text();
}

async function decodeGoogleNewsUrl(url: string, userAgent: string): Promise<string | undefined> {
  const id = googleNewsArticleId(url);
  if (!id) return undefined;

  const articlePageHtml = await fetchHtml(url, userAgent);
  const ts = articlePageHtml.match(/data-n-a-ts="([^"]+)"/)?.[1];
  const signature = articlePageHtml.match(/data-n-a-sg="([^"]+)"/)?.[1];
  if (!ts || !signature) return undefined;

  const payload = [
    "Fbv4je",
    JSON.stringify([
      "garturlreq",
      [
        [
          "en-US",
          "US",
          ["FINANCE_TOP_INDICES", "WEB_TEST_1_0_0"],
          null,
          null,
          1,
          1,
          "US:en",
          null,
          180,
          null,
          null,
          null,
          null,
          null,
          0,
          null,
          null,
          [Number(ts), 0],
        ],
        "en-US",
        "US",
        1,
        [2, 3, 4, 8],
        1,
        0,
        "655000234",
        0,
        0,
        null,
        0,
      ],
      id,
      Number(ts),
      signature,
    ]),
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const response = await fetch(
    "https://news.google.com/_/DotsSplashUi/data/batchexecute?rpcids=Fbv4je",
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded;charset=utf-8",
        "referer": "https://news.google.com/",
        "user-agent": userAgent,
      },
      body: `f.req=${encodeURIComponent(JSON.stringify([[payload]]))}`,
      signal: controller.signal,
    }
  ).finally(() => clearTimeout(timeout));
  if (!response.ok) {
    throw new Error(`Google News decode failed (${response.status})`);
  }
  try {
    const text = await response.text();
    const jsonLine = text.split("\n").find((line) => line.trim().startsWith("[["));
    if (!jsonLine) return undefined;
    const parsed = JSON.parse(jsonLine) as unknown[];
    const encodedResult = (parsed[0] as unknown[] | undefined)?.[2];
    if (typeof encodedResult !== "string") return undefined;
    const result = JSON.parse(encodedResult) as unknown[];
    const decodedUrl = result[1];
    return typeof decodedUrl === "string" ? decodedUrl : undefined;
  } catch {
    return undefined;
  }
}

async function extractReadableContentBounded(url: string): Promise<string | undefined> {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      extractReadableContent(url),
      new Promise<undefined>((resolve) => {
        timeout = setTimeout(() => resolve(undefined), CONTENT_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export function parseGoogleNewsRss(xml: string, query: string): RawNewsItem[] {
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  const items: RawNewsItem[] = [];

  for (const blockMatch of blocks) {
    const block = blockMatch[1] ?? "";
    const title = readTag(block, "title");
    const url = readTag(block, "link");
    const publishedAt = readTag(block, "pubDate");
    const source = readTag(block, "source");
    const sourceUrl = readTagAttribute(block, "source", "url");
    const description = readTag(block, "description");

    if (!title || !url || !publishedAt) continue;
    items.push({
      title,
      url,
      publishedAt,
      source,
      sourceUrl,
      description,
      discoveryProvider: "google-news-rss",
      discoveryQuery: query,
    });
  }

  return items;
}

async function fetchGoogleNewsRss(query: string, userAgent: string): Promise<RawNewsItem[]> {
  const xml = await fetchHtml(googleNewsRssUrl(query), userAgent);
  return parseGoogleNewsRss(xml, query);
}

function normalizeDuckDuckGoUrl(rawUrl: string): string {
  try {
    const url = rawUrl.startsWith("http") ? new URL(rawUrl) : new URL(rawUrl, "https://duckduckgo.com");
    const encodedDestination = url.searchParams.get("uddg");
    return encodedDestination ? decodeURIComponent(encodedDestination) : url.toString();
  } catch {
    return rawUrl;
  }
}

export function parseDuckDuckGoResults(html: string): SearchResult[] {
  const matches = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  const snippets = [...html.matchAll(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)];

  return matches.map((match, idx) => ({
    url: normalizeDuckDuckGoUrl(decodeHtmlEntities(match[1] ?? "")),
    title: stripTags(decodeHtmlEntities(match[2] ?? "")),
    snippet: stripTags(decodeHtmlEntities(snippets[idx]?.[1] ?? "")),
  }));
}

async function searchDuckDuckGo(query: string, limit: number, userAgent: string): Promise<SearchResult[]> {
  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const html = await fetchHtml(searchUrl, userAgent);
  return parseDuckDuckGoResults(html).slice(0, limit);
}

async function fetchFallbackNews(
  query: string,
  userAgent: string,
  isExcludedUrl: (url: string) => boolean
): Promise<RawNewsItem[]> {
  const results = await searchDuckDuckGo(`${query} AI news`, 10, userAgent);
  return results
    .filter((item) => /^https?:\/\//i.test(item.url) && !isExcludedUrl(item.url) && !isGoogleNewsUrl(item.url))
    .map((item) => ({
      title: item.title,
      url: item.url,
      publisherUrl: item.url,
      publishedAt: "",
      source: new URL(item.url).hostname.replace(/^www\./, ""),
      description: item.snippet,
      discoveryProvider: "duckduckgo",
      discoveryQuery: query,
    }));
}

function isRecentEnough(publishedAt: string, recencyHours: number): boolean {
  if (!publishedAt) return true;
  const publishedMs = Date.parse(publishedAt);
  if (Number.isNaN(publishedMs)) return false;
  return Date.now() - publishedMs <= recencyHours * 60 * 60 * 1000;
}

function dedupeNewsItems(
  items: RawNewsItem[],
  isRelevant: (item: Pick<NewsItem, "title" | "description" | "source">) => boolean
): RawNewsItem[] {
  const seen = new Set<string>();
  const deduped: RawNewsItem[] = [];

  for (const item of items) {
    if (!isRelevant(item)) continue;
    const urlKey = normalizeUrlForDedupe(item.publisherUrl ?? item.url);
    const titleKey = normalizeTitleForDedupe(item.title);
    const key = `${urlKey}::${titleKey}`;
    if (seen.has(key) || seen.has(titleKey)) continue;
    seen.add(key);
    seen.add(titleKey);
    deduped.push(item);
  }

  return deduped;
}

type ResolveDeps = {
  userAgent: string;
  isExcludedUrl: (url: string) => boolean;
};

async function resolvePublisherUrl(item: RawNewsItem, deps: ResolveDeps): Promise<string | undefined> {
  const { isExcludedUrl, userAgent } = deps;
  if (item.publisherUrl && !isGoogleNewsUrl(item.publisherUrl) && !isExcludedUrl(item.publisherUrl)) {
    return item.publisherUrl;
  }
  if (!isGoogleNewsUrl(item.url) && !isExcludedUrl(item.url)) {
    return item.url;
  }

  try {
    const decoded = await decodeGoogleNewsUrl(item.url, userAgent);
    if (decoded && !isGoogleNewsUrl(decoded) && !isExcludedUrl(decoded)) {
      return decoded;
    }
  } catch (error) {
    console.warn(`[news] Google News URL decode failed for "${item.title}":`, error);
  }

  const cleanTitle = titleWithoutSource(item.title, item.source);
  try {
    const results = await searchDuckDuckGo(`"${cleanTitle}" ${item.source}`.trim(), 6, userAgent);
    const match = results.find((result) => {
      if (!/^https?:\/\//i.test(result.url)) return false;
      if (isGoogleNewsUrl(result.url) || isExcludedUrl(result.url)) return false;
      return normalizeTitleForDedupe(result.title).includes(normalizeTitleForDedupe(cleanTitle).slice(0, 30));
    });
    if (match) return match.url;
  } catch (error) {
    console.warn(`[news] Publisher URL search failed for "${cleanTitle}":`, error);
  }

  if (item.sourceUrl && !isGoogleNewsUrl(item.sourceUrl) && !isExcludedUrl(item.sourceUrl)) {
    const pathPart = new URL(item.sourceUrl).pathname.replace(/\/+$/, "");
    if (pathPart && pathPart !== "") return item.sourceUrl;
  }

  return undefined;
}

export const newsSearchTestHooks = {
  googleNewsArticleId,
  decodeGoogleNewsUrl,
};

async function enrichItem(
  item: RawNewsItem,
  stats: DiscoveryStats,
  recencyHours: number,
  deps: ResolveDeps
): Promise<NewsItem | undefined> {
  if (!isRecentEnough(item.publishedAt, recencyHours)) {
    incrementSkipped(stats, "stale");
    return undefined;
  }
  if (deps.isExcludedUrl(item.publisherUrl ?? item.url)) {
    incrementSkipped(stats, "excluded-domain");
    return undefined;
  }

  const publisherUrl = await resolvePublisherUrl(item, deps);
  if (!publisherUrl) {
    incrementSkipped(stats, "missing-publisher-url");
    return undefined;
  }

  const content = await extractReadableContentBounded(publisherUrl);
  if (!content || content.trim().length < MIN_NEWS_CONTENT_CHARS) {
    incrementSkipped(stats, "content-too-short");
    return undefined;
  }

  return {
    title: item.title,
    url: publisherUrl,
    publisherUrl,
    publishedAt: item.publishedAt,
    source: item.source || new URL(publisherUrl).hostname.replace(/^www\./, ""),
    description: item.description,
    content,
  };
}

function logDiscoveryStats(stats: DiscoveryStats): void {
  console.log(
    `[news] Discovery summary: queries=${stats.queryCount}, raw=${stats.rawItems}, ` +
      `deduped=${stats.dedupedItems}, enriched=${stats.enrichedItems}`
  );
  const skipped = Object.entries(stats.skipped)
    .map(([reason, count]) => `${reason}=${count}`)
    .join(", ");
  if (skipped) console.log(`[news] Skipped: ${skipped}`);
  for (const item of stats.selected) {
    console.log(`[news] Selected: ${item.title} (${item.source}) -> ${item.url}`);
  }
}

export async function fetchNewsItems(
  limit: number,
  options: {
    recencyHours?: number;
    minItems?: number;
    config: NewsConfig;
  }
): Promise<NewsItem[]> {
  const recencyHours = options.recencyHours ?? DEFAULT_NEWS_RECENCY_HOURS;
  const minItems = options.minItems ?? 3;
  const news = options.config;
  const isExcludedUrl = makeIsExcludedUrl(news.excludedDomains);
  const isRelevantNewsItem = makeIsRelevantNewsItem(
    buildRelevanceRegex(news.relevanceKeywords),
    buildExcludeRegex(news.excludeKeywords)
  );
  const deps: ResolveDeps = { userAgent: news.userAgent, isExcludedUrl };

  const stats: DiscoveryStats = {
    queryCount: news.queries.length,
    rawItems: 0,
    dedupedItems: 0,
    enrichedItems: 0,
    skipped: {},
    selected: [],
  };

  const rssResults = await Promise.allSettled(
    news.queries.map((q) => fetchGoogleNewsRss(q, news.userAgent))
  );
  const rawItems: RawNewsItem[] = [];
  for (let i = 0; i < rssResults.length; i += 1) {
    const query = news.queries[i];
    const result = rssResults[i];
    if (result.status === "fulfilled") {
      console.log(`[news] Google News RSS "${query}" returned ${result.value.length} raw item(s).`);
      rawItems.push(...result.value);
    } else {
      console.warn(`[news] Google News RSS query failed for "${query}":`, result.reason);
    }
  }

  stats.rawItems = rawItems.length;
  let candidates = dedupeNewsItems(
    rawItems.filter((item) => isRecentEnough(item.publishedAt, recencyHours)),
    isRelevantNewsItem
  );

  if (candidates.length < minItems) {
    console.warn(
      `[news] RSS returned only ${candidates.length} recent deduped item(s); trying free web-search fallback.`
    );
    const fallbackResults = await Promise.allSettled(
      news.queries.map((q) => fetchFallbackNews(q, news.userAgent, isExcludedUrl))
    );
    for (let i = 0; i < fallbackResults.length; i += 1) {
      const query = news.queries[i];
      const result = fallbackResults[i];
      if (result.status === "fulfilled") {
        console.log(`[news] Fallback search "${query}" returned ${result.value.length} raw item(s).`);
        rawItems.push(...result.value);
      } else {
        console.warn(`[news] Fallback search failed for "${query}":`, result.reason);
      }
    }
    stats.rawItems = rawItems.length;
    candidates = dedupeNewsItems(
      rawItems.filter((item) => isRecentEnough(item.publishedAt, recencyHours)),
      isRelevantNewsItem
    );
  }

  candidates.sort((a, b) => {
    const bTime = Date.parse(b.publishedAt) || 0;
    const aTime = Date.parse(a.publishedAt) || 0;
    return bTime - aTime;
  });
  stats.dedupedItems = candidates.length;

  const enriched: NewsItem[] = [];
  const enrichmentCandidates = candidates.slice(0, MAX_ENRICHMENT_ATTEMPTS);
  for (let i = 0; i < enrichmentCandidates.length && enriched.length < limit; i += ENRICHMENT_CONCURRENCY) {
    const batch = enrichmentCandidates.slice(i, i + ENRICHMENT_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((item) => enrichItem(item, stats, recencyHours, deps))
    );
    for (const item of batchResults) {
      if (!item || enriched.length >= limit) continue;
      enriched.push(item);
    }
  }

  stats.enrichedItems = enriched.length;
  stats.selected = enriched.map((item) => ({
    title: item.title,
    url: item.url,
    source: item.source,
    publishedAt: item.publishedAt,
  }));
  logDiscoveryStats(stats);

  return enriched;
}
