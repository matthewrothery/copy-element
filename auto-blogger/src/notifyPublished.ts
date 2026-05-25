import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { loadConfig } from "./config.js";
import { sendPublishedNotification } from "./email.js";
import type { ImportManifest } from "./importFromS3.js";

async function main(): Promise<void> {
  const to = process.env.AUTO_BLOG_NOTIFY_TO;
  const from = process.env.AUTO_BLOG_NOTIFY_FROM;
  if (!to || !from) {
    console.log("[notify-published] AUTO_BLOG_NOTIFY_TO or AUTO_BLOG_NOTIFY_FROM not set — skipping.");
    return;
  }

  const siteUrl = (process.env.AUTO_BLOG_SITE_URL ?? "https://elementarmory.com").replace(/\/$/, "");
  const config = loadConfig();
  const manifestPath = path.resolve(config.packageRoot, "dist/import-manifest.json");

  let manifest: ImportManifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as ImportManifest;
  } catch (err) {
    console.warn(`[notify-published] Could not read manifest at ${manifestPath}: ${(err as Error).message}`);
    return;
  }

  if (manifest.artifacts.length === 0) {
    console.log("[notify-published] No artifacts in manifest — nothing to notify.");
    return;
  }

  const articles = manifest.artifacts.map((a) => ({ title: a.title, urlPath: a.urlPath }));

  try {
    await sendPublishedNotification({ to, from, articles, siteUrl });
    console.log(`[notify-published] Sent published notification for ${articles.length} article(s).`);
  } catch (err) {
    console.warn(`[notify-published] Email send failed (non-fatal): ${(err as Error).message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
