import { existsSync, readdirSync } from "fs";
import path from "path";
import { loadInternalLinkCandidates } from "./internalLinks.js";
import { loadPublishedListKeywordIds } from "./topics.js";
import type { ContentRepository } from "./contentRepository.js";
import type { InternalLinkCandidate } from "./types.js";

export class FilesystemContentRepository implements ContentRepository {
  constructor(private readonly websiteRoot: string) {}

  async loadCandidates(): Promise<InternalLinkCandidate[]> {
    return loadInternalLinkCandidates(this.websiteRoot);
  }

  async loadPublishedKeywordIds(): Promise<Set<string>> {
    return loadPublishedListKeywordIds(this.websiteRoot);
  }

  async loadExistingBlogSlugs(): Promise<Set<string>> {
    const blogRoot = path.resolve(this.websiteRoot, "content", "blog");
    if (!existsSync(blogRoot)) return new Set();
    return new Set(
      readdirSync(blogRoot)
        .filter((file) => file.endsWith(".md"))
        .map((file) => path.parse(file).name)
    );
  }
}
