import { generateObject, generateText } from "ai";
import type { LanguageModel } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import {
  selectRelevantResearch,
  generateSection,
  generateEditorialPass,
  generateMetadata,
} from "./generateSection.js";
import { sleep } from "./utils.js";
import { applyLinkPlaceholders, candidateId } from "./applyLinkPlaceholders.js";
import { collectExistingKeywords } from "./internalLinks.js";
import { linkBudget } from "./quality.js";
import type { AutoBloggerConfig } from "./config.js";
import type { BrandConfig } from "./projectConfig.js";
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

const MIN_INTERNAL_LINKS = 3;
const MIN_EXTERNAL_LINKS = 2;
const DRAFT_MAX_OUTPUT_TOKENS = 8192;

function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function createTextModel(provider: "anthropic" | "openai", model: string): LanguageModel {
  return provider === "anthropic" ? anthropic(model) : openai(model);
}

function buildSystemPrompt(
  copywriterPrompt: string,
  guide: string,
  rules: string,
  brand: BrandConfig
): string {
  const unshippedLines = brand.unshippedFeatureClaims
    .map((claim) => `Never claim ${claim}.`)
    .join("\n");
  return `${copywriterPrompt}

You are generating topic authority pages for ${brand.productName}.
Voice: ${brand.voice}.
${unshippedLines}
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
      return `Source ${idx + 1} (${focus}; cite as {{SRC:${idx + 1}|anchor text}})\nTitle: ${item.title}\nSummary: ${snippet}`;
    })
    .join("\n\n");
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

function countTokens(body: string, prefix: "LINK" | "SRC"): number {
  const re = new RegExp(`\\{\\{${prefix}:`, "g");
  return (body.match(re) ?? []).length;
}

export async function generateTopicArticle(input: {
  keyword: TopicKeyword;
  date: string;
  textProvider: "anthropic" | "openai";
  model: string;
  copywriterPrompt: string;
  guide: string;
  rules: string;
  brand: BrandConfig;
  research: ResearchResult[];
  internalLinkCandidates: InternalLinkCandidate[];
  config: Pick<AutoBloggerConfig, "aiCallDelayMs">;
}): Promise<{ article: GeneratedArticle; tokenUsage: TokenUsage; resolutionWarnings: string[] }> {
  const model = createTextModel(input.textProvider, input.model);
  const system = buildSystemPrompt(input.copywriterPrompt, input.guide, input.rules, input.brand);
  const researchSummary = summarizeResearch(input.research);
  const internalLinksSummary = summarizeInternalLinks(input.internalLinkCandidates);
  const existingKeywords = collectExistingKeywords(input.internalLinkCandidates);
  const existingKeywordsList =
    existingKeywords.size === 0
      ? "(none)"
      : Array.from(existingKeywords).slice(0, 200).map((k) => `- ${k}`).join("\n");

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
  await sleep(input.config.aiCallDelayMs);

  const tokenUsage: TokenUsage = {
    inputTokens: outlineResult.usage?.promptTokens ?? 0,
    outputTokens: outlineResult.usage?.completionTokens ?? 0,
  };

  const { angle, targetReader, sectionHeadings } = outlineResult.object;

  // Section-by-section generation
  const sections: string[] = [];
  const placedLinkIds = new Set<string>();
  const placedSrcNums = new Set<number>();
  let linksUsedSoFar = 0;

  for (let i = 0; i < sectionHeadings.length; i++) {
    const heading = sectionHeadings[i];
    const relevantResearch = selectRelevantResearch(input.research, heading);
    const previousSectionTail =
      sections.length > 0 ? sections[sections.length - 1].slice(-300) : "";

    const sectionResult = await generateSection(
      {
        heading,
        angle,
        targetReader,
        allHeadings: sectionHeadings,
        sectionIndex: i,
        totalSections: sectionHeadings.length,
        previousSectionTail,
        relevantResearch,
        internalLinkCandidates: input.internalLinkCandidates,
        linksUsedSoFar,
        placedLinkIds,
        placedSrcNums,
        isFirstSection: i === 0,
        primaryKeyword: input.keyword.keyword,
      },
      model,
      system,
      input.config
    );

    sections.push(sectionResult.text);
    tokenUsage.inputTokens += sectionResult.inputTokens;
    tokenUsage.outputTokens += sectionResult.outputTokens;

    for (const m of sectionResult.text.matchAll(/\{\{LINK:([^|}]+)/g)) {
      placedLinkIds.add(m[1].trim());
    }
    for (const m of sectionResult.text.matchAll(/\{\{SRC:(\d+)/g)) {
      placedSrcNums.add(Number(m[1]));
    }
    linksUsedSoFar +=
      countTokens(sectionResult.text, "LINK") + countTokens(sectionResult.text, "SRC");
  }

  let workingBody = sections.join("\n\n");

  // Remediation: add missing {{LINK:}} / {{SRC:}} tokens if floors are not met.
  const initialInternal = countTokens(workingBody, "LINK");
  const initialExternal = countTokens(workingBody, "SRC");
  const budget = linkBudget(workingBody);
  const totalShortfall = Math.max(0, budget.target - (initialInternal + initialExternal));
  const internalShortfall =
    Math.max(0, MIN_INTERNAL_LINKS - initialInternal) + Math.max(0, Math.ceil(totalShortfall / 2));
  const externalShortfall =
    Math.max(0, MIN_EXTERNAL_LINKS - initialExternal) + Math.max(0, Math.floor(totalShortfall / 2));
  const needsRemediation =
    (internalShortfall > 0 && input.internalLinkCandidates.length > 0) ||
    (externalShortfall > 0 && input.research.length > 0);

  if (needsRemediation) {
    const remediation = await generateText({
      model,
      system,
      prompt: `The article body below is missing inline link placeholders. Rewrite it to add ${externalShortfall} more {{SRC:<n>|anchor}} citation${externalShortfall === 1 ? "" : "s"} and ${internalShortfall} more {{LINK:<id>|anchor}} internal link${internalShortfall === 1 ? "" : "s"}. Embed each one inline in the prose at a sentence where it makes natural sense.

Rules:
- use only ids from the candidate list and only source numbers from the research list below
- do not add a "Sources" or "References" section
- preserve all existing placeholders (\`{{LINK:\`, \`{{SRC:\`, \`{{DIAGRAM:\`), headings, tables, and structure
- never include raw URLs or \`/topics/...\` paths
- output ONLY the rewritten markdown body. No preamble, no commentary, no fenced code block.

Research sources:
${researchSummary}

Internal-link candidates:
${internalLinksSummary}

Body to rewrite:
---
${workingBody}
---`,
      maxTokens: DRAFT_MAX_OUTPUT_TOKENS,
    });
    await sleep(input.config.aiCallDelayMs);
    tokenUsage.inputTokens += remediation.usage?.promptTokens ?? 0;
    tokenUsage.outputTokens += remediation.usage?.completionTokens ?? 0;
    const rewritten = remediation.text.trim();
    if (
      countTokens(rewritten, "LINK") >= MIN_INTERNAL_LINKS &&
      countTokens(rewritten, "SRC") >= MIN_EXTERNAL_LINKS
    ) {
      workingBody = rewritten;
    }
  }

  // Editorial pass: holistic prose cleanup across all assembled sections.
  const editorial = await generateEditorialPass(workingBody, model, system, input.config);
  tokenUsage.inputTokens += editorial.inputTokens;
  tokenUsage.outputTokens += editorial.outputTokens;
  if (
    editorial.text.length > 0 &&
    countTokens(editorial.text, "LINK") >= countTokens(workingBody, "LINK") &&
    countTokens(editorial.text, "SRC") >= countTokens(workingBody, "SRC")
  ) {
    workingBody = editorial.text;
  } else if (editorial.text.length > 0) {
    console.warn("[generateArticle] Editorial pass dropped link/source placeholders; keeping pre-editorial body.");
  }

  // Metadata call (title, slug, excerpt, readTime, imagePrompt, linkKeywords, diagrams)
  const metadataResult = await generateMetadata(
    workingBody,
    { angle, targetReader, sectionHeadings },
    { keyword: input.keyword, date: input.date, brand: input.brand, existingKeywordsList },
    model,
    system,
    input.config
  );
  tokenUsage.inputTokens += metadataResult.inputTokens;
  tokenUsage.outputTokens += metadataResult.outputTokens;

  // Drop diagram specs with no matching placeholder in body.
  const workingDiagrams = (metadataResult.object.diagrams ?? []).filter((d) =>
    workingBody.includes(`{{DIAGRAM:${d.id}}}`)
  );

  // Resolve {{LINK:}} and {{SRC:}} placeholders to real markdown links.
  const resolution = applyLinkPlaceholders(
    workingBody,
    input.internalLinkCandidates,
    input.research
  );

  // Lock URL slug to list.md keyword id so paths align with keyword.id.
  const slugSegment = input.keyword.id.split("/").pop() ?? "";
  const slug = sanitizeSlug(slugSegment || input.keyword.keyword);

  // Post-filter linkKeywords against existing candidates' keywords.
  const seenForKw = new Set<string>();
  const filteredKeywords = (metadataResult.object.linkKeywords ?? [])
    .map((k) => k.trim())
    .filter((k) => {
      const v = k.toLowerCase();
      if (!v || existingKeywords.has(v) || seenForKw.has(v)) return false;
      seenForKw.add(v);
      return true;
    });

  if (filteredKeywords.length < 6) {
    console.warn(
      `[generateArticle] linkKeywords filtered to ${filteredKeywords.length} entries (< 6); quality warning expected.`
    );
  }

  return {
    article: {
      hubSlug: input.keyword.hubSlug,
      hubTitle: input.keyword.hubTitle,
      clusterSlug: input.keyword.clusterSlug,
      clusterTitle: input.keyword.clusterTitle,
      title: metadataResult.object.title,
      slug,
      date: input.date,
      excerpt: metadataResult.object.excerpt,
      readTime: metadataResult.object.readTime,
      faq: outlineResult.object.faq
        .filter((item) => Boolean(item.question && item.answer))
        .map((item) => ({
          question: item.question,
          answer: applyLinkPlaceholders(item.answer, input.internalLinkCandidates, input.research).body,
        })),
      relatedSlugs: outlineResult.object.relatedSlugs,
      body: resolution.body,
      imagePrompt: metadataResult.object.imagePrompt.trim(),
      diagrams: workingDiagrams,
      linkKeywords: filteredKeywords,
    },
    tokenUsage,
    resolutionWarnings: resolution.warnings,
  };
}
