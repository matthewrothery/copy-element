import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import httpcloak from "httpcloak";

const CHROME_PRESETS = ["chrome-146", "chrome-145", "chrome-144", "chrome-143"] as const;

function randomPreset(): string {
  return CHROME_PRESETS[Math.floor(Math.random() * CHROME_PRESETS.length)];
}

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchHtml(url: string): Promise<string | undefined> {
  try {
    const session = new httpcloak.Session({ preset: randomPreset() });
    const response = await session.get(url);
    if (response.statusCode < 200 || response.statusCode >= 300) return undefined;
    return response.text ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Fetch a URL and return its readable article text. Falls back to a naive
 * tag-strip if Readability can't parse the document (paywalls, SPAs, etc.).
 * Returns undefined only if the fetch itself fails.
 */
export async function extractReadableContent(
  url: string,
  maxChars = 7000
): Promise<string | undefined> {
  const html = await fetchHtml(url);
  if (!html) return undefined;

  try {
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    const text = article?.textContent?.trim();
    if (text && text.length >= 200) {
      return text.slice(0, maxChars);
    }
  } catch {
    // fall through to naive strip
  }

  return stripTags(html).slice(0, maxChars);
}
