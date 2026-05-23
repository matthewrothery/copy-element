import "dotenv/config";
import { readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import path from "path";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { loadConfig, loadProjectConfig } from "./config.js";
import { collectExistingKeywords, loadInternalLinkCandidates } from "./internalLinks.js";

const KeywordsSchema = z.object({
  linkKeywords: z.array(z.string()).min(6).max(12),
});

type ArticleFile = {
  filePath: string;
  date: string;
  title: string;
  raw: string;
};

function listTopicArticles(websiteRoot: string): ArticleFile[] {
  const topicsRoot = path.resolve(websiteRoot, "content", "topics");
  const out: ArticleFile[] = [];

  const hubs = readdirSync(topicsRoot, { withFileTypes: true }).filter((e) => e.isDirectory());
  for (const hub of hubs) {
    const hubDir = path.join(topicsRoot, hub.name);
    const clusters = readdirSync(hubDir, { withFileTypes: true }).filter((e) => e.isDirectory());
    for (const cluster of clusters) {
      const clusterDir = path.join(hubDir, cluster.name);
      const entries = readdirSync(clusterDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "_index.md") continue;
        const filePath = path.join(clusterDir, entry.name);
        const raw = readFileSync(filePath, "utf-8");
        const dateMatch = raw.match(/^date:\s*"?([0-9]{4}-[0-9]{2}-[0-9]{2})/m);
        const titleMatch = raw.match(/^title:\s*"([^"]+)"/m);
        out.push({
          filePath,
          date: dateMatch?.[1] ?? "1970-01-01",
          title: titleMatch?.[1] ?? path.parse(filePath).name,
          raw,
        });
      }
    }
  }

  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

function hasLinkKeywords(raw: string): boolean {
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return false;
  const lines = fmMatch[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    if (/^linkKeywords:\s*$/.test(lines[i])) {
      const next = lines[i + 1] ?? "";
      return /^\s+-\s+/.test(next);
    }
  }
  return false;
}

function stripFrontmatter(raw: string): { frontmatter: string; body: string } {
  const m = raw.match(/^(---\r?\n[\s\S]*?\r?\n---)\r?\n?([\s\S]*)$/);
  if (!m) return { frontmatter: "", body: raw };
  return { frontmatter: m[1], body: m[2] };
}

function insertKeywordsIntoFrontmatter(raw: string, keywords: string[]): string {
  const { frontmatter, body } = stripFrontmatter(raw);
  if (!frontmatter) return raw;

  const lines = frontmatter.split(/\r?\n/);
  const closingIdx = lines.length - 1; // last "---"
  const block = ["linkKeywords:", ...keywords.map((kw) => `  - "${kw.replace(/"/g, '\\"')}"`)];

  // Remove any existing empty `linkKeywords:` line (we just confirmed it has no list).
  const filtered = lines.filter((line, idx) => !(idx !== closingIdx && /^linkKeywords:\s*$/.test(line)));
  const closingIdx2 = filtered.length - 1;
  const out = [...filtered.slice(0, closingIdx2), ...block, filtered[closingIdx2]].join("\n");
  return `${out}\n${body}`;
}

function createTextModel(provider: "anthropic" | "openai", model: string) {
  return provider === "anthropic" ? anthropic(model) : openai(model);
}

async function generateKeywordsFor(
  article: ArticleFile,
  taken: Set<string>,
  provider: "anthropic" | "openai",
  modelId: string
): Promise<string[]> {
  const model = createTextModel(provider, modelId);
  const { body } = stripFrontmatter(article.raw);
  const bodySnippet = body.slice(0, 4000);

  const takenSample = Array.from(taken).slice(0, 200).map((t) => `- ${t}`).join("\n") || "(none)";

  const prompt = `Generate 6-12 short anchor-quality phrases (each 2-6 words) that would read naturally as a mid-sentence link anchor pointing TO this article from another post.

Rules:
- Include the article's primary topic and 1-2 close paraphrases.
- Avoid single generic words ("HTML", "AI", "tools").
- All phrases must be distinct from the "already taken" list below.
- Lowercase, no trailing punctuation.

Article title: ${article.title}

Article excerpt:
${bodySnippet}

Already taken phrases:
${takenSample}`;

  const result = await generateObject({ model, schema: KeywordsSchema, prompt });
  return result.object.linkKeywords.map((k) => k.trim()).filter(Boolean);
}

async function main(): Promise<void> {
  const config = loadConfig();
  const projectConfig = loadProjectConfig();
  const workspaceRoot = path.resolve(config.packageRoot, "..");
  const websiteRoot =
    projectConfig.contentRepository.type === "filesystem"
      ? path.resolve(workspaceRoot, projectConfig.contentRepository.websiteRoot)
      : path.resolve(workspaceRoot, "website");
  const articles = listTopicArticles(websiteRoot);
  console.log(`Found ${articles.length} topic articles. Bootstrapping linkKeywords oldest-first.`);

  // Seed taken set from existing candidates.
  const candidates = loadInternalLinkCandidates(websiteRoot);
  const taken = collectExistingKeywords(candidates);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const article of articles) {
    if (hasLinkKeywords(article.raw)) {
      skipped += 1;
      continue;
    }

    try {
      let keywords = await generateKeywordsFor(article, taken, config.textProvider, config.textModel);
      keywords = keywords.filter((kw) => {
        const v = kw.toLowerCase();
        if (taken.has(v)) return false;
        return true;
      });

      if (keywords.length < 6) {
        // One reprompt with even stricter "avoid" list.
        const second = await generateKeywordsFor(article, taken, config.textProvider, config.textModel);
        const merged = new Set(keywords.map((k) => k.toLowerCase()));
        for (const kw of second) {
          const v = kw.toLowerCase();
          if (!taken.has(v) && !merged.has(v)) {
            keywords.push(kw);
            merged.add(v);
          }
        }
      }

      keywords = keywords.slice(0, 12);
      if (keywords.length < 6) {
        console.warn(`[bootstrap] ${article.filePath}: only ${keywords.length} non-colliding keywords; writing anyway.`);
      }

      const updatedRaw = insertKeywordsIntoFrontmatter(article.raw, keywords);
      writeFileSync(article.filePath, updatedRaw, "utf-8");
      for (const kw of keywords) taken.add(kw.toLowerCase());
      updated += 1;
      console.log(`[bootstrap] updated ${path.relative(websiteRoot, article.filePath)} (${keywords.length} kw)`);
    } catch (err) {
      failed += 1;
      console.error(`[bootstrap] failed ${article.filePath}:`, err);
    }
  }

  console.log(`Done. updated=${updated} skipped=${skipped} failed=${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
