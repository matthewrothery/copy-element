import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { loadConfig } from "./config.js";
import { movePrefixToPublished } from "./s3.js";
import type { ImportManifest } from "./importFromS3.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const manifestPath = path.resolve(config.packageRoot, "dist/import-manifest.json");

  let manifest: ImportManifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as ImportManifest;
  } catch (err) {
    console.error(`[mark-published] Failed to read manifest at ${manifestPath}: ${(err as Error).message}`);
    process.exit(1);
  }

  if (manifest.artifacts.length === 0) {
    console.log("[mark-published] No artifacts to mark as published.");
    return;
  }

  let failed = 0;
  for (const { artifactId, assetS3Names } of manifest.artifacts) {
    try {
      await movePrefixToPublished(manifest.bucket, manifest.prefix, artifactId, assetS3Names);
      console.log(`[mark-published] Moved ${artifactId} to published/`);
    } catch (err) {
      console.error(`[mark-published] Failed to move ${artifactId}: ${(err as Error).message}`);
      failed++;
    }
  }

  if (failed > 0) {
    console.error(`[mark-published] ${failed} artifact(s) failed to move. They remain in pending/ and will be retried on next import run.`);
    process.exit(1);
  }

  console.log(`[mark-published] All ${manifest.artifacts.length} artifact(s) moved to published/.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
