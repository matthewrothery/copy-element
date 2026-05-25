import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { GeneratedArticle } from "./types.js";
import type { SeoScore } from "./types.js";

const SeoScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  title: z.object({ score: z.number().min(0).max(100), suggestion: z.string() }),
  excerpt: z.object({ score: z.number().min(0).max(100), suggestion: z.string() }),
  upfrontAnswer: z.object({ score: z.number().min(0).max(100), suggestion: z.string() }),
  headingOptimization: z.object({ score: z.number().min(0).max(100), suggestion: z.string() }),
  contentDepth: z.object({ score: z.number().min(0).max(100), suggestion: z.string() }),
  featuredSnippetReady: z.object({ score: z.number().min(0).max(100), suggestion: z.string() }),
  readability: z.object({ score: z.number().min(0).max(100), suggestion: z.string() }),
});

function createModel(provider: "anthropic" | "openai", model: string) {
  return provider === "anthropic" ? anthropic(model) : openai(model);
}

function buildScoringPrompt(article: GeneratedArticle, keyword: string): string {
  const bodyPreview = article.body.slice(0, 2000);
  return `Score this article's SEO quality for the target keyword: "${keyword}"

Title: ${article.title}
Excerpt: ${article.excerpt}
Body preview (first 2000 chars):
---
${bodyPreview}
---

Score each category 0-100 and provide a 1-sentence actionable suggestion for improvement.

Categories:
- title: Is the primary keyword near the start? 50-60 chars? Contains a power word or number?
- excerpt: 150-160 chars? Contains primary keyword? Action-oriented?
- upfrontAnswer: Does the article open with a direct, concise answer before the first H2?
- headingOptimization: Are H2/H3 headings keyword-rich and varied?
- contentDepth: Does the article cover the topic authoritatively with specific details?
- featuredSnippetReady: Does it use definition format for what-is queries, numbered lists for how-to?
- readability: Short paragraphs, varied sentence length, developer-appropriate vocabulary?

overall: Weighted average (title 20%, excerpt 15%, upfrontAnswer 20%, headingOptimization 15%, contentDepth 15%, featuredSnippetReady 10%, readability 5%)`;
}

export async function scoreSeoQuality(
  article: GeneratedArticle,
  keyword: string,
  provider: "anthropic" | "openai",
  model: string
): Promise<SeoScore> {
  const llmModel = createModel(provider, model);
  const result = await generateObject({
    model: llmModel,
    schema: SeoScoreSchema,
    prompt: buildScoringPrompt(article, keyword),
    maxTokens: 1024,
  });
  return result.object;
}
