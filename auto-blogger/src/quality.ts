import { GeneratedArticle, ResearchResult } from "./types.js";

/** Plain intro before any H2, or narrative under a leading "## Quick Answer"-style heading. */
const MIN_UPFRONT_CHARS = 100;

const UPFRONT_ANSWER_HEADING = /^##\s+(Quick Answer|TL;DR|Short Answer|At a Glance|Summary|Key takeaways|Executive summary|Overview)\s*$/i;

function measureUpfrontAnswerChars(body: string): number {
  const trimmed = body.trim();
  const firstH2 = trimmed.search(/^##\s+/m);

  if (firstH2 === -1) {
    return trimmed.length;
  }

  const fromFirstH2 = trimmed.slice(firstH2);
  const nl = fromFirstH2.indexOf("\n");
  const headingLine = (nl === -1 ? fromFirstH2 : fromFirstH2.slice(0, nl)).trim();

  if (UPFRONT_ANSWER_HEADING.test(headingLine)) {
    const afterHeading = nl === -1 ? "" : fromFirstH2.slice(nl + 1);
    const secondH2 = afterHeading.search(/^##\s+/m);
    const upfrontRegion = secondH2 === -1 ? afterHeading : afterHeading.slice(0, secondH2);
    return upfrontRegion.trim().length;
  }

  return trimmed.slice(0, firstH2).trim().length;
}

/** Body must not duplicate frontmatter-driven FAQ on topic pages. */
const BODY_FAQ_HEADING = /^##\s+faq\b/im;
const BODY_FAQ_H3 = /^###\s+faq\b/im;
const BODY_FAQ_FAQ_PHRASE = /^##\s+frequently\s+asked\s+questions\b/im;

const BANNED_PHRASES = [
  "jsx export is available",
  "tailwind output is available",
  "tailwind export is available",
];

export function validateArticleQuality(
  article: GeneratedArticle,
  usedSlugs: Set<string>,
  research: ResearchResult[] = []
): string[] {
  const issues: string[] = [];
  const lowerBody = article.body.toLowerCase();
  const body = article.body.trim();
  const internalLinkCount = (article.body.match(/\]\(\/topics\//g) ?? []).length;
  const externalSourceLinkCount = (article.body.match(/\]\(https?:\/\//g) ?? []).length;

  if (article.body.length < 4000) {
    issues.push("Body content looks too short for authoritative article.");
  }

  if (usedSlugs.has(article.slug)) {
    issues.push(`Duplicate slug detected: ${article.slug}`);
  }

  if (measureUpfrontAnswerChars(body) < MIN_UPFRONT_CHARS) {
    issues.push("Article should start with a useful upfront answer before the first section heading.");
  }

  if (internalLinkCount > 10) {
    issues.push(`Too many internal links: ${internalLinkCount}. Maximum is 10.`);
  }

  if (research.some((item) => item.focus === "statistics") && externalSourceLinkCount === 0) {
    issues.push("Article should cite at least one external source when statistics/data research is available.");
  }

  for (const phrase of BANNED_PHRASES) {
    if (lowerBody.includes(phrase)) {
      issues.push(`Unsupported feature claim detected: "${phrase}"`);
    }
  }

  if (!article.excerpt || article.excerpt.length < 70) {
    issues.push("Excerpt is too short.");
  }

  if (article.faq.length === 0) {
    issues.push("Article should include at least one FAQ item.");
  }

  if (!article.imagePrompt || article.imagePrompt.length < 20) {
    issues.push("Image prompt missing or too short.");
  }

  if (/\{\{DIAGRAM:/.test(article.body)) {
    issues.push("Unresolved diagram placeholders remain in body.");
  }

  if (
    article.diagrams.length > 0 &&
    !article.body.includes(`${article.slug}-diagram-`)
  ) {
    issues.push("Diagram specs were provided but no diagram image references appear in the body.");
  }

  const comparisonCue = /vs\.?|versus|compared to|comparison|alternative/i.test(
    `${article.clusterTitle} ${article.title} ${article.body.slice(0, 800)}`
  );
  if (comparisonCue && !/\|\s*[-:]+\s*\|/.test(article.body)) {
    issues.push("Comparison-focused topic may benefit from a markdown table.");
  }

  if (
    BODY_FAQ_HEADING.test(article.body) ||
    BODY_FAQ_H3.test(article.body) ||
    BODY_FAQ_FAQ_PHRASE.test(article.body)
  ) {
    issues.push(
      "Remove FAQ headings or FAQ lists from the markdown body; FAQs belong in frontmatter only for topic pages."
    );
  }

  return issues;
}
