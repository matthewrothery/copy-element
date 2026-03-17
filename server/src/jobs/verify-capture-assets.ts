/**
 * Placeholder job: verify capture assets exist in object storage and optionally validate checksums.
 * Run on a schedule (e.g. cron) or manually. Intended to detect orphaned DB references or missing objects.
 */

// import { getDb } from '../db/connection.js';
// import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
// import { config } from '../config/index.js';

export async function runVerifyCaptureAssets(): Promise<{ checked: number; missing: number }> {
  // TODO: list capture_assets, for each object_key HeadObject in S3; count missing.
  return { checked: 0, missing: 0 };
}
