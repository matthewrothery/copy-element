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

  let resolved = body.replace(INTERNAL_PLACEHOLDER_RE, (_match, idRaw: string, anchorRaw: string) => {
    const id = idRaw.trim();
    const anchor = anchorRaw.trim();
    const url = slugToUrl.get(id);
    if (!url) {
      warnings.push(`Internal link placeholder references unknown id "${id}"; dropped.`);
      return anchor;
    }
    internalLinkCount += 1;
    return `[${anchor}](${url})`;
  });

  resolved = resolved.replace(EXTERNAL_PLACEHOLDER_RE, (_match, indexRaw: string, anchorRaw: string) => {
    const idx = Number.parseInt(indexRaw, 10);
    const anchor = anchorRaw.trim();
    const item = Number.isFinite(idx) ? research[idx - 1] : undefined;
    if (!item || !item.url) {
      warnings.push(`Source placeholder references invalid index "${indexRaw}"; dropped.`);
      return anchor;
    }
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
