import { GeneratedArticle, GeneratedBlogPost } from "./types.js";

export type WarningLevel = "critical" | "advisory";

export type CategorizedWarning = {
  message: string;
  level: WarningLevel;
};

const CRITICAL_PATTERNS: RegExp[] = [
  /^Duplicate slug detected:/,
  /^Duplicate blog slug detected:/,
  /^Body content looks too short/,
  /^Unsupported feature claim detected:/,
  /^Body markdown must not contain H1 headings/,
];

export function categorizeWarning(message: string): WarningLevel {
  return CRITICAL_PATTERNS.some((re) => re.test(message)) ? "critical" : "advisory";
}

export function categorizeWarnings(warnings: string[]): CategorizedWarning[] {
  return warnings.map((message) => ({ message, level: categorizeWarning(message) }));
}

export function hasCriticalWarnings(warnings: string[]): boolean {
  return warnings.some((w) => categorizeWarning(w) === "critical");
}

/** Plain intro before any H2, or narrative under a leading "## Quick Answer"-style heading. */
const MIN_UPFRONT_CHARS = 100;

const INTERNAL_FLOOR = 3;
const EXTERNAL_FLOOR = 2;
const WORDS_PER_LINK = 120;
const CEILING_HEADROOM = 2;

export function linkBudget(body: string): { target: number; ceiling: number } {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const target = Math.max(5, Math.round(words / WORDS_PER_LINK));
  return { target, ceiling: target + CEILING_HEADROOM };
}

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
  usedSlugs: Set<string>
): string[] {
  const issues: string[] = [];
  const lowerBody = article.body.toLowerCase();
  const body = article.body.trim();
  const internalLinkCount = (article.body.match(/\]\(\/(?:topics|blog)\//g) ?? []).length;
  const externalSourceLinkCount = (article.body.match(/\]\(https?:\/\//g) ?? []).length;
  const { target, ceiling } = linkBudget(article.body);
  const totalLinks = internalLinkCount + externalSourceLinkCount;

  if (article.body.length < 4000) {
    issues.push("Body content looks too short for authoritative article.");
  }

  if (usedSlugs.has(article.slug)) {
    issues.push(`Duplicate slug detected: ${article.slug}`);
  }

  if (measureUpfrontAnswerChars(body) < MIN_UPFRONT_CHARS) {
    issues.push("Article should start with a useful upfront answer before the first section heading.");
  }

  const bodyH1Headings = article.body.match(/^#\s+/gm) ?? [];
  if (bodyH1Headings.length > 0) {
    issues.push(`Body markdown must not contain H1 headings; found ${bodyH1Headings.length}.`);
  }

  if (internalLinkCount < INTERNAL_FLOOR) {
    issues.push(
      `Article has only ${internalLinkCount} internal link${internalLinkCount === 1 ? "" : "s"}; minimum is ${INTERNAL_FLOOR}.`
    );
  }
  if (externalSourceLinkCount < EXTERNAL_FLOOR) {
    issues.push(
      `Article has only ${externalSourceLinkCount} external citation${externalSourceLinkCount === 1 ? "" : "s"}; minimum is ${EXTERNAL_FLOOR}.`
    );
  }
  if (totalLinks > ceiling) {
    issues.push(
      `Too many links: ${totalLinks} (internal+external). Target is ~${target}, ceiling is ${ceiling}.`
    );
  }

  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  const seenUrls = new Map<string, number>();
  const seenAnchors = new Map<string, number>();
  for (const m of article.body.matchAll(linkRe)) {
    const anchor = m[1].trim().toLowerCase();
    const url = m[2].trim();
    seenUrls.set(url, (seenUrls.get(url) ?? 0) + 1);
    seenAnchors.set(anchor, (seenAnchors.get(anchor) ?? 0) + 1);
  }
  for (const [url, n] of seenUrls) {
    if (n > 1) issues.push(`Duplicate link target: ${url} appears ${n} times.`);
  }
  for (const [anchor, n] of seenAnchors) {
    if (n > 1) issues.push(`Duplicate anchor text: "${anchor}" appears ${n} times.`);
  }

  if (article.linkKeywords && article.linkKeywords.length > 0) {
    if (article.linkKeywords.length < 6) {
      issues.push(`linkKeywords has only ${article.linkKeywords.length} entries; aim for 6-12 unique phrases.`);
    }
    const seen = new Set<string>();
    for (const kw of article.linkKeywords) {
      const v = kw.trim().toLowerCase();
      if (v && seen.has(v)) issues.push(`Duplicate linkKeyword: "${kw}"`);
      if (v) seen.add(v);
    }
  } else {
    issues.push("linkKeywords missing; backfill will skip this article as a link target.");
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

export function validateNewsPostQuality(
  post: GeneratedBlogPost,
  usedSlugs: Set<string> = new Set()
): string[] {
  const issues: string[] = [];
  const lowerBody = post.body.toLowerCase();
  const internalLinkCount = (post.body.match(/\]\(\/(?:topics|blog)\//g) ?? []).length;
  const externalSourceLinkCount = (post.body.match(/\]\(https?:\/\//g) ?? []).length;
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  const seenUrls = new Map<string, number>();
  const seenAnchors = new Map<string, number>();

  if (post.sourceItems.length < 3) {
    issues.push(`News post has only ${post.sourceItems.length} usable source item(s); minimum is 3.`);
  }

  for (const item of post.sourceItems) {
    if (!item.content || item.content.trim().length < 300) {
      issues.push(`Source content is missing or too short: ${item.title}`);
    }
  }

  if (usedSlugs.has(post.slug)) {
    issues.push(`Duplicate blog slug detected: ${post.slug}`);
  }

  if (externalSourceLinkCount < 2) {
    issues.push(
      `News post has only ${externalSourceLinkCount} external source link${externalSourceLinkCount === 1 ? "" : "s"}; minimum is 2.`
    );
  }

  if (internalLinkCount < 2) {
    issues.push(
      `News post has only ${internalLinkCount} internal link${internalLinkCount === 1 ? "" : "s"}; minimum is 2.`
    );
  }

  for (const match of post.body.matchAll(linkRe)) {
    const anchor = match[1].trim().toLowerCase();
    const url = match[2].trim();
    seenUrls.set(url, (seenUrls.get(url) ?? 0) + 1);
    seenAnchors.set(anchor, (seenAnchors.get(anchor) ?? 0) + 1);
  }
  for (const [url, count] of seenUrls) {
    if (count > 1) issues.push(`Duplicate link target: ${url} appears ${count} times.`);
  }
  for (const [anchor, count] of seenAnchors) {
    if (count > 1) issues.push(`Duplicate anchor text: "${anchor}" appears ${count} times.`);
  }

  if (/\{\{(?:LINK|SRC):/.test(post.body)) {
    issues.push("Unresolved link placeholders remain in news post body.");
  }

  for (const phrase of BANNED_PHRASES) {
    if (lowerBody.includes(phrase)) {
      issues.push(`Unsupported feature claim detected: "${phrase}"`);
    }
  }

  if (!post.excerpt || post.excerpt.length < 70) {
    issues.push("Excerpt is too short.");
  }

  if (!post.imagePrompt || post.imagePrompt.length < 20) {
    issues.push("Image prompt missing or too short.");
  }

  return issues;
}
