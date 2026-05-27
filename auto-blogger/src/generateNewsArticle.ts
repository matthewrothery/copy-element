import { generateObject, generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { applyLinkPlaceholders, candidateId } from "./applyLinkPlaceholders.js";
import type { BrandConfig } from "./projectConfig.js";
import { GeneratedBlogPost, InternalLinkCandidate, NewsItem, ResearchResult, TokenUsage } from "./types.js";

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
const MIN_EXTERNAL_LINKS = 2;
const MIN_INTERNAL_LINKS = 2;

function buildNewsSystemPrompt(brand: BrandConfig): string {
  const unshippedLines = brand.unshippedFeatureClaims
    .map((claim) => `Never claim ${claim} in ${brand.shortName}.`)
    .join("\n");
  return `You are an editorial writer for ${brand.productName}.

Voice: ${brand.voice}. You write for developers who follow the AI tooling and vibe coding space closely.

You produce editorial news commentary: opinion, analysis, and context. Not SEO-driven content. No FAQ. No diagrams. No comparison tables unless genuinely useful.

${unshippedLines}
Avoid hype. Avoid unsupported product claims. Avoid buzzwords.

Do not use em dashes (—) or en dashes (–) anywhere. If you spot them, break the sentence into two shorter, punchier sentences or swap the dashes for commas or parentheses. The goal is clear, structured prose that reads cleanly without dash-driven asides.`;
}

function summarizeNewsItems(items: NewsItem[]): string {
  return items
    .map((item, idx) => {
      const body = item.content?.slice(0, 600) ?? "(no content fetched)";
      return `Source ${idx + 1} (cite as {{SRC:${idx + 1}|anchor text}})\nTitle: ${item.title}\nURL: ${item.publisherUrl ?? item.url}\nPublished: ${item.publishedAt}\nSource: ${item.source}\n\n${body}`;
    })
    .join("\n\n---\n\n");
}

function summarizeInternalLinks(candidates: InternalLinkCandidate[]): string {
  if (candidates.length === 0) {
    return "No existing internal link candidates are available yet.";
  }

  return candidates
    .map((candidate) => {
      const id = candidateId(candidate);
      const context = [candidate.hubTitle, candidate.clusterTitle].filter(Boolean).join(" / ");
      const kws = (candidate.linkKeywords ?? []).slice(0, 4);
      const kwHint = kws.length > 0 ? ` | anchors: ${kws.map((k) => `"${k}"`).join(", ")}` : "";
      return `- id: ${id} | "${candidate.title}" (${candidate.type})${context ? ` | ${context}` : ""}${kwHint}`;
    })
    .join("\n");
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

function countTokens(body: string, prefix: "LINK" | "SRC"): number {
  const re = new RegExp(`\\{\\{${prefix}:`, "g");
  return (body.match(re) ?? []).length;
}

function newsItemsToResearch(items: NewsItem[]): ResearchResult[] {
  return items.map((item) => ({
    title: item.title,
    url: item.publisherUrl ?? item.url,
    snippet: item.description ?? item.source,
    content: item.content,
  }));
}

export async function generateNewsArticle(input: {
  items: NewsItem[];
  date: string;
  textProvider: "anthropic" | "openai";
  model: string;
  brand: BrandConfig;
  internalLinkCandidates: InternalLinkCandidate[];
}): Promise<{ post: GeneratedBlogPost; tokenUsage: TokenUsage; resolutionWarnings: string[] }> {
  const model = createTextModel(input.textProvider, input.model);
  const systemPrompt = buildNewsSystemPrompt(input.brand);
  const newsSummary = summarizeNewsItems(input.items);
  const internalLinksSummary = summarizeInternalLinks(input.internalLinkCandidates);

  const outlinePrompt = `
Today is ${input.date}. Based on the following recent news items, create an editorial commentary outline for a developer audience following the AI tooling and vibe coding space.

News items:
${newsSummary}

Return:
- a specific editorial angle (what's the interesting story or tension here?)
- a clear thesis (what point are you making?)
- 3-7 section headings for the commentary (each heading should be descriptive and keyword-rich)
- a URL slug (kebab-case, 3-6 words, date-free, includes the main topic keyword)
`;

  const outlineResult = await generateObject({
    model,
    schema: OutlineSchema,
    system: systemPrompt,
    prompt: outlinePrompt,
  });

  const outline = outlineResult.object;

  const sourceUrlList = input.items
    .map((item, idx) => `${idx + 1}. ${item.publisherUrl ?? item.url} | ${item.title} (${item.source})`)
    .join("\n");

  const draftPrompt = `
Write an editorial news commentary post for developers following the AI tooling and vibe coding space.

Date: ${input.date}
Angle: ${outline.angle}
Thesis: ${outline.thesis}
Section headings: ${outline.sectionHeadings.join(" | ")}

Requirements:
- 600 to 900 words
- markdown body only (no frontmatter)
- editorial commentary tone: analysis, opinion, context, not a news summary
- open with a clear thesis paragraph (1-3 sentences stating your position). This opening paragraph is your featured snippet candidate.
- title must be 50-60 chars, include the main topic keyword, make the newsworthy angle clear
- excerpt must be 150-160 chars, summarise the editorial angle, include the main topic keyword, encourage clicks
- cite source articles with inline {{SRC:<n>|anchor text}} placeholders. The body MUST contain at least ${MIN_EXTERNAL_LINKS} {{SRC: tokens.
- link to existing Element Armory content with inline {{LINK:<id>|anchor text}} placeholders. The body MUST contain at least ${MIN_INTERNAL_LINKS} {{LINK: tokens when internal candidates are available.
- choose internal link ids only from the candidate list below.
- never include raw https:// URLs or raw /topics/... or /blog/... paths in the body. Always use placeholder syntax.
- no FAQ section
- no diagrams
- no H1 title inside body
- concrete and specific, not vague
- keep claims grounded in what the sources actually say

Also return an image prompt for a clean editorial cover image. Modern, minimal, geometric. No text. No photorealism.

Source URLs (cite with {{SRC:<n>|anchor text}}):
${sourceUrlList}

Internal-link candidates (link with {{LINK:<id>|anchor text}}):
${internalLinksSummary}

News context:
${newsSummary}
`;

  const draftResult = await generateObject({
    model,
    schema: DraftSchema,
    system: systemPrompt,
    prompt: draftPrompt,
    maxTokens: DRAFT_MAX_OUTPUT_TOKENS,
  });

  const draft = draftResult.object;

  const tokenUsage: TokenUsage = {
    inputTokens: (outlineResult.usage?.promptTokens ?? 0) + (draftResult.usage?.promptTokens ?? 0),
    outputTokens: (outlineResult.usage?.completionTokens ?? 0) + (draftResult.usage?.completionTokens ?? 0),
  };

  let workingBody = draft.body.trim();
  const initialExternal = countTokens(workingBody, "SRC");
  const initialInternal = countTokens(workingBody, "LINK");
  const externalShortfall = Math.max(0, MIN_EXTERNAL_LINKS - initialExternal);
  const internalFloor = input.internalLinkCandidates.length > 0 ? MIN_INTERNAL_LINKS : 0;
  const internalShortfall = Math.max(0, internalFloor - initialInternal);

  if (externalShortfall > 0 || internalShortfall > 0) {
    const remediation = await generateText({
      model,
      system: systemPrompt,
      prompt: `The news commentary body below is missing inline link placeholders. Rewrite it to add ${externalShortfall} more {{SRC:<n>|anchor}} source citation${externalShortfall === 1 ? "" : "s"} and ${internalShortfall} more {{LINK:<id>|anchor}} internal link${internalShortfall === 1 ? "" : "s"}.

Rules:
- use only source numbers and internal-link ids from the lists below
- preserve the same editorial argument, headings, and approximate length
- do not add a Sources, References, FAQ, or link list section
- never include raw URLs or raw internal paths
- output ONLY the rewritten markdown body

Sources:
${newsSummary}

Internal-link candidates:
${internalLinksSummary}

Body to rewrite:
---
${workingBody}
---`,
      maxTokens: DRAFT_MAX_OUTPUT_TOKENS,
    });
    const rewritten = remediation.text.trim();
    if (
      countTokens(rewritten, "SRC") >= MIN_EXTERNAL_LINKS &&
      countTokens(rewritten, "LINK") >= internalFloor
    ) {
      workingBody = rewritten;
    }
    tokenUsage.inputTokens += remediation.usage?.promptTokens ?? 0;
    tokenUsage.outputTokens += remediation.usage?.completionTokens ?? 0;
  }

  const research = newsItemsToResearch(input.items);
  const resolution = applyLinkPlaceholders(workingBody, input.internalLinkCandidates, research);
  const slug = sanitizeSlug(outline.slug || draft.title);

  return {
    post: {
      title: draft.title,
      slug,
      date: input.date,
      excerpt: draft.excerpt,
      readTime: draft.readTime,
      body: resolution.body,
      imagePrompt: draft.imagePrompt.trim(),
      sourceItems: input.items,
    },
    tokenUsage,
    resolutionWarnings: resolution.warnings,
  };
}
