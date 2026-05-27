import { generateText, generateObject } from "ai";
import type { LanguageModel } from "ai";
import { z } from "zod";
import { DiagramSpecSchema } from "./diagrams/schema.js";
import { sleep } from "./utils.js";
import { candidateId } from "./applyLinkPlaceholders.js";
import type { AutoBloggerConfig } from "./config.js";
import type { ResearchResult, InternalLinkCandidate, TopicKeyword } from "./types.js";
import type { BrandConfig } from "./projectConfig.js";

const SECTION_RESEARCH_N = 4;
const ESTIMATED_ARTICLE_WORDS = 1500;
const WORDS_PER_LINK = 120;
const CEILING_HEADROOM = 2;

export type SelectedResearch = {
  item: ResearchResult;
  sourceNum: number;
};

export function selectRelevantResearch(
  research: ResearchResult[],
  heading: string,
  n: number = SECTION_RESEARCH_N
): SelectedResearch[] {
  const headingWords = new Set(
    heading.toLowerCase().split(/\W+/).filter((w) => w.length > 2)
  );
  const scored = research.map((item, idx) => {
    const text = `${item.title} ${(item.content ?? item.snippet).slice(0, 200)}`.toLowerCase();
    const overlap = text.split(/\W+/).filter((w) => headingWords.has(w)).length;
    return { item, sourceNum: idx + 1, score: overlap };
  });
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map(({ item, sourceNum }) => ({ item, sourceNum }));
}

export type SectionPromptParams = {
  heading: string;
  angle: string;
  targetReader: string;
  allHeadings: string[];
  sectionIndex: number;
  totalSections: number;
  previousSectionTail: string;
  relevantResearch: SelectedResearch[];
  internalLinkCandidates: InternalLinkCandidate[];
  linksUsedSoFar: number;
  placedLinkIds: Set<string>;
  placedSrcNums: Set<number>;
  isFirstSection: boolean;
  primaryKeyword: string;
};

function estimatedLinkCeiling(): number {
  const target = Math.max(5, Math.round(ESTIMATED_ARTICLE_WORDS / WORDS_PER_LINK));
  return target + CEILING_HEADROOM;
}

export function buildSectionPrompt(params: SectionPromptParams): string {
  const {
    heading,
    angle,
    targetReader,
    allHeadings,
    sectionIndex,
    totalSections,
    previousSectionTail,
    relevantResearch,
    internalLinkCandidates,
    linksUsedSoFar,
    placedLinkIds,
    placedSrcNums,
    isFirstSection,
    primaryKeyword,
  } = params;

  const ceiling = estimatedLinkCeiling();
  const remaining = Math.max(0, ceiling - linksUsedSoFar);
  const sectionsRemaining = Math.max(1, totalSections - sectionIndex);
  const sectionBudget = Math.ceil(remaining / sectionsRemaining);

  const researchLines = relevantResearch
    .map(({ item, sourceNum }) => {
      const snippet = (item.content ?? item.snippet).slice(0, 300);
      return `Source ${sourceNum}: ${item.title}\n${snippet}`;
    })
    .join("\n\n");

  const candidateLines = internalLinkCandidates
    .slice(0, 12)
    .map((c) => {
      const id = candidateId(c);
      const kws = (c.linkKeywords ?? []).slice(0, 3);
      const kwHint =
        kws.length > 0 ? ` | anchors: ${kws.map((k) => `"${k}"`).join(", ")}` : "";
      return `- id: ${id} | "${c.title}" (${c.type})${kwHint}`;
    })
    .join("\n");

  const placedIdsStr =
    placedLinkIds.size > 0 ? Array.from(placedLinkIds).join(", ") : "(none)";
  const placedSrcsStr =
    placedSrcNums.size > 0 ? Array.from(placedSrcNums).join(", ") : "(none)";

  const continuityLine =
    previousSectionTail
      ? `Previous section ended with:\n"...${previousSectionTail}"\nContinue naturally.\n\n`
      : "";

  const upfrontInstruction = isFirstSection
    ? `Before the "## ${heading}" heading, write a short upfront answer (1-2 paragraphs, ≤120 words) that directly and concisely answers: "${primaryKeyword}". Include the primary keyword in the first 100 words. If the query is a "what is" question, use a clear definition format. If it's a "how to" question, use a concise numbered list. Speak like a helpful expert replying to a specific question. Then write the section content starting with the heading.\n\n`
    : "";

  return `Write the content for this article section.

Section heading: ## ${heading}

Article structure (all headings in order):
${allHeadings.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Angle: ${angle}
Target reader: ${targetReader}

${upfrontInstruction}${continuityLine}Relevant research (cite via {{SRC:<n>|anchor}}):
${researchLines || "(no relevant research)"}

Internal link candidates (use {{LINK:<id>|anchor}}):
${candidateLines || "(none available)"}

Link budget for this section: Use at most ${sectionBudget} new link${sectionBudget === 1 ? "" : "s"} (internal + external combined). Full article ceiling: ~${ceiling}; ${linksUsedSoFar} placed so far.

Links already placed (do NOT repeat these):
- Internal link ids: ${placedIdsStr}
- Source numbers: ${placedSrcsStr}

Rules:
- ${isFirstSection ? "Write the upfront answer paragraph(s) first, then begin the section with" : "Begin with"} "## ${heading}" exactly.
- Write 150-350 words of markdown for this section only.
- At least one H2 or H3 must contain the primary keyword or a close paraphrase.
- Cite research inline via {{SRC:<n>|anchor text}}.
- Link internal content via {{LINK:<id>|anchor text}}.
- Never include raw URLs or /topics/... paths.
- No H1 title, no frontmatter, no FAQ headings.
- Output ONLY the section markdown. No preamble or commentary.`;
}

export type SectionResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
};

export async function generateSection(
  params: SectionPromptParams,
  model: LanguageModel,
  system: string,
  config: Pick<AutoBloggerConfig, "aiCallDelayMs">
): Promise<SectionResult> {
  const prompt = buildSectionPrompt(params);
  const result = await generateText({ model, system, prompt, maxTokens: 1024 });
  await sleep(config.aiCallDelayMs);
  return {
    text: result.text.trim(),
    inputTokens: result.usage?.promptTokens ?? 0,
    outputTokens: result.usage?.completionTokens ?? 0,
  };
}

export const MetadataSchema = z.object({
  title: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  readTime: z.string(),
  imagePrompt: z.string(),
  linkKeywords: z.array(z.string()).min(8).max(16),
  diagrams: z.array(DiagramSpecSchema).max(5).optional().default([]),
});

export type MetadataObject = z.infer<typeof MetadataSchema>;

type OutlineSnippet = {
  angle: string;
  targetReader: string;
  sectionHeadings: string[];
};

type MetadataInput = {
  keyword: Pick<TopicKeyword, "hubTitle" | "hubSlug" | "clusterTitle" | "clusterSlug" | "keyword">;
  date: string;
  brand: Pick<BrandConfig, "productName">;
  existingKeywordsList: string;
};

export function buildMetadataPrompt(
  body: string,
  outline: OutlineSnippet,
  input: MetadataInput
): string {
  return `You have written the full article body below. Now generate the metadata fields for it.

Context:
- Hub: ${input.keyword.hubTitle} (${input.keyword.hubSlug})
- Cluster: ${input.keyword.clusterTitle} (${input.keyword.clusterSlug})
- Keyword: ${input.keyword.keyword}
- Date: ${input.date}
- Angle: ${outline.angle}
- Target reader: ${outline.targetReader}
- Section headings: ${outline.sectionHeadings.join(" | ")}

Full article body:
---
${body}
---

Generate:
- title: compelling SEO title (50-60 chars, primary keyword near the start, include a power word or a number where natural)
- slug: URL-safe slug (lowercase, hyphens only)
- excerpt: 1-2 sentence summary for SEO (150-160 chars, includes the primary keyword, action-oriented language that encourages clicks)
- readTime: estimated read time (e.g. "8 min read")
- imagePrompt: prompt for a stencil street-art cover image with bold minimal overlapping colors. No text in image.
- linkKeywords: 8-16 short anchor-quality phrases (2-6 words each) that read naturally as mid-sentence anchors pointing TO this article. Include the primary keyword and close paraphrases. Your linkKeywords MUST NOT include any phrase from this list:
${input.existingKeywordsList}
- diagrams: up to 5 programmatic diagram specs (kind: flow | columns | steps). Only include specs whose id already appears as {{DIAGRAM:<id>}} in the body. If none, return an empty array.

Return only the JSON fields. No commentary.`;
}

export type EditorialResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
};

export function buildEditorialPrompt(body: string): string {
  return `Review and refine this assembled article body before publication. It was written section-by-section and may have repetitive phrasing, awkward transitions, or inconsistent tone where sections join.

Your task is prose cleanup only:
- Improve flow and transitions at section boundaries
- Remove repeated phrases or redundant sentences across sections
- Ensure voice and tone are consistent throughout (per your system instructions)
- Strengthen the opening upfront-answer paragraph if it feels generic

Hard constraints:
- Preserve ALL placeholder tokens exactly as-is: {{LINK:...}}, {{SRC:...}}, {{DIAGRAM:...}}
- Do NOT add or remove ## headings
- Do NOT add or remove link or citation placeholders
- Do NOT change the overall structure or section order
- Keep word count within ±10% of the original
- Output ONLY the revised markdown body. No preamble, no commentary, no fenced code block.

Article body:
---
${body}
---`;
}

export async function generateEditorialPass(
  body: string,
  model: LanguageModel,
  system: string,
  config: Pick<AutoBloggerConfig, "aiCallDelayMs">
): Promise<EditorialResult> {
  const prompt = buildEditorialPrompt(body);
  const result = await generateText({ model, system, prompt, maxTokens: 4096 });
  await sleep(config.aiCallDelayMs);
  return {
    text: result.text.trim(),
    inputTokens: result.usage?.promptTokens ?? 0,
    outputTokens: result.usage?.completionTokens ?? 0,
  };
}

export type MetadataResult = {
  object: MetadataObject;
  inputTokens: number;
  outputTokens: number;
};

export async function generateMetadata(
  body: string,
  outline: OutlineSnippet,
  input: MetadataInput,
  model: LanguageModel,
  system: string,
  config: Pick<AutoBloggerConfig, "aiCallDelayMs">
): Promise<MetadataResult> {
  const prompt = buildMetadataPrompt(body, outline, input);
  const result = await generateObject({
    model,
    schema: MetadataSchema,
    system,
    prompt,
    maxTokens: 2048,
  });
  await sleep(config.aiCallDelayMs);
  return {
    object: result.object,
    inputTokens: result.usage?.promptTokens ?? 0,
    outputTokens: result.usage?.completionTokens ?? 0,
  };
}
