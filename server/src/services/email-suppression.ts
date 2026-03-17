import { getDb } from '../db/connection.js';

export function isEmailSuppressed(email: string): boolean {
  try {
    const db = getDb();
    const row = db.prepare('SELECT 1 FROM email_suppressions WHERE email = ?').get(email);
    return !!row;
  } catch {
    return false; // fail open — don't block sends on DB errors
  }
}

export function suppressEmail(email: string, reason?: string): void {
  try {
    const db = getDb();
    db.prepare(`
      INSERT OR REPLACE INTO email_suppressions (email, suppressed_at, reason)
      VALUES (?, ?, ?)
    `).run(email, Date.now(), reason ?? null);
  } catch {
    // fire-and-forget
  }
}
