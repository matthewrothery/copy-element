import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { GeneratedBlogPost } from "./types.js";
import type { SeoScore } from "./types.js";

const NewsSeoScoreSchema = z.object({
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

function buildNewsScoringPrompt(post: GeneratedBlogPost): string {
  const bodyPreview = post.body.slice(0, 1500);
  return `Score this editorial news post's SEO quality.

Title: ${post.title}
Excerpt: ${post.excerpt}
Body preview (first 1500 chars):
---
${bodyPreview}
---

Score each category 0-100 and provide a 1-sentence actionable suggestion.

Categories:
- title: Is the main topic keyword present? 50-60 chars? Newsworthy angle clear?
- excerpt: 150-160 chars? Summarises the editorial angle? Encourages clicks?
- upfrontAnswer: Does the post open with a clear thesis/position in the first paragraph?
- headingOptimization: Are section headings descriptive and keyword-relevant?
- contentDepth: Are sources cited with meaningful analysis, not just summary?
- featuredSnippetReady: Could the opening be pulled as a featured snippet definition or summary?
- readability: Clear editorial voice, short paragraphs, appropriate for a developer audience?

overall: Weighted average (title 20%, excerpt 15%, upfrontAnswer 20%, headingOptimization 10%, contentDepth 20%, featuredSnippetReady 10%, readability 5%)`;
}

export async function scoreNewsSeoQuality(
  post: GeneratedBlogPost,
  provider: "anthropic" | "openai",
  model: string
): Promise<SeoScore> {
  const llmModel = createModel(provider, model);
  const result = await generateObject({
    model: llmModel,
    schema: NewsSeoScoreSchema,
    prompt: buildNewsScoringPrompt(post),
    maxTokens: 1024,
  });
  return result.object;
}
