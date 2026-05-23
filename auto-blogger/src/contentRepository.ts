import type { InternalLinkCandidate } from "./types.js";

/**
 * Source of "what already exists on the website". Two implementations:
 *
 * - `contentRepositoryFilesystem.ts` — walks `<websiteRoot>/content/topics`
 *   and `<websiteRoot>/content/blog`. Used for local dev when the website
 *   repo is checked out alongside.
 *
 * - `contentRepositoryS3Manifest.ts` — fetches a JSON manifest from S3,
 *   published by the website CI on each deploy. Used by the Lambda where
 *   the website filesystem is not available.
 */
export interface ContentRepository {
  loadCandidates(): Promise<InternalLinkCandidate[]>;
  /** Returns `listKeywordId` values from frontmatter of existing topic articles. */
  loadPublishedKeywordIds(): Promise<Set<string>>;
  /** Returns slugs already used in `content/blog`. */
  loadExistingBlogSlugs(): Promise<Set<string>>;
}
