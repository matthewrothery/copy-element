import { getDb } from '../db/connection.js';

export type AssetKind = 'screenshot' | 'html' | 'stylesheet';

export interface CaptureAssetInput {
  asset_kind: AssetKind;
  object_key: string;
  storage_provider?: string;
  public_url?: string | null;
  checksum_sha256?: string | null;
  content_type?: string | null;
  byte_size?: number | null;
}

export interface CreateCaptureInput {
  install_id: string;
  source_url: string;
  captured_at: number;
  created_by_install_id: string;
  status?: string;
  metadata_json?: string | null;
  assets: CaptureAssetInput[];
}

export interface CaptureRow {
  id: number;
  install_id: string;
  user_id: string | null;
  source_url: string | null;
  captured_at: number;
  created_by_install_id: string;
  status: string;
  metadata_json: string | null;
  created_at: number;
  updated_at: number;
}

export interface CaptureWithAssets extends CaptureRow {
  assets: Array<{
    id: number;
    asset_kind: string;
    object_key: string;
    content_type: string | null;
    byte_size: number | null;
  }>;
}

const DEFAULT_STATUS = 'ok';

/**
 * Create capture and its asset records in a transaction. Sets user_id from install's linked user when present.
 */
export function createCaptureWithAssets(input: CreateCaptureInput): CaptureRow {
  const db = getDb();
  const now = Date.now();
  const status = input.status ?? DEFAULT_STATUS;
  const install = db
    .prepare('SELECT user_id FROM installs WHERE install_id = ?')
    .get(input.install_id) as { user_id: string | null } | undefined;
  const userId = install?.user_id ?? null;

  const insertCapture = db.prepare(
    `INSERT INTO captures (install_id, user_id, source_url, captured_at, created_by_install_id, status, metadata_json, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertAsset = db.prepare(
    `INSERT INTO capture_assets (capture_id, asset_kind, storage_provider, object_key, public_url, checksum_sha256, content_type, byte_size, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const run = db.transaction(() => {
    const result = insertCapture.run(
      input.install_id,
      userId,
      input.source_url ?? null,
      input.captured_at,
      input.created_by_install_id,
      status,
      input.metadata_json ?? null,
      now,
      now
    );
    const captureId = result.lastInsertRowid as number;
    const provider = 's3';
    for (const a of input.assets) {
      insertAsset.run(
        captureId,
        a.asset_kind,
        a.storage_provider ?? provider,
        a.object_key,
        a.public_url ?? null,
        a.checksum_sha256 ?? null,
        a.content_type ?? null,
        a.byte_size ?? null,
        now
      );
    }
    return getCaptureById(captureId);
  });

  return run();
}

function getCaptureById(id: number): CaptureRow {
  const db = getDb();
  const row = db.prepare('SELECT * FROM captures WHERE id = ?').get(id) as CaptureRow;
  if (!row) throw new Error('Capture not found');
  return row;
}

export interface ListCapturesOptions {
  limit?: number;
  cursor?: number; // captured_at epoch ms for cursor-based pagination
}

/**
 * List captures for an install, most recent first. Cursor is captured_at (exclusive).
 */
export function listCapturesByInstall(
  installId: string,
  options: ListCapturesOptions = {}
): CaptureWithAssets[] {
  const db = getDb();
  const limit = Math.min(options.limit ?? 50, 100);
  let sql = 'SELECT * FROM captures WHERE install_id = ?';
  const params: (string | number)[] = [installId];
  if (options.cursor) {
    sql += ' AND captured_at < ?';
    params.push(options.cursor);
  }
  sql += ' ORDER BY captured_at DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params) as CaptureRow[];
  return rows.map((r) => attachAssets(db, r));
}

/**
 * List captures for a user (across all linked installs). Uses denormalized user_id and linked installs.
 */
export function listCapturesByUser(
  userId: string,
  options: ListCapturesOptions = {}
): CaptureWithAssets[] {
  const db = getDb();
  const limit = Math.min(options.limit ?? 50, 100);
  let sql = 'SELECT * FROM captures WHERE user_id = ?';
  const params: (string | number)[] = [userId];
  if (options.cursor) {
    sql += ' AND captured_at < ?';
    params.push(options.cursor);
  }
  sql += ' ORDER BY captured_at DESC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params) as CaptureRow[];
  return rows.map((r) => attachAssets(db, r));
}

/**
 * When an install is linked to a user, backfill user_id on its captures so list-by-user includes them.
 */
export function backfillUserIdForInstall(installId: string, userId: string): number {
  const db = getDb();
  const result = db.prepare('UPDATE captures SET user_id = ?, updated_at = ? WHERE install_id = ? AND user_id IS NULL').run(userId, Date.now(), installId);
  return result.changes;
}

/**
 * Count captures for a given install. Used for guest FIFO enforcement.
 */
export function countCapturesByInstall(installId: string): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM captures WHERE install_id = ?').get(installId) as { count: number };
  return row.count;
}

/**
 * Delete the oldest capture (by captured_at) for a given install, including its assets.
 */
export function deleteOldestCaptureForInstall(installId: string): void {
  const db = getDb();
  const oldest = db.prepare('SELECT id FROM captures WHERE install_id = ? ORDER BY captured_at ASC LIMIT 1').get(installId) as { id: number } | undefined;
  if (!oldest) return;
  db.transaction(() => {
    db.prepare('DELETE FROM capture_assets WHERE capture_id = ?').run(oldest.id);
    db.prepare('DELETE FROM captures WHERE id = ?').run(oldest.id);
  })();
}

/**
 * Count captures for a given user (across all linked installs).
 */
export function countCapturesByUser(userId: string): number {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM captures WHERE user_id = ?').get(userId) as { count: number };
  return row.count;
}

/**
 * Delete the oldest capture (by captured_at) for a given user, including its assets.
 */
export function deleteOldestCaptureByUser(userId: string): void {
  const db = getDb();
  const oldest = db.prepare('SELECT id FROM captures WHERE user_id = ? ORDER BY captured_at ASC LIMIT 1').get(userId) as { id: number } | undefined;
  if (!oldest) return;
  db.transaction(() => {
    db.prepare('DELETE FROM capture_assets WHERE capture_id = ?').run(oldest.id);
    db.prepare('DELETE FROM captures WHERE id = ?').run(oldest.id);
  })();
}

function attachAssets(db: ReturnType<typeof getDb>, capture: CaptureRow): CaptureWithAssets {
  const assets = db
    .prepare(
      'SELECT id, asset_kind, object_key, content_type, byte_size FROM capture_assets WHERE capture_id = ?'
    )
    .all(capture.id) as Array<{ id: number; asset_kind: string; object_key: string; content_type: string | null; byte_size: number | null }>;
  return { ...capture, assets };
}
