/**
 * Placeholder job: remove S3 objects that were uploaded but never associated with a capture
 * (e.g. upload succeeded but POST /api/captures failed). Requires a convention for "pending" keys
 * and a grace period before deletion.
 */

// import { getDb } from '../db/connection.js';
// import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
// import { config } from '../config/index.js';

export async function runCleanupOrphanUploads(): Promise<{ deleted: number }> {
  // TODO: list objects under captures/*, compare to capture_assets.object_key, delete orphans older than grace period.
  return { deleted: 0 };
}
