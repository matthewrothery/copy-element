import { nanoid } from 'nanoid';
import { getDb } from '../db/connection.js';
import { config } from '../config/index.js';

export function ensureAdminUser(userId: string): void {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM admin_users WHERE user_id = ?').get(userId);
  if (!existing) {
    db.prepare('INSERT INTO admin_users (id, user_id, created_at) VALUES (?, ?, ?)').run(nanoid(), userId, Date.now());
  }
}

export function seedAdminsFromConfig(): void {
  if (config.ADMIN_EMAILS.length === 0) return;
  const db = getDb();
  for (const email of config.ADMIN_EMAILS) {
    const user = db.prepare('SELECT id FROM "user" WHERE lower(email) = ?').get(email) as { id: string } | undefined;
    if (!user) continue; // user hasn't signed up yet — hook will catch them later
    ensureAdminUser(user.id);
  }
}
