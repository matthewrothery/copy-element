import { listCapturesByUser, type CaptureWithAssets } from './capture.js';
import { getSignedGetUrl } from './s3.js';
import { getDb } from '../db/connection.js';

export interface CaptureAssetWithUrl {
  id: number;
  asset_kind: string;
  object_key: string;
  content_type: string | null;
  byte_size: number | null;
  signed_url: string;
}

export interface CaptureWithSignedAssets {
  id: string;
  user_id: string | null;
  source_url: string | null;
  captured_at: number;
  status: string;
  created_at: number;
  assets: CaptureAssetWithUrl[];
}

export interface ListCapturesOptions {
  limit?: number;
  cursor?: number;
}

/**
 * Get a single capture with presigned GET URLs for all assets.
 * Enforces ownership check.
 */
export async function getCaptureWithAssets(
  captureId: string,
  userId: string
): Promise<CaptureWithSignedAssets | null> {
  const db = getDb();

  const capture = db
    .prepare('SELECT * FROM captures WHERE id = ? AND user_id = ?')
    .get(captureId, userId) as
    | {
        id: string;
        user_id: string | null;
        source_url: string | null;
        captured_at: number;
        status: string;
        created_at: number;
      }
    | undefined;

  if (!capture) return null;

  const rawAssets = db
    .prepare(
      'SELECT id, asset_kind, object_key, content_type, byte_size FROM capture_assets WHERE capture_id = ?'
    )
    .all(captureId) as Array<{
    id: number;
    asset_kind: string;
    object_key: string;
    content_type: string | null;
    byte_size: number | null;
  }>;

  const assets: CaptureAssetWithUrl[] = await Promise.all(
    rawAssets.map(async (a) => ({
      ...a,
      signed_url: await getSignedGetUrl(a.object_key),
    }))
  );

  return {
    id: capture.id,
    user_id: capture.user_id,
    source_url: capture.source_url,
    captured_at: capture.captured_at,
    status: capture.status,
    created_at: capture.created_at,
    assets,
  };
}

/**
 * List captures for a user with metadata only (no signed URLs, no S3 fetch).
 */
export function listCapturesForUser(
  userId: string,
  options: ListCapturesOptions = {}
): CaptureWithAssets[] {
  return listCapturesByUser(userId, options);
}
