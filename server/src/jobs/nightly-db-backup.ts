/**
 * Placeholder job: nightly DB backup to S3 (or other object storage).
 * Optional in Phase 4; run on a schedule when enabled.
 */

// import { getDb } from '../db/connection.js';
// import { config } from '../config/index.js';

export async function runNightlyDbBackup(): Promise<{ success: boolean; key?: string }> {
  // TODO: copy DATABASE_PATH file to S3 with a dated key.
  return { success: false };
}
