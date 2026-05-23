import { ResearchResult } from "./types.js";
import { extractReadableContent } from "./extractContent.js";

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

function normalizeDuckDuckGoUrl(rawUrl: string): string {
  try {
    const url = rawUrl.startsWith("http") ? new URL(rawUrl) : new URL(rawUrl, "https://duckduckgo.com");
    const encodedDestination = url.searchParams.get("uddg");
    return encodedDestination ? decodeURIComponent(encodedDestination) : url.toString();
  } catch {
    return rawUrl;
  }
}

function parseDuckDuckGoHtml(
  html: string,
  query: string,
  focus: ResearchResult["focus"]
): ResearchResult[] {
  const matches = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  const snippets = [...html.matchAll(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g)];

  return matches.map((match, idx) => {
    const url = normalizeDuckDuckGoUrl(decodeHtmlEntities(match[1] ?? ""));
    const title = stripTags(decodeHtmlEntities(match[2] ?? ""));
    const snippet = stripTags(decodeHtmlEntities(snippets[idx]?.[1] ?? ""));
    return { title, url, snippet, query, focus };
  });
}

async function fetchHtml(url: string, userAgent: string): Promise<string> {
  const response = await fetch(url, { headers: { "user-agent": userAgent } });
  if (!response.ok) {
    throw new Error(`Failed request ${url} (${response.status})`);
  }
  return response.text();
}

async function fetchContent(url: string): Promise<string | undefined> {
  return extractReadableContent(url);
}

async function searchDuckDuckGo(
  query: string,
  focus: ResearchResult["focus"],
  limit: number,
  userAgent: string
): Promise<ResearchResult[]> {
  const searchUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const html = await fetchHtml(searchUrl, userAgent);
  return parseDuckDuckGoHtml(html, query, focus).slice(0, limit);
}

function buildResearchQueries(query: string): { query: string; focus: ResearchResult["focus"] }[] {
  return [
    { query, focus: "general" },
    { query: `${query} statistics data report`, focus: "statistics" },
    { query: `${query} survey benchmark trends`, focus: "statistics" },
  ];
}

export async function researchTopic(
  query: string,
  limit: number,
  userAgent: string
): Promise<ResearchResult[]> {
  const seenUrls = new Set<string>();
  const results: ResearchResult[] = [];

  for (const search of buildResearchQueries(query)) {
    try {
      const searchResults = await searchDuckDuckGo(search.query, search.focus, 6, userAgent);
      for (const item of searchResults) {
        if (!item.url || seenUrls.has(item.url)) continue;
        seenUrls.add(item.url);
        results.push(item);
      }
    } catch (error) {
      console.warn(`Research search failed for "${search.query}":`, error);
    }
  }

  const enriched: ResearchResult[] = [];
  for (const item of results.slice(0, limit)) {
    const content = await fetchContent(item.url);
    enriched.push({ ...item, content });
  }
  return enriched;
}
