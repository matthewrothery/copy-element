import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const generatedDirs = ["out", ".next/server/app"]
  .map((dir) => join(root, dir))
  .filter((dir) => existsSync(dir));

const forbiddenPatterns = [
  {
    label: "example Element Armory domain",
    pattern: /elementarmory\.example/gi,
  },
  {
    label: "example Element Capture domain",
    pattern: /elementcapture\.example/gi,
  },
  {
    label: "unresolved source marker",
    pattern: /\{\{SRC:/g,
  },
  {
    label: "raw install placeholder",
    pattern: /\[Install Element Armory\]/g,
  },
];

const checkedExtensions = new Set([
  ".html",
  ".xml",
  ".txt",
  ".json",
  ".rsc",
  ".meta",
]);

function extensionOf(filePath) {
  const dot = filePath.lastIndexOf(".");
  return dot === -1 ? "" : filePath.slice(dot);
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      yield* walk(path);
      continue;
    }
    if (checkedExtensions.has(extensionOf(path))) {
      yield path;
    }
  }
}

if (generatedDirs.length === 0) {
  throw new Error("No generated Next.js output found to inspect.");
}

const failures = [];

for (const dir of generatedDirs) {
  for (const filePath of walk(dir)) {
    const content = readFileSync(filePath, "utf8");
    for (const { label, pattern } of forbiddenPatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(content)) {
        failures.push(`${relative(root, filePath)} contains ${label}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("Indexability guard failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Indexability guard passed.");
