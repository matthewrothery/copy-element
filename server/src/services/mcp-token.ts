import { createHash } from 'node:crypto';
import { nanoid } from 'nanoid';
import { getDb } from '../db/connection.js';

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export interface McpTokenMeta {
  exists: boolean;
  created_at: number | null;
  last_used_at: number | null;
}

/**
 * Generate (or regenerate) an MCP token for a user.
 * Uses INSERT OR REPLACE so rotating replaces the existing row.
 * Returns plaintext code — only time it is ever returned.
 */
export function generateMcpToken(userId: string): { code: string; mcpUrl: string } {
  const db = getDb();
  const code = nanoid(24);
  const tokenHash = hashCode(code);
  const now = Date.now();

  const existing = db
    .prepare('SELECT id FROM mcp_tokens WHERE user_id = ?')
    .get(userId) as { id: number } | undefined;

  if (existing) {
    db.prepare(
      'UPDATE mcp_tokens SET token_hash = ?, rotated_at = ? WHERE user_id = ?'
    ).run(tokenHash, now, userId);
  } else {
    db.prepare(
      'INSERT INTO mcp_tokens (user_id, token_hash, created_at) VALUES (?, ?, ?)'
    ).run(userId, tokenHash, now);
  }

  const mcpUrl = `https://mcp.elementarmory.com/u_${code}`;
  return { code, mcpUrl };
}

/**
 * Validate a raw MCP code. Hashes it locally, looks up in DB, updates last_used_at.
 * Returns userId or null.
 */
export function validateMcpToken(rawCode: string): { userId: string } | null {
  const db = getDb();
  const tokenHash = hashCode(rawCode);
  const row = db
    .prepare('SELECT user_id FROM mcp_tokens WHERE token_hash = ?')
    .get(tokenHash) as { user_id: string } | undefined;
  if (!row) return null;
  db.prepare('UPDATE mcp_tokens SET last_used_at = ? WHERE token_hash = ?').run(Date.now(), tokenHash);
  return { userId: row.user_id };
}

/**
 * Validate by pre-computed hash (used by /internal/mcp/auth — hash computed by MCP server).
 * Updates last_used_at.
 */
export function validateMcpTokenByHash(tokenHash: string): { userId: string } | null {
  const db = getDb();
  const row = db
    .prepare('SELECT user_id FROM mcp_tokens WHERE token_hash = ?')
    .get(tokenHash) as { user_id: string } | undefined;
  if (!row) return null;
  db.prepare('UPDATE mcp_tokens SET last_used_at = ? WHERE token_hash = ?').run(Date.now(), tokenHash);
  return { userId: row.user_id };
}

/**
 * Returns metadata only — never returns plaintext code.
 */
export function getMcpTokenMetaForUser(userId: string): McpTokenMeta {
  const db = getDb();
  const row = db
    .prepare('SELECT created_at, last_used_at FROM mcp_tokens WHERE user_id = ?')
    .get(userId) as { created_at: number; last_used_at: number | null } | undefined;
  if (!row) return { exists: false, created_at: null, last_used_at: null };
  return { exists: true, created_at: row.created_at, last_used_at: row.last_used_at };
}

/**
 * Full revocation — deletes the row.
 */
export function deleteMcpToken(userId: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM mcp_tokens WHERE user_id = ?').run(userId);
  return result.changes > 0;
}
