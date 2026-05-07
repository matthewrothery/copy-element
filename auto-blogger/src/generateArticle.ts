import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { DiagramSpecSchema } from "./diagrams/schema.js";
import {
  GeneratedArticle,
  InternalLinkCandidate,
  ResearchResult,
  TokenUsage,
  TopicKeyword,
} from "./types.js";

const OutlineSchema = z.object({
  angle: z.string(),
  targetReader: z.string(),
  sectionHeadings: z.array(z.string()).min(5).max(12),
  relatedSlugs: z.array(z.string()).max(6),
  faq: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ).max(5),
});

const DraftSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  readTime: z.string(),
  body: z.string(),
  imagePrompt: z.string(),
  diagrams: z.array(DiagramSpecSchema).max(5).optional().default([]),
});

/** Draft JSON includes a long markdown body; SDK default ~4096 completion tokens truncates before `body` is emitted (finishReason: length). */
const DRAFT_MAX_OUTPUT_TOKENS = 8192;

function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function createTextModel(provider: "anthropic" | "openai", model: string) {
  return provider === "anthropic" ? anthropic(model) : openai(model);
}

function buildSystemPrompt(copywriterPrompt: string, guide: string, rules: string): string {
  return `${copywriterPrompt}

You are generating topic authority pages for Element Armory – Capture UI Elements.
Voice: developer-focused, technical but clear, minimal, confident.
Never claim JSX export or Tailwind output is currently available.
Avoid hype and avoid unsupported product claims.

Topical strategy guide:
${guide}

Additional generation rules:
${rules}`;
}

function summarizeResearch(research: ResearchResult[]): string {
  return research
    .map((item, idx) => {
      const snippet = item.content?.slice(0, 500) ?? item.snippet;
      const focus = item.focus === "statistics" ? "statistics/data" : "general";
      return `Source ${idx + 1} (${focus})\nQuery: ${item.query ?? "n/a"}\nTitle: ${item.title}\nURL: ${item.url}\nSummary: ${snippet}`;
    })
    .join("\n\n");
}

function summarizeInternalLinks(candidates: InternalLinkCandidate[]): string {
  if (candidates.length === 0) {
    return "No existing internal link candidates are available yet.";
  }

  return candidates
    .map((candidate, idx) => {
      const context = [candidate.topic, candidate.hubTitle, candidate.clusterTitle]
        .filter(Boolean)
        .join(" | ");
      return `${idx + 1}. ${candidate.title} (${candidate.type})\nURL: ${candidate.url}\nTopic: ${context}`;
    })
    .join("\n");
}

export async function generateTopicArticle(input: {
  keyword: TopicKeyword;
  date: string;
  textProvider: "anthropic" | "openai";
  model: string;
  copywriterPrompt: string;
  guide: string;
  rules: string;
  research: ResearchResult[];
  internalLinkCandidates: InternalLinkCandidate[];
}): Promise<{ article: GeneratedArticle; tokenUsage: TokenUsage }> {
  const model = createTextModel(input.textProvider, input.model);
  const system = buildSystemPrompt(input.copywriterPrompt, input.guide, input.rules);
  const researchSummary = summarizeResearch(input.research);
  const internalLinksSummary = summarizeInternalLinks(input.internalLinkCandidates);

  const outlinePrompt = `
Create an authoritative article outline for this target:
- Hub: ${input.keyword.hubTitle}
- Cluster: ${input.keyword.clusterTitle}
- Keyword: ${input.keyword.keyword}

Use research context:
${researchSummary}

Existing internal link options:
${internalLinksSummary}

Return:
- a specific angle
- the target reader
- 5-12 section headings
- 2-5 FAQ items
- related slugs for same-cluster linking. Prefer slugs from existing article links when available.
`;

  const outlineResult = await generateObject({
    model,
    schema: OutlineSchema,
    system,
    prompt: outlinePrompt,
  });
  const outline = outlineResult;

  const sourceUrlList = input.research
    .map((item, idx) => `${idx + 1}. ${item.url} — ${item.title}`)
    .join("\n");

  const draftPrompt = `
Write a comprehensive topic article.

Context:
- Hub: ${input.keyword.hubTitle} (${input.keyword.hubSlug})
- Cluster: ${input.keyword.clusterTitle} (${input.keyword.clusterSlug})
- Keyword: ${input.keyword.keyword}
- Date: ${input.date}
- Angle: ${outline.object.angle}
- Reader: ${outline.object.targetReader}
- Section headings: ${outline.object.sectionHeadings.join(" | ")}

Requirements:
- 1200-2000 words
- markdown body only (no frontmatter)
- start with a short upfront answer section before the first heading. Answer the keyword directly in a conversational way, like a helpful expert replying to a specific question. Keep it concise, concrete, and useful for AI summaries.
- practical examples and steps
- avoid generic filler
- include links as plain markdown links where relevant
- use 3-10 inline internal links from the provided existing internal link options. Never use more than 10 internal links. Choose only links that fit naturally in the paragraph.
- you MUST include inline markdown links to 4-8 of the research source URLs listed below. Link to them naturally at the point where you reference their content — statistics, findings, or claims drawn from that source. Never list them as a block; embed them inline in the prose.
- when using concrete statistics, benchmarks, survey findings, market numbers, dates, or data points, cite the source with a plain markdown link to the original source URL.
- include concrete statistics or data where the research supports it. Keep data references native, organic, and human-readable, not a list of forced numbers.
- do not include H1 title inside body
- do not put FAQ content in the markdown body. Never use headings like ## FAQ, ### FAQ, or "Frequently asked questions", and do not duplicate Q&A lists in prose. FAQ items are supplied separately from the outline and become YAML frontmatter only; the published page renders them once below the article.
- keep claims realistic
- include at least one markdown comparison table when the topic compares approaches, tools, or workflows (for example manual DevTools vs extension-assisted capture).
- add 1-3 programmatic diagrams when they clarify a workflow, comparison, or numbered process. Each diagram is data you output in the diagrams array (kind: flow | columns | steps), not SVG.
- for each diagram you output, place its placeholder on its own line in the body: {{DIAGRAM:<id>}} where <id> matches that diagram's id field exactly (lowercase slug style, e.g. workflow, capture-flow).
- optional short italic caption line immediately after a diagram placeholder is allowed.

Also return an image prompt for a stencil street-art style cover image with bold minimal overlapping colors. No text in image.

Diagram kinds:
- flow: ordered nodes with short labels (sequence left-to-right).
- columns: 2-3 columns with a title and bullet-like rows per column (for contrasting methods).
- steps: 3-7 numbered steps with short labels (horizontal layout).

Every diagram must use a unique id and appear exactly once as {{DIAGRAM:id}} in the body.

Research source URLs (link to 4-8 of these inline in the article body):
${sourceUrlList}

Research context:
${researchSummary}

Existing internal link options:
${internalLinksSummary}
`;

  const draft = await generateObject({
    model,
    schema: DraftSchema,
    system,
    prompt: draftPrompt,
    maxTokens: DRAFT_MAX_OUTPUT_TOKENS,
  });

  const tokenUsage: TokenUsage = {
    inputTokens: (outlineResult.usage?.promptTokens ?? 0) + (draft.usage?.promptTokens ?? 0),
    outputTokens: (outlineResult.usage?.completionTokens ?? 0) + (draft.usage?.completionTokens ?? 0),
  };

  // Lock URL slug to list.md so paths align with keyword.id and we do not collide with sibling filenames.
  const slugSegment = input.keyword.id.split("/").pop() ?? "";
  const slug = sanitizeSlug(slugSegment || input.keyword.keyword);

  return {
    article: {
      hubSlug: input.keyword.hubSlug,
      hubTitle: input.keyword.hubTitle,
      clusterSlug: input.keyword.clusterSlug,
      clusterTitle: input.keyword.clusterTitle,
      title: draft.object.title,
      slug,
      date: input.date,
      excerpt: draft.object.excerpt,
      readTime: draft.object.readTime,
      faq: outline.object.faq
        .filter((item) => Boolean(item.question && item.answer))
        .map((item) => ({
          question: item.question,
          answer: item.answer,
        })),
      relatedSlugs: outline.object.relatedSlugs,
      body: draft.object.body.trim(),
      imagePrompt: draft.object.imagePrompt.trim(),
      diagrams: draft.object.diagrams ?? [],
    },
    tokenUsage,
  };
}
