import { generateObject, generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { DiagramSpecSchema, type DiagramSpec } from "./diagrams/schema.js";
import { applyLinkPlaceholders, candidateId } from "./applyLinkPlaceholders.js";
import { collectExistingKeywords } from "./internalLinks.js";
import { linkBudget } from "./quality.js";
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
  linkKeywords: z.array(z.string()).min(6).max(12),
});

/** Draft JSON includes a long markdown body; SDK default ~4096 completion tokens truncates before `body` is emitted (finishReason: length). */
const DRAFT_MAX_OUTPUT_TOKENS = 8192;

const MIN_INTERNAL_LINKS = 3;
const MIN_EXTERNAL_LINKS = 2;

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
      return `Source ${idx + 1} (${focus}) — cite as {{SRC:${idx + 1}|anchor text}}\nTitle: ${item.title}\nSummary: ${snippet}`;
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
  research: ResearchResult[];
  internalLinkCandidates: InternalLinkCandidate[];
}): Promise<{ article: GeneratedArticle; tokenUsage: TokenUsage; resolutionWarnings: string[] }> {
  const model = createTextModel(input.textProvider, input.model);
  const system = buildSystemPrompt(input.copywriterPrompt, input.guide, input.rules);
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
  const outline = outlineResult;

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

CRITICAL BODY-COMPOSITION RULES (these must hold in the \`body\` string itself; satisfying the JSON schema is not enough):

1. CITATIONS: To cite a research source, emit \`{{SRC:<n>|<anchor text>}}\` inline at the sentence where you reference that source's claim. \`<n>\` is the source's number from the research list below (1-based). The body MUST contain at least ${MIN_EXTERNAL_LINKS} \`{{SRC:\` tokens; aim for 4-6. Skipping this is a hard failure. Never list sources as a block.
2. INTERNAL LINKS: To link to existing site content, emit \`{{LINK:<id>|<anchor text>}}\` inline. \`<id>\` is the id from the internal-link candidate list below. The body MUST contain at least ${MIN_INTERNAL_LINKS} \`{{LINK:\` tokens; aim for 4-8. Choose ids only from the provided list — do not invent new ones.
3. DIAGRAM SYNCHRONIZATION: For every entry you put in the \`diagrams\` array, the body MUST contain exactly one matching placeholder line of the form \`{{DIAGRAM:<id>}}\` where \`<id>\` matches the diagram's \`id\` field character-for-character. If you cannot place a diagram naturally in the body, do NOT include it in the diagrams array.
4. LINK KEYWORDS: Emit a \`linkKeywords\` array of 6-12 short anchor-quality phrases (each 2-6 words) that would read naturally as a mid-sentence anchor pointing TO this article from another post. Include the primary keyword and 1-2 close paraphrases. Avoid single generic words like "HTML" or "AI". Do not include phrases already used by other articles (list below).

Other requirements:
- 1200-2000 words
- markdown body only (no frontmatter)
- start with a short upfront answer section before the first heading. Answer the keyword directly in a conversational way, like a helpful expert replying to a specific question. Keep it concise, concrete, and useful for AI summaries.
- practical examples and steps
- avoid generic filler
- when using concrete statistics, benchmarks, survey findings, market numbers, dates, or data points, cite the source with a \`{{SRC:<n>|...}}\` placeholder.
- include concrete statistics or data where the research supports it. Keep data references native, organic, and human-readable, not a list of forced numbers.
- never include raw \`https://\` URLs or raw \`/topics/...\` paths in the body — always use the placeholder syntax.
- do not include H1 title inside body
- do not put FAQ content in the markdown body. Never use headings like ## FAQ, ### FAQ, or "Frequently asked questions", and do not duplicate Q&A lists in prose. FAQ items are supplied separately from the outline and become YAML frontmatter only; the published page renders them once below the article.
- keep claims realistic
- include at least one markdown comparison table when the topic compares approaches, tools, or workflows (for example manual DevTools vs extension-assisted capture).
- add 1-3 programmatic diagrams when they clarify a workflow, comparison, or numbered process. Each diagram is data you output in the diagrams array (kind: flow | columns | steps), not SVG.
- optional short italic caption line immediately after a diagram placeholder is allowed.

Also return an image prompt for a stencil street-art style cover image with bold minimal overlapping colors. No text in image.

Diagram kinds:
- flow: ordered nodes with short labels (sequence left-to-right).
- columns: 2-3 columns with a title and bullet-like rows per column (for contrasting methods).
- steps: 3-7 numbered steps with short labels (horizontal layout).

Research context (cite via {{SRC:<n>|...}} where n is the Source number):
${researchSummary}

Internal-link candidates (use the id field in {{LINK:<id>|...}}):
${internalLinksSummary}

Anchor phrases already taken by other articles (your linkKeywords MUST NOT collide with these):
${existingKeywordsList}

BEFORE YOU FINISH, mentally verify against the body string you just wrote:
(a) Does it contain at least ${MIN_EXTERNAL_LINKS} \`{{SRC:\` substrings? If not, add inline citations.
(b) Does it contain at least ${MIN_INTERNAL_LINKS} \`{{LINK:\` substrings? If not, add inline internal links.
(c) For each diagram \`id\` in your diagrams array, does the body contain \`{{DIAGRAM:\` + id + \`}}\`? If not, add the placeholder or remove the diagram.
(d) Are your linkKeywords (6-12) all distinct from the "already taken" list above?
Only emit your response once all four checks pass.
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

  let workingBody = draft.object.body.trim();

  // Drop orphan diagram specs (no matching {{DIAGRAM:id}} placeholder in body).
  let workingDiagrams: DiagramSpec[] = (draft.object.diagrams ?? []).filter((d) =>
    workingBody.includes(`{{DIAGRAM:${d.id}}}`)
  );

  // Combined remediation: if either {{LINK:}} or {{SRC:}} count is below the floor, run
  // a single text rewrite that adds the missing placeholders. Cheaper than re-drafting and
  // bounded — we only accept the rewrite if both floors are met.
  const initialInternal = countTokens(workingBody, "LINK");
  const initialExternal = countTokens(workingBody, "SRC");
  const budget = linkBudget(workingBody);
  const totalShortfall = Math.max(0, budget.target - (initialInternal + initialExternal));
  const internalShortfall = Math.max(0, MIN_INTERNAL_LINKS - initialInternal) + Math.max(0, Math.ceil(totalShortfall / 2));
  const externalShortfall = Math.max(0, MIN_EXTERNAL_LINKS - initialExternal) + Math.max(0, Math.floor(totalShortfall / 2));
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
- output ONLY the rewritten markdown body — no preamble, no commentary, no fenced code block

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
    const rewritten = remediation.text.trim();
    if (
      countTokens(rewritten, "LINK") >= MIN_INTERNAL_LINKS &&
      countTokens(rewritten, "SRC") >= MIN_EXTERNAL_LINKS
    ) {
      workingBody = rewritten;
      // Re-filter diagrams in case the rewrite dropped a placeholder.
      workingDiagrams = workingDiagrams.filter((d) => workingBody.includes(`{{DIAGRAM:${d.id}}}`));
    }
    tokenUsage.inputTokens += remediation.usage?.promptTokens ?? 0;
    tokenUsage.outputTokens += remediation.usage?.completionTokens ?? 0;
  }

  // Substitute {{LINK:}} and {{SRC:}} placeholders with real markdown links.
  const resolution = applyLinkPlaceholders(
    workingBody,
    input.internalLinkCandidates,
    input.research
  );

  // Lock URL slug to list.md so paths align with keyword.id and we do not collide with sibling filenames.
  const slugSegment = input.keyword.id.split("/").pop() ?? "";
  const slug = sanitizeSlug(slugSegment || input.keyword.keyword);

  // Filter out linkKeywords that collide with existing candidates' keywords. If we drop
  // below 6, surface a warning but do not fail — quality.ts will record it.
  const seenForKw = new Set<string>();
  const filteredKeywords = (draft.object.linkKeywords ?? [])
    .map((k) => k.trim())
    .filter((k) => {
      const v = k.toLowerCase();
      if (!v || existingKeywords.has(v) || seenForKw.has(v)) return false;
      seenForKw.add(v);
      return true;
    });

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
      body: resolution.body,
      imagePrompt: draft.object.imagePrompt.trim(),
      diagrams: workingDiagrams,
      linkKeywords: filteredKeywords,
    },
    tokenUsage,
    resolutionWarnings: resolution.warnings,
  };
}
