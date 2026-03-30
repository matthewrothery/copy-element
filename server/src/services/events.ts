import { nanoid } from 'nanoid';
import { getDb } from '../db/connection.js';

export type EventType = 'user.created' | 'capture.created' | 'quota.reached';

export interface RecordEventInput {
  type: EventType;
  userId?: string | null;
  installId?: string | null;
  payload?: Record<string, unknown>;
}

export function recordEvent(input: RecordEventInput): void {
  try {
    const db = getDb();
    db.prepare(
      `INSERT INTO events (id, type, user_id, install_id, payload_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      nanoid(),
      input.type,
      input.userId ?? null,
      input.installId ?? null,
      input.payload ? JSON.stringify(input.payload) : null,
      Date.now()
    );
  } catch (err) {
    console.warn('[events] Failed to record event:', input.type, err);
  }
}

/**
 * Returns true if an event of the given type was already recorded this calendar
 * month for the given user or install. Used to deduplicate quota.reached emails.
 */
export function wasEventFiredThisMonth(
  type: EventType,
  userId?: string | null,
  installId?: string | null
): boolean {
  const db = getDb();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  if (userId) {
    const row = db
      .prepare('SELECT id FROM events WHERE type = ? AND user_id = ? AND created_at >= ? LIMIT 1')
      .get(type, userId, monthStart);
    return row !== undefined;
  }
  if (installId) {
    const row = db
      .prepare('SELECT id FROM events WHERE type = ? AND install_id = ? AND created_at >= ? LIMIT 1')
      .get(type, installId, monthStart);
    return row !== undefined;
  }
  return false;
}

/**
 * Returns true if an event of the given type was ever recorded for the given user or install.
 */
export function wasEventFiredEver(
  type: EventType,
  userId?: string | null,
  installId?: string | null
): boolean {
  const db = getDb();
  if (userId) {
    const row = db
      .prepare('SELECT id FROM events WHERE type = ? AND user_id = ? LIMIT 1')
      .get(type, userId);
    return row !== undefined;
  }
  if (installId) {
    const row = db
      .prepare('SELECT id FROM events WHERE type = ? AND install_id = ? LIMIT 1')
      .get(type, installId);
    return row !== undefined;
  }
  return false;
}

/**
 * Look up a user's email address from the Better Auth user table.
 */
export function getUserEmail(userId: string): string | null {
  const db = getDb();
  const row = db
    .prepare('SELECT email FROM "user" WHERE id = ?')
    .get(userId) as { email: string } | undefined;
  return row?.email ?? null;
}
