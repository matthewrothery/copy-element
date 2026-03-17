import { createHash, randomBytes } from 'node:crypto';
import { nanoid } from 'nanoid';
import { getDb } from '../db/connection.js';
import { getInstallByInstallId } from './install.js';

const CODE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createExtensionCode(user_id: string, install_id: string): string {
  const db = getDb();
  const code = nanoid(32);
  const now = Date.now();
  const expires_at = now + CODE_TTL_MS;
  db.prepare(
    'INSERT INTO extension_codes (code, user_id, install_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(code, user_id, install_id, expires_at, now);
  return code;
}

export interface ExchangeResult {
  token: string;
  expires_at: number;
}

export function exchangeCodeForToken(
  code: string,
  install_id: string,
  install_secret: string
): ExchangeResult | null {
  const db = getDb();
  const row = db.prepare(
    'SELECT user_id, install_id FROM extension_codes WHERE code = ? AND expires_at > ?'
  ).get(code, Date.now()) as { user_id: string; install_id: string } | undefined;
  if (!row) return null;
  if (row.install_id !== install_id) return null;

  const install = getInstallByInstallId(install_id);
  if (!install || install.user_id !== row.user_id) return null;

  const secretRow = db.prepare('SELECT install_secret FROM installs WHERE install_id = ?').get(install_id) as { install_secret: string } | undefined;
  if (!secretRow || secretRow.install_secret !== install_secret) return null;

  db.prepare('DELETE FROM extension_codes WHERE code = ?').run(code);

  const token = nanoid(32);
  const token_hash = hashToken(token);
  const id = nanoid();
  const now = Date.now();
  const expires_at = now + SESSION_TTL_MS;
  db.prepare(
    'INSERT INTO extension_sessions (id, user_id, install_id, token_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, row.user_id, install_id, token_hash, now, expires_at);

  return { token, expires_at };
}

export function refreshExtensionToken(currentToken: string): ExchangeResult | null {
  const db = getDb();
  const hash = hashToken(currentToken);
  const row = db.prepare(
    'SELECT id, user_id, install_id FROM extension_sessions WHERE token_hash = ? AND expires_at > ?'
  ).get(hash, Date.now()) as { id: string; user_id: string; install_id: string } | undefined;
  if (!row) return null;

  const newToken = nanoid(32);
  const newHash = hashToken(newToken);
  const expires_at = Date.now() + SESSION_TTL_MS;
  db.prepare('UPDATE extension_sessions SET token_hash = ?, expires_at = ? WHERE id = ?').run(newHash, expires_at, row.id);
  return { token: newToken, expires_at };
}

export function revokeExtensionToken(token: string): boolean {
  const db = getDb();
  const hash = hashToken(token);
  const result = db.prepare('DELETE FROM extension_sessions WHERE token_hash = ?').run(hash);
  return result.changes > 0;
}

export interface InstallFromToken {
  install_id: string;
  user_id: string;
}

/** Returns install_id and user_id for a valid extension token, or null if invalid/expired. */
export function getInstallFromToken(token: string): InstallFromToken | null {
  const db = getDb();
  const hash = hashToken(token);
  const row = db
    .prepare('SELECT install_id, user_id FROM extension_sessions WHERE token_hash = ? AND expires_at > ?')
    .get(hash, Date.now()) as { install_id: string; user_id: string } | undefined;
  return row ?? null;
}
