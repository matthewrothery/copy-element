import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { GeneratedBlogPost, NewsItem, TokenUsage } from "./types.js";

const OutlineSchema = z.object({
  angle: z.string(),
  thesis: z.string(),
  sectionHeadings: z.array(z.string()).min(3).max(7),
  slug: z.string(),
});

const DraftSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  readTime: z.string(),
  body: z.string(),
  imagePrompt: z.string(),
});

const DRAFT_MAX_OUTPUT_TOKENS = 4096;

const SYSTEM_PROMPT = `You are an editorial writer for Element Armory – Capture UI Elements, a developer tool for capturing and rebuilding UI from any website.

Voice: developer-focused, technical but clear, minimal, confident. You write for developers who follow the AI tooling and vibe coding space closely.

You produce editorial news commentary: opinion, analysis, and context — not SEO-driven content. No FAQ. No diagrams. No comparison tables unless genuinely useful.

Never claim JSX export or Tailwind output is currently available in Element Armory.
Avoid hype. Avoid unsupported product claims. Avoid buzzwords.`;

function summarizeNewsItems(items: NewsItem[]): string {
  return items
    .map((item, idx) => {
      const body = item.content?.slice(0, 600) ?? "(no content fetched)";
      return `Source ${idx + 1}\nTitle: ${item.title}\nURL: ${item.url}\nPublished: ${item.publishedAt}\nSource: ${item.source}\n\n${body}`;
    })
    .join("\n\n---\n\n");
}

function createTextModel(provider: "anthropic" | "openai", model: string) {
  return provider === "anthropic" ? anthropic(model) : openai(model);
}

function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function generateNewsArticle(input: {
  items: NewsItem[];
  date: string;
  textProvider: "anthropic" | "openai";
  model: string;
}): Promise<{ post: GeneratedBlogPost; tokenUsage: TokenUsage }> {
  const model = createTextModel(input.textProvider, input.model);
  const newsSummary = summarizeNewsItems(input.items);

  const outlinePrompt = `
Today is ${input.date}. Based on the following recent news items, create an editorial commentary outline for a developer audience following the AI tooling and vibe coding space.

News items:
${newsSummary}

Return:
- a specific editorial angle (what's the interesting story or tension here?)
- a clear thesis (what point are you making?)
- 3-7 section headings for the commentary
- a URL slug (kebab-case, 3-6 words, date-free)
`;

  const outlineResult = await generateObject({
    model,
    schema: OutlineSchema,
    system: SYSTEM_PROMPT,
    prompt: outlinePrompt,
  });

  const outline = outlineResult.object;

  const sourceUrlList = input.items
    .map((item, idx) => `${idx + 1}. ${item.url} — ${item.title} (${item.source})`)
    .join("\n");

  const draftPrompt = `
Write an editorial news commentary post for developers following the AI tooling and vibe coding space.

Date: ${input.date}
Angle: ${outline.angle}
Thesis: ${outline.thesis}
Section headings: ${outline.sectionHeadings.join(" | ")}

Requirements:
- 600–900 words
- markdown body only (no frontmatter)
- editorial commentary tone — analysis, opinion, context, not a news summary
- inline links to at least 3 of the source URLs below. Link at the point you reference their content.
- no FAQ section
- no diagrams
- no H1 title inside body
- concrete and specific, not vague
- keep claims grounded in what the sources actually say

Also return an image prompt for a clean editorial cover image. Modern, minimal, geometric. No text. No photorealism.

Source URLs (link to at least 3 inline):
${sourceUrlList}

News context:
${newsSummary}
`;

  const draftResult = await generateObject({
    model,
    schema: DraftSchema,
    system: SYSTEM_PROMPT,
    prompt: draftPrompt,
    maxTokens: DRAFT_MAX_OUTPUT_TOKENS,
  });

  const draft = draftResult.object;

  const tokenUsage: TokenUsage = {
    inputTokens: (outlineResult.usage?.promptTokens ?? 0) + (draftResult.usage?.promptTokens ?? 0),
    outputTokens: (outlineResult.usage?.completionTokens ?? 0) + (draftResult.usage?.completionTokens ?? 0),
  };

  const slug = sanitizeSlug(outline.slug || draft.title);

  return {
    post: {
      title: draft.title,
      slug,
      date: input.date,
      excerpt: draft.excerpt,
      readTime: draft.readTime,
      body: draft.body.trim(),
      imagePrompt: draft.imagePrompt.trim(),
      sourceItems: input.items,
    },
    tokenUsage,
  };
}
