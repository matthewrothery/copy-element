import { beforeEach, describe, expect, it, vi } from 'vitest';
import Database from 'better-sqlite3';

// We need to mock getDb before importing the service
const mockDb = new Database(':memory:');
mockDb.exec(`
  CREATE TABLE captures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    install_id TEXT NOT NULL,
    user_id TEXT,
    source_url TEXT,
    captured_at INTEGER NOT NULL,
    created_by_install_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ok',
    metadata_json TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE capture_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    capture_id INTEGER NOT NULL,
    asset_kind TEXT NOT NULL,
    storage_provider TEXT NOT NULL DEFAULT 's3',
    object_key TEXT NOT NULL,
    public_url TEXT,
    checksum_sha256 TEXT,
    content_type TEXT,
    byte_size INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (capture_id) REFERENCES captures(id)
  );
`);

vi.mock('../db/connection.js', () => ({
  getDb: () => mockDb,
}));

// Import after mock setup
const { countCapturesByUser, deleteOldestCaptureByUser } = await import('./capture.js');

function insertCapture(userId: string | null, capturedAt: number): number {
  const now = Date.now();
  const result = mockDb.prepare(
    `INSERT INTO captures (install_id, user_id, source_url, captured_at, created_by_install_id, status, created_at, updated_at)
     VALUES ('install1', ?, 'http://example.com', ?, 'install1', 'ok', ?, ?)`
  ).run(userId, capturedAt, now, now);
  return result.lastInsertRowid as number;
}

function insertAsset(captureId: number): void {
  mockDb.prepare(
    `INSERT INTO capture_assets (capture_id, asset_kind, object_key, created_at) VALUES (?, 'screenshot', 'key1', ?)`
  ).run(captureId, Date.now());
}

beforeEach(() => {
  mockDb.prepare('DELETE FROM capture_assets').run();
  mockDb.prepare('DELETE FROM captures').run();
});

describe('countCapturesByUser', () => {
  it('returns 0 for user with no captures', () => {
    expect(countCapturesByUser('user-1')).toBe(0);
  });

  it('returns correct count for user captures', () => {
    insertCapture('user-1', Date.now());
    insertCapture('user-1', Date.now() + 1);
    insertCapture('user-2', Date.now() + 2);
    expect(countCapturesByUser('user-1')).toBe(2);
    expect(countCapturesByUser('user-2')).toBe(1);
  });

  it('does not count captures for other users', () => {
    insertCapture('user-1', Date.now());
    expect(countCapturesByUser('user-other')).toBe(0);
  });
});

describe('deleteOldestCaptureByUser', () => {
  it('does nothing when user has no captures', () => {
    expect(() => deleteOldestCaptureByUser('user-1')).not.toThrow();
  });

  it('deletes the oldest capture by captured_at', () => {
    const old = insertCapture('user-1', 1000);
    const newer = insertCapture('user-1', 2000);

    deleteOldestCaptureByUser('user-1');

    const remaining = mockDb.prepare('SELECT id FROM captures WHERE user_id = ?').all('user-1') as { id: number }[];
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(newer);
    const deleted = mockDb.prepare('SELECT id FROM captures WHERE id = ?').get(old);
    expect(deleted).toBeUndefined();
  });

  it('cascade-deletes associated assets', () => {
    const captureId = insertCapture('user-1', 1000);
    insertAsset(captureId);
    insertCapture('user-1', 2000);

    const assetsBefore = mockDb.prepare('SELECT id FROM capture_assets WHERE capture_id = ?').all(captureId);
    expect(assetsBefore).toHaveLength(1);

    deleteOldestCaptureByUser('user-1');

    const assetsAfter = mockDb.prepare('SELECT id FROM capture_assets WHERE capture_id = ?').all(captureId);
    expect(assetsAfter).toHaveLength(0);
  });

  it('only deletes the single oldest, not all', () => {
    insertCapture('user-1', 1000);
    insertCapture('user-1', 2000);
    insertCapture('user-1', 3000);

    deleteOldestCaptureByUser('user-1');
    expect(countCapturesByUser('user-1')).toBe(2);
  });
});
