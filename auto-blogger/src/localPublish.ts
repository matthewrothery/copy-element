import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { ArticleArtifact } from "./types.js";

function safeTargetPath(workspaceRoot: string, relativePath: string): string {
  const out = path.resolve(workspaceRoot, relativePath);
  if (!out.startsWith(workspaceRoot)) {
    throw new Error(`Unsafe path traversal detected: ${relativePath}`);
  }
  return out;
}

function assertAllowedWebsiteTarget(relativePath: string): void {
  if (
    !relativePath.startsWith("website/content/topics/") &&
    !relativePath.startsWith("website/public/topic-images/")
  ) {
    throw new Error(`Disallowed target path: ${relativePath}`);
  }
}

export function writeDryRunArtifact(
  sourceRoot: string,
  artifact: ArticleArtifact
): { articlePath: string; assetPaths: string[] } {
  const base = path.resolve(sourceRoot, "dry-runs", artifact.artifactId);
  mkdirSync(base, { recursive: true });

  const articlePath = path.join(base, "article.md");
  const metadataPath = path.join(base, "metadata.json");

  writeFileSync(articlePath, artifact.articleMarkdown, "utf-8");
  writeFileSync(metadataPath, JSON.stringify(artifact.metadata, null, 2) + "\n", "utf-8");

  const assetPaths: string[] = [];
  for (const asset of artifact.assetBuffers) {
    const outPath = path.join(base, asset.s3Name);
    writeFileSync(outPath, asset.buffer);
    assetPaths.push(outPath);
  }

  return { articlePath, assetPaths };
}

export function writeArtifactToWebsite(
  workspaceRoot: string,
  artifact: ArticleArtifact
): { articlePath: string; assetPaths: string[] } {
  assertAllowedWebsiteTarget(artifact.metadata.articlePath);

  const articlePath = safeTargetPath(workspaceRoot, artifact.metadata.articlePath);
  mkdirSync(path.dirname(articlePath), { recursive: true });
  writeFileSync(articlePath, artifact.articleMarkdown, "utf-8");

  const assetPaths: string[] = [];
  for (const asset of artifact.assetBuffers) {
    assertAllowedWebsiteTarget(asset.websiteRelativePath);
    const out = safeTargetPath(workspaceRoot, asset.websiteRelativePath);
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, asset.buffer);
    assetPaths.push(out);
  }

  return { articlePath, assetPaths };
}
