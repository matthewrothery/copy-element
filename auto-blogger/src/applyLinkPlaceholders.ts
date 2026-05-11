import type { InternalLinkCandidate, ResearchResult } from "./types.js";

export type LinkResolutionResult = {
  body: string;
  internalLinkCount: number;
  externalLinkCount: number;
  warnings: string[];
};

const INTERNAL_PLACEHOLDER_RE = /\{\{LINK:([^|}]+)\|([^}]+)\}\}/g;
const EXTERNAL_PLACEHOLDER_RE = /\{\{SRC:(\d+)\|([^}]+)\}\}/g;
const ANY_PLACEHOLDER_RE = /\{\{(?:LINK|SRC):[^}]*\}\}/g;

/**
 * Build a stable id for an internal-link candidate. The same derivation is used
 * by the prompt summariser so model and resolver share one namespace.
 */
export function candidateId(candidate: InternalLinkCandidate): string {
  if (candidate.type === "article") {
    return candidate.slug ?? candidate.url;
  }
  if (candidate.type === "blog") {
    return `blog:${candidate.slug ?? candidate.url}`;
  }
  if (candidate.type === "cluster") {
    return `${candidate.hubSlug}__${candidate.clusterSlug ?? ""}`;
  }
  return candidate.hubSlug;
}

export function applyLinkPlaceholders(
  body: string,
  candidates: InternalLinkCandidate[],
  research: ResearchResult[]
): LinkResolutionResult {
  const warnings: string[] = [];
  const slugToUrl = new Map<string, string>();
  for (const c of candidates) {
    slugToUrl.set(candidateId(c), c.url);
  }

  let internalLinkCount = 0;
  let externalLinkCount = 0;
  const seenInternalUrls = new Set<string>();
  const seenExternalUrls = new Set<string>();
  const seenAnchors = new Set<string>();

  // Pre-seed with URLs and anchors already present in the body as resolved markdown
  // links so backfill passes don't introduce duplicates.
  const existingLinkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  for (const m of body.matchAll(existingLinkRe)) {
    const anchor = m[1].trim().toLowerCase();
    const url = m[2].trim();
    seenAnchors.add(anchor);
    if (url.startsWith("/")) seenInternalUrls.add(url);
    else if (/^https?:\/\//.test(url)) seenExternalUrls.add(url);
  }

  let resolved = body.replace(INTERNAL_PLACEHOLDER_RE, (_match, idRaw: string, anchorRaw: string) => {
    const id = idRaw.trim();
    const anchor = anchorRaw.trim();
    const anchorKey = anchor.toLowerCase();
    const url = slugToUrl.get(id);
    if (!url) {
      warnings.push(`Internal link placeholder references unknown id "${id}"; dropped.`);
      return anchor;
    }
    if (seenInternalUrls.has(url)) {
      warnings.push(`Duplicate internal link to ${url} dropped.`);
      return anchor;
    }
    if (seenAnchors.has(anchorKey)) {
      warnings.push(`Duplicate anchor text "${anchor}" dropped.`);
      return anchor;
    }
    seenInternalUrls.add(url);
    seenAnchors.add(anchorKey);
    internalLinkCount += 1;
    return `[${anchor}](${url})`;
  });

  resolved = resolved.replace(EXTERNAL_PLACEHOLDER_RE, (_match, indexRaw: string, anchorRaw: string) => {
    const idx = Number.parseInt(indexRaw, 10);
    const anchor = anchorRaw.trim();
    const anchorKey = anchor.toLowerCase();
    const item = Number.isFinite(idx) ? research[idx - 1] : undefined;
    if (!item || !item.url) {
      warnings.push(`Source placeholder references invalid index "${indexRaw}"; dropped.`);
      return anchor;
    }
    if (seenExternalUrls.has(item.url)) {
      warnings.push(`Duplicate external link to ${item.url} dropped.`);
      return anchor;
    }
    if (seenAnchors.has(anchorKey)) {
      warnings.push(`Duplicate anchor text "${anchor}" dropped.`);
      return anchor;
    }
    seenExternalUrls.add(item.url);
    seenAnchors.add(anchorKey);
    externalLinkCount += 1;
    return `[${anchor}](${item.url})`;
  });

  // Strip any malformed placeholders that didn't match either pattern (e.g. missing anchor).
  resolved = resolved.replace(ANY_PLACEHOLDER_RE, (match) => {
    warnings.push(`Malformed link placeholder dropped: ${match}`);
    return "";
  });

  return { body: resolved, internalLinkCount, externalLinkCount, warnings };
}
