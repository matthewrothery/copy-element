import { createHash } from 'node:crypto';
import { nanoid } from 'nanoid';
import { getDb } from '../db/connection.js';

const PENDING_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Create a pending Figma auth session. The plugin calls this before opening the browser. */
export function createFigmaSession(sessionId: string): void {
  const db = getDb();
  const now = Date.now();
  db.prepare('DELETE FROM figma_sessions WHERE expires_at < ?').run(now);
  db.prepare(
    'INSERT INTO figma_sessions (session_id, status, created_at, expires_at) VALUES (?, ?, ?, ?)'
  ).run(sessionId, 'pending', now, now + PENDING_TTL_MS);
}

export interface CompleteFigmaSessionResult {
  expires_at: number;
}

/**
 * Called by the website once the user is authenticated.
 * Generates a token, stores the raw token (for plugin to poll) and its hash (for auth middleware).
 */
export function completeFigmaSession(
  sessionId: string,
  userId: string
): CompleteFigmaSessionResult | null {
  const db = getDb();
  const row = db
    .prepare('SELECT status FROM figma_sessions WHERE session_id = ? AND expires_at > ?')
    .get(sessionId, Date.now()) as { status: string } | undefined;
  if (!row || row.status !== 'pending') return null;

  const token = nanoid(48);
  const tokenHash = hashToken(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;

  db.prepare(
    'UPDATE figma_sessions SET user_id = ?, token = ?, token_hash = ?, status = ?, expires_at = ? WHERE session_id = ?'
  ).run(userId, token, tokenHash, 'complete', expiresAt, sessionId);

  return { expires_at: expiresAt };
}

export interface PollFigmaSessionResult {
  status: 'pending' | 'complete';
  token?: string;
}

/**
 * Plugin polls this to discover when auth is complete and retrieve the token.
 * Returns the raw token while the session is valid and complete.
 * Once the plugin has stored the token, it uses it as a Bearer credential; polling stops.
 */
export function pollFigmaSession(sessionId: string): PollFigmaSessionResult | null {
  const db = getDb();
  const row = db
    .prepare('SELECT status, token FROM figma_sessions WHERE session_id = ? AND expires_at > ?')
    .get(sessionId, Date.now()) as { status: string; token: string | null } | undefined;
  if (!row) return null;
  if (row.status === 'complete' && row.token) {
    return { status: 'complete', token: row.token };
  }
  return { status: 'pending' };
}

/** Returns user_id for a valid Figma Bearer token, or null if invalid/expired. */
export function getFigmaSessionUser(token: string): string | null {
  const db = getDb();
  const hash = hashToken(token);
  const row = db
    .prepare('SELECT user_id FROM figma_sessions WHERE token_hash = ? AND status = ? AND expires_at > ?')
    .get(hash, 'complete', Date.now()) as { user_id: string } | undefined;
  return row?.user_id ?? null;
}
