import { beforeEach, describe, expect, it, vi } from 'vitest';
import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';

// We need to mock getDb before importing the service
const mockDb = new Database(':memory:');
mockDb.exec(`
  CREATE TABLE captures (
    id TEXT PRIMARY KEY,
    install_id TEXT NOT NULL,
    user_id TEXT,
    source_url TEXT,
    captured_at INTEGER NOT NULL,
    created_by_install_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ok',
    metadata_json TEXT,
    snippet_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE capture_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    capture_id TEXT NOT NULL,
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
  CREATE TABLE installs (
    install_id TEXT PRIMARY KEY,
    user_id TEXT
  );
`);

vi.mock('../db/connection.js', () => ({
  getDb: () => mockDb,
}));

// Import after mock setup
const {
  countCapturesByUser,
  countCapturesByInstallThisMonth,
  countCapturesByUserThisMonth,
  deleteOldestCaptureByUser,
  createCaptureWithAssets,
} = await import('./capture.js');

function insertCapture(userId: string | null, capturedAt: number, createdAt?: number, installId = 'install1'): string {
  const now = createdAt ?? Date.now();
  const id = nanoid();
  mockDb.prepare(
    `INSERT INTO captures (id, install_id, user_id, source_url, captured_at, created_by_install_id, status, created_at, updated_at)
     VALUES (?, ?, ?, 'http://example.com', ?, ?, 'ok', ?, ?)`
  ).run(id, installId, userId, capturedAt, installId, now, now);
  return id;
}

function insertAsset(captureId: string): void {
  mockDb.prepare(
    `INSERT INTO capture_assets (capture_id, asset_kind, object_key, created_at) VALUES (?, 'screenshot', 'key1', ?)`
  ).run(captureId, Date.now());
}

beforeEach(() => {
  mockDb.prepare('DELETE FROM capture_assets').run();
  mockDb.prepare('DELETE FROM captures').run();
  mockDb.prepare('DELETE FROM installs').run();
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

    const remaining = mockDb.prepare('SELECT id FROM captures WHERE user_id = ?').all('user-1') as { id: string }[];
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

describe('countCapturesByInstallThisMonth', () => {
  const thisMonthMs = new Date(new Date().getFullYear(), new Date().getMonth(), 15).getTime();
  const lastMonthMs = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15).getTime();

  it('returns 0 for install with no captures this month', () => {
    expect(countCapturesByInstallThisMonth('install-a')).toBe(0);
  });

  it('counts only captures created this month', () => {
    insertCapture(null, thisMonthMs, thisMonthMs, 'install-a');
    insertCapture(null, thisMonthMs, thisMonthMs, 'install-a');
    insertCapture(null, lastMonthMs, lastMonthMs, 'install-a');
    expect(countCapturesByInstallThisMonth('install-a')).toBe(2);
  });

  it('does not count other installs', () => {
    insertCapture(null, thisMonthMs, thisMonthMs, 'install-a');
    insertCapture(null, thisMonthMs, thisMonthMs, 'install-b');
    expect(countCapturesByInstallThisMonth('install-a')).toBe(1);
  });
});

describe('createCaptureWithAssets idempotency', () => {
  const baseInput = {
    install_id: 'install-idem',
    source_url: 'http://example.com',
    captured_at: 1000,
    created_by_install_id: 'install-idem',
    assets: [{ asset_kind: 'screenshot' as const, object_key: 'key1' }],
  };

  it('assigns a nanoid string id to new captures', () => {
    const capture = createCaptureWithAssets({ ...baseInput, snippet_id: 'snip-new' });
    expect(typeof capture.id).toBe('string');
    expect(capture.id.length).toBeGreaterThan(10);
  });

  it('returns the same row for duplicate (install_id, snippet_id)', () => {
    const first = createCaptureWithAssets({ ...baseInput, snippet_id: 'snip-1' });
    const second = createCaptureWithAssets({ ...baseInput, snippet_id: 'snip-1' });

    expect(second.id).toBe(first.id);
    const rows = mockDb.prepare('SELECT id FROM captures WHERE install_id = ? AND snippet_id = ?').all('install-idem', 'snip-1');
    expect(rows).toHaveLength(1);
  });

  it('inserts a new row when snippet_id is null', () => {
    const first = createCaptureWithAssets({ ...baseInput, snippet_id: null });
    const second = createCaptureWithAssets({ ...baseInput, snippet_id: null });

    expect(second.id).not.toBe(first.id);
    const rows = mockDb.prepare('SELECT id FROM captures WHERE install_id = ?').all('install-idem');
    expect(rows).toHaveLength(2);
  });

  it('inserts distinct rows for different snippet_id values', () => {
    const first = createCaptureWithAssets({ ...baseInput, snippet_id: 'snip-a' });
    const second = createCaptureWithAssets({ ...baseInput, snippet_id: 'snip-b' });

    expect(second.id).not.toBe(first.id);
  });
});

describe('countCapturesByUserThisMonth', () => {
  const thisMonthMs = new Date(new Date().getFullYear(), new Date().getMonth(), 15).getTime();
  const lastMonthMs = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 15).getTime();

  it('returns 0 for user with no captures this month', () => {
    expect(countCapturesByUserThisMonth('user-x')).toBe(0);
  });

  it('counts only captures created this month', () => {
    insertCapture('user-x', thisMonthMs, thisMonthMs);
    insertCapture('user-x', thisMonthMs, thisMonthMs);
    insertCapture('user-x', lastMonthMs, lastMonthMs);
    expect(countCapturesByUserThisMonth('user-x')).toBe(2);
  });

  it('does not count other users', () => {
    insertCapture('user-x', thisMonthMs, thisMonthMs);
    insertCapture('user-y', thisMonthMs, thisMonthMs);
    expect(countCapturesByUserThisMonth('user-x')).toBe(1);
  });
});
