import "dotenv/config";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import path from "path";
import crypto from "crypto";
import { loadConfig } from "./config.js";
import {
  listPendingArtifactPrefixes,
  movePrefixToPublished,
  readS3Buffer,
  readS3Text,
} from "./s3.js";
import { ArticleArtifactMetadata } from "./types.js";

function safeTargetPath(workspaceRoot: string, relativePath: string): string {
  const out = path.resolve(workspaceRoot, relativePath);
  if (!out.startsWith(workspaceRoot)) {
    throw new Error(`Unsafe path traversal detected: ${relativePath}`);
  }
  return out;
}

function assertAllowedTarget(relativePath: string): void {
  if (
    !relativePath.startsWith("website/content/topics/") &&
    !relativePath.startsWith("website/public/topic-images/")
  ) {
    throw new Error(`Disallowed target path: ${relativePath}`);
  }
}

function extFromImagePath(imagePath: string): string {
  const parsed = path.parse(imagePath).ext.replace(".", "");
  return parsed || "png";
}

function sha256(input: Buffer | string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

async function main(): Promise<void> {
  const config = loadConfig();
  if (!config.s3Bucket) {
    throw new Error("AUTO_BLOG_S3_BUCKET is required for import");
  }

  const pending = await listPendingArtifactPrefixes(config.s3Bucket, config.s3Prefix);
  const selected = pending.slice(0, config.importLimit);

  if (selected.length === 0) {
    console.log("No pending auto-blogger artifacts.");
    return;
  }

  const workspaceRoot = path.resolve(config.packageRoot, "..");

  for (const prefix of selected) {
    const normalizedPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
    const artifactId = path.basename(normalizedPrefix);
    const metadataRaw = await readS3Text(config.s3Bucket, `${normalizedPrefix}/metadata.json`);
    const metadata = JSON.parse(metadataRaw) as ArticleArtifactMetadata;

    const articleMarkdown = await readS3Text(config.s3Bucket, `${normalizedPrefix}/article.md`);

    if (sha256(articleMarkdown) !== metadata.checksums.articleSha256) {
      throw new Error(`Checksum mismatch for article in artifact ${artifactId}`);
    }

    const legacyCoverOnly =
      (!metadata.assets || metadata.assets.length === 0) &&
      typeof metadata.checksums.imageSha256 === "string";

    const articleOut = safeTargetPath(workspaceRoot, metadata.articlePath);
    assertAllowedTarget(metadata.articlePath);

    if (!config.importOverwrite && existsSync(articleOut)) {
      const assetNamesForMove = legacyCoverOnly
        ? [`cover.${extFromImagePath(metadata.imagePath)}`]
        : (metadata.assets ?? []).map((a) => a.s3Name);
      if (!legacyCoverOnly && assetNamesForMove.length === 0) {
        throw new Error(`Artifact ${artifactId} missing assets manifest and legacy cover checksum.`);
      }
      await movePrefixToPublished(config.s3Bucket, config.s3Prefix, artifactId, assetNamesForMove);
      console.log(`Skipped import (article exists): ${metadata.articlePath}`);
      continue;
    }

    if (legacyCoverOnly) {
      const ext = extFromImagePath(metadata.imagePath);
      const coverName = `cover.${ext}`;
      const imageBuffer = await readS3Buffer(
        config.s3Bucket,
        `${normalizedPrefix}/${coverName}`
      );

      if (sha256(imageBuffer) !== metadata.checksums.imageSha256) {
        throw new Error(`Checksum mismatch for image in artifact ${artifactId}`);
      }

      const imageOut = safeTargetPath(workspaceRoot, metadata.imagePath);
      assertAllowedTarget(metadata.imagePath);

      mkdirSync(path.dirname(articleOut), { recursive: true });
      mkdirSync(path.dirname(imageOut), { recursive: true });

      writeFileSync(articleOut, articleMarkdown, "utf-8");
      writeFileSync(imageOut, imageBuffer);

      await movePrefixToPublished(config.s3Bucket, config.s3Prefix, artifactId, [coverName]);

      console.log(`Imported artifact ${artifactId} -> ${metadata.articlePath}`);
      continue;
    }

    if (!metadata.assets?.length) {
      throw new Error(`Artifact ${artifactId} missing assets manifest and legacy cover checksum.`);
    }

    mkdirSync(path.dirname(articleOut), { recursive: true });
    writeFileSync(articleOut, articleMarkdown, "utf-8");

    const assetNames: string[] = [];
    for (const asset of metadata.assets) {
      const buf = await readS3Buffer(config.s3Bucket, `${normalizedPrefix}/${asset.s3Name}`);
      if (sha256(buf) !== asset.sha256) {
        throw new Error(`Checksum mismatch for asset ${asset.s3Name} in artifact ${artifactId}`);
      }
      const out = safeTargetPath(workspaceRoot, asset.websiteRelativePath);
      assertAllowedTarget(asset.websiteRelativePath);
      mkdirSync(path.dirname(out), { recursive: true });
      writeFileSync(out, buf);
      assetNames.push(asset.s3Name);
    }

    await movePrefixToPublished(config.s3Bucket, config.s3Prefix, artifactId, assetNames);

    console.log(`Imported artifact ${artifactId} -> ${metadata.articlePath}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
