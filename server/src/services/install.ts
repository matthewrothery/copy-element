import { nanoid } from 'nanoid';
import { getDb } from '../db/connection.js';
import type { RegisterInstallBody } from '../types/index.js';
import { backfillUserIdForInstall } from './capture.js';

const UUID_ULID_REGEX = /^([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[0-9a-zA-Z]{26})$/i;

export function isValidInstallId(install_id: string): boolean {
  return UUID_ULID_REGEX.test(install_id);
}

export function registerInstall(body: RegisterInstallBody): { install_id: string; install_secret: string } {
  const db = getDb();
  const now = Date.now();

  const existing = db.prepare('SELECT install_id, install_secret FROM installs WHERE install_id = ?').get(body.install_id) as { install_id: string; install_secret: string } | undefined;

  if (existing) {
    const install_secret = body.install_secret ?? existing.install_secret;
    db.prepare(
      `UPDATE installs SET last_seen_at = ?, install_secret = ?, extension_version = ?, chrome_version = ?, os_family = ?,
       screen_width = ?, screen_height = ?, locale = ?, timezone = ? WHERE install_id = ?`
    ).run(
      now,
      install_secret,
      body.extension_version ?? null,
      body.chrome_version ?? null,
      body.os_family ?? null,
      body.screen_width ?? null,
      body.screen_height ?? null,
      body.locale ?? null,
      body.timezone ?? null,
      body.install_id
    );
    return { install_id: existing.install_id, install_secret };
  }

  const install_secret = body.install_secret ?? nanoid(32);
  db.prepare(
    `INSERT INTO installs (install_id, install_secret, user_id, created_at, last_seen_at,
     extension_version, chrome_version, os_family, screen_width, screen_height, locale, timezone)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    body.install_id,
    install_secret,
    now,
    now,
    body.extension_version ?? null,
    body.chrome_version ?? null,
    body.os_family ?? null,
    body.screen_width ?? null,
    body.screen_height ?? null,
    body.locale ?? null,
    body.timezone ?? null
  );
  return { install_id: body.install_id, install_secret };
}

export function getInstallByInstallId(install_id: string): { install_id: string; user_id: string | null } | null {
  const db = getDb();
  const row = db.prepare('SELECT install_id, user_id FROM installs WHERE install_id = ?').get(install_id) as { install_id: string; user_id: string | null } | undefined;
  return row ?? null;
}

export function linkInstallToUser(install_id: string, user_id: string): boolean {
  const db = getDb();
  const result = db.prepare('UPDATE installs SET user_id = ? WHERE install_id = ?').run(user_id, install_id);
  if (result.changes > 0) {
    backfillUserIdForInstall(install_id, user_id);
  }
  return result.changes > 0;
}

export function unlinkInstall(install_id: string, user_id: string): boolean {
  const db = getDb();
  const result = db.prepare('UPDATE installs SET user_id = NULL WHERE install_id = ? AND user_id = ?').run(install_id, user_id);
  return result.changes > 0;
}

export function listInstallsByUserId(user_id: string): Array<{ install_id: string; created_at: number; last_seen_at: number; extension_version: string | null }> {
  const db = getDb();
  const rows = db.prepare(
    'SELECT install_id, created_at, last_seen_at, extension_version FROM installs WHERE user_id = ? ORDER BY last_seen_at DESC'
  ).all(user_id) as Array<{ install_id: string; created_at: number; last_seen_at: number; extension_version: string | null }>;
  return rows;
}
