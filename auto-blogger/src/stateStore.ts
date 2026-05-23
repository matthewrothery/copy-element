/**
 * Persistent state for the auto-blogger. Two implementations:
 *
 * - `stateStoreFilesystem.ts` — single JSON file. Used for local dev and the
 *   legacy EC2 path. Read-modify-write is non-atomic; safe only when one
 *   process runs at a time.
 *
 * - `stateStoreDynamoDb.ts` — DynamoDB with conditional writes. Atomic
 *   keyword claiming across parallel pipelines inside one Lambda. Default
 *   for production.
 */
export interface StateStore {
  /**
   * Attempts to atomically claim the given keyword id. Returns `true` on
   * first claim, `false` if the id is already claimed.
   */
  claimKeyword(id: string, requestId: string): Promise<boolean>;
  /**
   * Records that a slug was published. Returns `true` on first record,
   * `false` if the slug already exists.
   */
  recordSlug(slug: string): Promise<boolean>;
  /** Loads the full set of previously-claimed keyword ids (paginated under the hood). */
  loadProcessedKeywordIds(): Promise<Set<string>>;
  /** Loads the full set of previously-published slugs. */
  loadProcessedSlugs(): Promise<Set<string>>;
  /** Records an email-notification failure for a specific artifact. */
  recordEmailFailure(artifactId: string): Promise<void>;
  /** Records the last successful run timestamp (epoch ms). */
  recordRun(timestamp: number): Promise<void>;
}
