#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const rootDir = path.resolve(fileURLToPath(import.meta.url), "../..");
const packageJsonPath = path.join(rootDir, "package.json");
const manifestPaths = [
  path.join(rootDir, "extension/manifest.ts"),
  path.join(rootDir, "extension/prod.manifest.ts")
];

const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const previousVersion = packageJson.version;
const [major, minor, patch] = previousVersion.split(".").map(Number);
const nextVersion = `${major}.${minor}.${patch + 1}`;

packageJson.version = nextVersion;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

for (const manifestPath of manifestPaths) {
  const manifestSource = readFileSync(manifestPath, "utf-8");
  const updatedManifest = manifestSource.replace(
    /version:\s*"[^"]+"/,
    `version: "${nextVersion}"`
  );
  writeFileSync(manifestPath, updatedManifest);
}

console.log(`Patched version: ${previousVersion} -> ${nextVersion}`);
