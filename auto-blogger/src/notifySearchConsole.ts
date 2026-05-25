import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { loadConfig } from "./config.js";
import { createAuth, submitSitemap, requestIndexing } from "./googleSearchConsole.js";
import type { ImportManifest } from "./importFromS3.js";

async function main(): Promise<void> {
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  const autoSiteUrl = (process.env.AUTO_BLOG_SITE_URL ?? "https://elementarmory.com").replace(/\/$/, "");

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!siteUrl) {
    console.log("[notify-gsc] GOOGLE_SEARCH_CONSOLE_SITE_URL not set — skipping.");
    return;
  }

  let credentials: string;
  if (credentialsJson) {
    credentials = credentialsJson;
  } else if (credentialsPath) {
    try {
      credentials = readFileSync(credentialsPath, "utf-8");
    } catch (err) {
      console.warn(`[notify-gsc] Could not read credentials file at ${credentialsPath}: ${(err as Error).message}`);
      return;
    }
  } else {
    console.log("[notify-gsc] No Google credentials found (GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS) — skipping.");
    return;
  }

  const config = loadConfig();
  const manifestPath = path.resolve(config.packageRoot, "dist/import-manifest.json");

  let manifest: ImportManifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as ImportManifest;
  } catch (err) {
    console.warn(`[notify-gsc] Could not read manifest at ${manifestPath}: ${(err as Error).message}`);
    return;
  }

  if (manifest.artifacts.length === 0) {
    console.log("[notify-gsc] No artifacts in manifest — nothing to submit.");
    return;
  }

  let auth;
  try {
    auth = createAuth(credentials);
  } catch (err) {
    console.warn(`[notify-gsc] Failed to create auth client: ${(err as Error).message}`);
    return;
  }

  // Submit sitemap
  const sitemapUrl = `${autoSiteUrl}/sitemap.xml`;
  try {
    await submitSitemap(siteUrl, sitemapUrl, auth);
  } catch (err) {
    console.warn(`[notify-gsc] Sitemap submission failed (non-fatal): ${(err as Error).message}`);
  }

  // Request indexing for each published article URL
  const urls = manifest.artifacts.map((a) => `${autoSiteUrl}${a.urlPath}`);
  try {
    await requestIndexing(urls, auth);
  } catch (err) {
    console.warn(`[notify-gsc] Indexing request failed (non-fatal): ${(err as Error).message}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
