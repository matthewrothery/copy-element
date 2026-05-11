import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { applyLinkPlaceholders } from "./applyLinkPlaceholders.js";
import {
  buildKeywordIndex,
  KeywordIndexEntry,
  loadInternalLinkCandidates,
} from "./internalLinks.js";
import { linkBudget } from "./quality.js";
import type { BackfillFileChange, BackfillSummary } from "./types.js";

const TOP_FILES_PER_NEW_ARTICLE = 5;
const MAX_ADDS_PER_FILE = 2;

type Hit = {
  filePath: string;
  position: number;
  phrase: string;
  candidateId: string;
  candidateUrl: string;
};

/**
 * Build a mask string the same length as the body where masked characters
 * (inside code, link anchors, frontmatter, tables) are marked with \0 so a
 * lexical scan can skip them.
 */
function buildMask(raw: string): string {
  const out = raw.split("");

  // Frontmatter.
  const fm = raw.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (fm) {
    for (let i = 0; i < fm[0].length; i++) out[i] = "\0";
  }

  // Fenced code blocks.
  const fenceRe = /```[\s\S]*?```/g;
  for (const m of raw.matchAll(fenceRe)) {
    const start = m.index ?? 0;
    for (let i = start; i < start + m[0].length; i++) out[i] = "\0";
  }

  // Inline code.
  const inlineRe = /`[^`\n]+`/g;
  for (const m of raw.matchAll(inlineRe)) {
    const start = m.index ?? 0;
    for (let i = start; i < start + m[0].length; i++) out[i] = "\0";
  }

  // Existing markdown link anchors (mask the [anchor] portion only — leave the URL
  // alone so we can still parse it elsewhere).
  const linkRe = /\[([^\]]+)\]\([^)]+\)/g;
  for (const m of raw.matchAll(linkRe)) {
    const start = m.index ?? 0;
    for (let i = start; i < start + m[0].length; i++) out[i] = "\0";
  }

  // Markdown table rows (any line beginning with `|`).
  const tableRe = /^\|.*$/gm;
  for (const m of raw.matchAll(tableRe)) {
    const start = m.index ?? 0;
    for (let i = start; i < start + m[0].length; i++) out[i] = "\0";
  }

  return out.join("");
}

function countLinksInBody(body: string): { internal: number; external: number } {
  const internal = (body.match(/\]\(\/topics\//g) ?? []).length;
  const external = (body.match(/\]\(https?:\/\//g) ?? []).length;
  return { internal, external };
}

function findFirstHit(
  maskedLower: string,
  entry: KeywordIndexEntry
): number | null {
  const idx = maskedLower.indexOf(entry.phraseLower);
  return idx === -1 ? null : idx;
}

function bodyAlreadyLinksTo(body: string, url: string): boolean {
  return body.includes(`](${url})`);
}

function createTextModel(provider: "anthropic" | "openai", model: string) {
  return provider === "anthropic" ? anthropic(model) : openai(model);
}

async function rewriteFileWithLinks(
  body: string,
  hits: Hit[],
  provider: "anthropic" | "openai",
  modelId: string
): Promise<string> {
  const model = createTextModel(provider, modelId);
  const instructions = hits
    .map(
      (h, i) =>
        `${i + 1}. Embed {{LINK:${h.candidateId}|${h.phrase}}} near the existing phrase "${h.phrase}" (around character ${h.position}).`
    )
    .join("\n");

  const prompt = `You are inserting internal-link placeholders into an existing article body. Add ONLY the placeholders listed below, exactly once each, at a natural mid-sentence position near the matching phrase. Reuse the existing phrase as the anchor where it reads naturally.

Constraints:
- Output the FULL rewritten markdown body and nothing else (no preamble, no code fence).
- Preserve every existing placeholder ({{LINK:, {{SRC:, {{DIAGRAM:), every heading, table, list, code block, and link.
- Never place a placeholder inside a code block, table cell, existing link anchor, or the article's frontmatter.
- Each placeholder must appear exactly once.

Placeholders to insert:
${instructions}

Body:
---
${body}
---`;

  const result = await generateText({ model, prompt, maxTokens: 8192 });
  return result.text.trim();
}

function commitAndPush(
  workspaceRoot: string,
  files: string[],
  message: string,
  warnings: string[]
): { commitSha?: string; pushed: boolean } {
  try {
    for (const f of files) {
      execSync(`git add -- "${f}"`, { cwd: workspaceRoot, stdio: "pipe" });
    }
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
      cwd: workspaceRoot,
      stdio: "pipe",
    });
    const sha = execSync(`git rev-parse HEAD`, { cwd: workspaceRoot }).toString().trim();
    try {
      execSync(`git push`, { cwd: workspaceRoot, stdio: "pipe" });
      return { commitSha: sha, pushed: true };
    } catch (err) {
      warnings.push(`Auto-push failed; commit ${sha.slice(0, 7)} is local on the runner: ${(err as Error).message}`);
      return { commitSha: sha, pushed: false };
    }
  } catch (err) {
    warnings.push(`Git commit failed: ${(err as Error).message}`);
    return { pushed: false };
  }
}

/**
 * Scan every existing topic article for unlinked occurrences of any newly imported
 * article's `linkKeywords`. Rank top files per new article, run a single LLM pass
 * per file that adds at most `MAX_ADDS_PER_FILE` link placeholders, then resolve
 * placeholders and commit.
 */
export async function runBackfillForImportedArticles(
  workspaceRoot: string,
  importedSlugs: string[],
  options: {
    textProvider: "anthropic" | "openai";
    textModel: string;
  }
): Promise<BackfillSummary> {
  const warnings: string[] = [];
  const websiteRoot = path.join(workspaceRoot, "website");
  const candidates = loadInternalLinkCandidates(websiteRoot);

  const importedSet = new Set(importedSlugs);
  const newArticleCandidates = candidates.filter(
    (c) => c.type === "article" && c.slug && importedSet.has(c.slug)
  );

  if (newArticleCandidates.length === 0) {
    return { filesChanged: 0, linksAdded: 0, perFile: [], pushed: false, warnings };
  }

  const index = buildKeywordIndex(newArticleCandidates);
  if (index.length === 0) {
    warnings.push("Newly imported articles have no linkKeywords; skipping backfill.");
    return { filesChanged: 0, linksAdded: 0, perFile: [], pushed: false, warnings };
  }

  // Scan every existing article file (excluding the new ones).
  const sourceArticles = candidates.filter(
    (c) =>
      c.type === "article" &&
      c.filePath &&
      c.slug &&
      !importedSet.has(c.slug)
  );

  // Group hits by file, deduped per target candidateId.
  const hitsByFile = new Map<string, Hit[]>();
  // Track per-target file count to enforce TOP_FILES_PER_NEW_ARTICLE.
  const filesPerTarget = new Map<string, Set<string>>();

  for (const article of sourceArticles) {
    const filePath = article.filePath as string;
    let raw: string;
    try {
      raw = readFileSync(filePath, "utf-8");
    } catch {
      continue;
    }
    const mask = buildMask(raw);
    const maskedLower = mask.toLowerCase();

    for (const entry of index) {
      const targetUrl = entry.candidateUrl;
      if (bodyAlreadyLinksTo(raw, targetUrl)) continue;
      const pos = findFirstHit(maskedLower, entry);
      if (pos === null) continue;

      // Limit number of source files per target.
      const set = filesPerTarget.get(entry.candidateId) ?? new Set<string>();
      if (set.size >= TOP_FILES_PER_NEW_ARTICLE && !set.has(filePath)) continue;
      set.add(filePath);
      filesPerTarget.set(entry.candidateId, set);

      const list = hitsByFile.get(filePath) ?? [];
      // Skip if this candidate already queued for this file (first-hit only).
      if (list.some((h) => h.candidateId === entry.candidateId)) continue;
      list.push({
        filePath,
        position: pos,
        phrase: entry.phrase,
        candidateId: entry.candidateId,
        candidateUrl: targetUrl,
      });
      hitsByFile.set(filePath, list);
    }
  }

  const perFile: BackfillFileChange[] = [];
  const changedFiles: string[] = [];
  let linksAdded = 0;

  for (const [filePath, fileHits] of hitsByFile) {
    let raw: string;
    try {
      raw = readFileSync(filePath, "utf-8");
    } catch (err) {
      warnings.push(`Could not read ${filePath}: ${(err as Error).message}`);
      continue;
    }

    const fmMatch = raw.match(/^(---\r?\n[\s\S]*?\r?\n---\r?\n?)/);
    const frontmatter = fmMatch?.[0] ?? "";
    const body = raw.slice(frontmatter.length);

    const { internal, external } = countLinksInBody(body);
    const { ceiling } = linkBudget(body);
    const remaining = Math.max(0, ceiling - (internal + external));
    if (remaining <= 0) continue;

    const sorted = fileHits.sort((a, b) => a.position - b.position);
    const chosen = sorted.slice(0, Math.min(MAX_ADDS_PER_FILE, remaining));
    if (chosen.length === 0) continue;

    let rewritten: string;
    try {
      rewritten = await rewriteFileWithLinks(body, chosen, options.textProvider, options.textModel);
    } catch (err) {
      warnings.push(`Rewrite failed for ${path.relative(workspaceRoot, filePath)}: ${(err as Error).message}`);
      continue;
    }

    // Every chosen placeholder must appear once.
    const missing = chosen.filter((h) => !rewritten.includes(`{{LINK:${h.candidateId}|`));
    if (missing.length === chosen.length) {
      warnings.push(`Rewrite for ${path.relative(workspaceRoot, filePath)} dropped all placeholders; skipped.`);
      continue;
    }

    // Resolve placeholders against the full candidate list.
    const resolution = applyLinkPlaceholders(rewritten, candidates, []);
    const newBody = resolution.body;

    // Validate against ceiling.
    const after = countLinksInBody(newBody);
    if (after.internal + after.external > ceiling) {
      warnings.push(`Rewrite for ${path.relative(workspaceRoot, filePath)} exceeded ceiling (${after.internal + after.external} > ${ceiling}); skipped.`);
      continue;
    }
    if (after.internal <= internal) {
      // No net new internal links.
      continue;
    }

    writeFileSync(filePath, frontmatter + newBody, "utf-8");
    changedFiles.push(filePath);
    const addedTargets = chosen
      .filter((h) => !missing.find((m) => m.candidateId === h.candidateId))
      .map((h) => ({ id: h.candidateId, anchor: h.phrase }));
    linksAdded += addedTargets.length;
    perFile.push({ path: path.relative(workspaceRoot, filePath), addedTargets });

    if (resolution.warnings.length > 0) {
      for (const w of resolution.warnings) {
        warnings.push(`${path.relative(workspaceRoot, filePath)}: ${w}`);
      }
    }
  }

  let commitSha: string | undefined;
  let pushed = false;
  if (changedFiles.length > 0) {
    const targetSlugs = importedSlugs.join(", ");
    const result = commitAndPush(
      workspaceRoot,
      changedFiles,
      `auto-blogger: backfill internal links for ${targetSlugs}`,
      warnings
    );
    commitSha = result.commitSha;
    pushed = result.pushed;
  }

  return {
    filesChanged: changedFiles.length,
    linksAdded,
    perFile,
    commitSha,
    pushed,
    warnings,
  };
}
