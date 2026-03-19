import { readFileSync } from "fs";
import { join } from "path";

export type ChangelogSection = {
  type: string;
  items: string[];
};

export type ChangelogEntry = {
  version: string;
  date: string;
  sections: ChangelogSection[];
};

export function parseChangelog(): ChangelogEntry[] {
  const filePath = join(process.cwd(), "content", "changelog.md");
  const raw = readFileSync(filePath, "utf-8");

  // Split on entry boundaries (## headings), drop empty leading segment
  const blocks = raw.split(/\n?^---\n?/m).flatMap((block) =>
    block.split(/(?=^## )/m)
  );

  const entries: ChangelogEntry[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed.startsWith("## ")) continue;

    const lines = trimmed.split("\n");
    const header = lines[0].replace(/^## /, "").trim();

    // Parse "v1.2.0 — March 15, 2026" or "v1.2.0 - March 15, 2026"
    const dashIndex = header.search(/\s[—–-]\s/);
    const version = dashIndex >= 0 ? header.slice(0, dashIndex).trim() : header;
    const date = dashIndex >= 0 ? header.slice(dashIndex).replace(/^[\s—–-]+/, "").trim() : "";

    const body = lines.slice(1).join("\n");
    const sectionBlocks = body.split(/(?=^### )/m);
    const sections: ChangelogSection[] = [];

    for (const sBlock of sectionBlocks) {
      const sLines = sBlock.trim().split("\n");
      if (!sLines[0].startsWith("### ")) continue;

      const type = sLines[0].replace(/^### /, "").trim();
      const items = sLines
        .slice(1)
        .map((l) => l.replace(/^[-*]\s+/, "").trim())
        .filter((l) => l.length > 0);

      if (items.length > 0) {
        sections.push({ type, items });
      }
    }

    if (sections.length > 0 || version) {
      entries.push({ version, date, sections });
    }
  }

  return entries;
}
