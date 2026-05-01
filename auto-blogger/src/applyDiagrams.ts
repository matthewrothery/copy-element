import { DiagramSpecSchema, renderDiagramSvg, type DiagramSpec } from "./diagrams/index.js";
import type { GeneratedArticle } from "./types.js";

const PLACEHOLDER_RE = /\{\{DIAGRAM:([a-z0-9-]+)\}\}/g;

export type DiagramAssetBuffer = {
  id: string;
  buffer: Buffer<ArrayBufferLike>;
};

export function applyDiagramsToArticle(
  article: GeneratedArticle,
  maxDiagrams: number
): {
  article: GeneratedArticle;
  diagramBuffers: DiagramAssetBuffer[];
  warnings: string[];
} {
  const warnings: string[] = [];
  let diagrams = article.diagrams;

  if (diagrams.length > maxDiagrams) {
    warnings.push(
      `Diagram list truncated from ${diagrams.length} to ${maxDiagrams} (AUTO_BLOG_MAX_DIAGRAMS).`
    );
    diagrams = diagrams.slice(0, maxDiagrams);
  }

  const seenIds = new Set<string>();
  const validated: DiagramSpec[] = [];

  for (const raw of diagrams) {
    const parsed = DiagramSpecSchema.safeParse(raw);
    if (!parsed.success) {
      warnings.push(`Skipped invalid diagram spec: ${parsed.error.message}`);
      continue;
    }
    if (seenIds.has(parsed.data.id)) {
      warnings.push(`Duplicate diagram id skipped: ${parsed.data.id}`);
      continue;
    }
    seenIds.add(parsed.data.id);
    validated.push(parsed.data);
  }

  let body = article.body;
  const diagramBuffers: DiagramAssetBuffer[] = [];
  const appliedSpecs: DiagramSpec[] = [];

  for (const spec of validated) {
    const placeholder = `{{DIAGRAM:${spec.id}}}`;
    if (!body.includes(placeholder)) {
      warnings.push(`Diagram "${spec.id}" has no matching placeholder ${placeholder} in body.`);
      continue;
    }

    let svg: string;
    try {
      svg = renderDiagramSvg(spec);
    } catch (e) {
      warnings.push(`Failed to render diagram "${spec.id}": ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    const publicPath = `/topic-images/${article.hubSlug}/${article.clusterSlug}/${article.slug}-diagram-${spec.id}.svg`;
    const md = `![${spec.altHint}](${publicPath})`;
    const count = body.split(placeholder).length - 1;
    if (count > 1) {
      warnings.push(`Diagram placeholder ${placeholder} appears ${count} times; replacing all.`);
    }
    body = body.split(placeholder).join(md);
    diagramBuffers.push({
      id: spec.id,
      buffer: Buffer.from(svg, "utf-8"),
    });
    appliedSpecs.push(spec);
  }

  body = body.replace(PLACEHOLDER_RE, (full, id: string) => {
    warnings.push(`Unresolved diagram placeholder for "${id}" (${full}); removed.`);
    return "";
  });

  return {
    article: {
      ...article,
      body: body.replace(/\n{3,}/g, "\n\n").trim(),
      diagrams: appliedSpecs,
    },
    diagramBuffers,
    warnings,
  };
}
