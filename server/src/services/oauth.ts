import { createHash } from 'node:crypto';
import { nanoid } from 'nanoid';
import { SignJWT, jwtVerify } from 'jose';
import { getDb } from '../db/connection.js';
import { config } from '../config/index.js';
import { getUserEntitlement } from './entitlements.js';

const AUTH_CODE_TTL_MS = 5 * 60 * 1000;
const ACCESS_TOKEN_TTL_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export type PlanCode = 'free' | 'pro' | 'team';

export interface OAuthJwtPayload {
  userId: string;
  planCode: PlanCode;
  scope: string;
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function jwtKey(): Uint8Array {
  return new TextEncoder().encode(config.JWT_SECRET);
}

// Must match the issuer advertised in oauth.ts's /.well-known/oauth-authorization-server
// (the plain origin — those OAuth endpoints are mounted at the app root, not under
// BETTER_AUTH_URL's /api/auth path).
function jwtIssuer(): string {
  return config.FRONTEND_URL || config.BETTER_AUTH_URL;
}

export async function issueJwt(userId: string, planCode: PlanCode, scope: string): Promise<string> {
  return new SignJWT({ plan: planCode, scope })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(jwtIssuer())
    .setAudience(config.MCP_SERVER_URL)
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + ACCESS_TOKEN_TTL_MS) / 1000))
    .sign(jwtKey());
}

export async function validateJwt(token: string): Promise<OAuthJwtPayload> {
  const { payload } = await jwtVerify(token, jwtKey(), {
    issuer: jwtIssuer(),
    audience: config.MCP_SERVER_URL,
  });
  return {
    userId: payload.sub as string,
    planCode: (payload['plan'] as PlanCode) ?? 'free',
    scope: (payload['scope'] as string) ?? 'mcp:tools',
  };
}

export function registerClient(name: string, redirectUris: string[]): string {
  const db = getDb();
  const clientId = nanoid(32);
  db.prepare(
    'INSERT INTO oauth_clients (client_id, client_name, redirect_uris, created_at) VALUES (?, ?, ?, ?)'
  ).run(clientId, name ?? null, JSON.stringify(redirectUris), Date.now());
  return clientId;
}

export function getClient(clientId: string): { client_id: string; redirect_uris: string[] } | null {
  const db = getDb();
  const row = db
    .prepare('SELECT client_id, redirect_uris FROM oauth_clients WHERE client_id = ?')
    .get(clientId) as { client_id: string; redirect_uris: string } | undefined;
  if (!row) return null;
  return {
    client_id: row.client_id,
    redirect_uris: JSON.parse(row.redirect_uris) as string[],
  };
}

export function createAuthCode(
  clientId: string,
  userId: string,
  scope: string,
  pkceChallenge: string,
  redirectUri: string
): string {
  const db = getDb();
  const code = nanoid(32);
  const now = Date.now();
  db.prepare(
    `INSERT INTO oauth_auth_codes
     (code_hash, client_id, user_id, scope, pkce_challenge, pkce_method, redirect_uri, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(hash(code), clientId, userId, scope, pkceChallenge, 'S256', redirectUri, now, now + AUTH_CODE_TTL_MS);
  return code;
}

function verifyPkceS256(verifier: string, challenge: string): boolean {
  const computed = createHash('sha256')
    .update(verifier)
    .digest('base64url');
  return computed === challenge;
}

export async function exchangeAuthCode(
  code: string,
  clientId: string,
  codeVerifier: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; scope: string } | null> {
  const db = getDb();
  const codeHash = hash(code);
  const now = Date.now();

  const row = db
    .prepare(
      `SELECT code_hash, client_id, user_id, scope, pkce_challenge, redirect_uri, expires_at, used_at
       FROM oauth_auth_codes WHERE code_hash = ?`
    )
    .get(codeHash) as {
    code_hash: string;
    client_id: string;
    user_id: string;
    scope: string;
    pkce_challenge: string;
    redirect_uri: string;
    expires_at: number;
    used_at: number | null;
  } | undefined;

  if (!row) return null;
  if (row.client_id !== clientId) return null;
  if (row.redirect_uri !== redirectUri) return null;
  if (row.expires_at < now) return null;
  if (row.used_at !== null) return null;
  if (!verifyPkceS256(codeVerifier, row.pkce_challenge)) return null;

  db.prepare('UPDATE oauth_auth_codes SET used_at = ? WHERE code_hash = ?').run(now, codeHash);

  const entitlement = getUserEntitlement(row.user_id);
  const planCode = (entitlement.plan_code as PlanCode) ?? 'free';
  const accessToken = await issueJwt(row.user_id, planCode, row.scope);
  const refreshToken = await issueRefreshToken(clientId, row.user_id, row.scope);

  return { accessToken, refreshToken, expiresIn: ACCESS_TOKEN_TTL_MS / 1000, scope: row.scope };
}

async function issueRefreshToken(clientId: string, userId: string, scope: string): Promise<string> {
  const db = getDb();
  const token = nanoid(48);
  const now = Date.now();
  db.prepare(
    `INSERT INTO oauth_refresh_tokens (token_hash, client_id, user_id, scope, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(hash(token), clientId, userId, scope, now, now + REFRESH_TOKEN_TTL_MS);
  return token;
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string
): Promise<{ accessToken: string; refreshToken: string; expiresIn: number; scope: string } | null> {
  const db = getDb();
  const tokenHash = hash(refreshToken);
  const now = Date.now();

  const row = db
    .prepare(
      `SELECT token_hash, client_id, user_id, scope, expires_at, revoked_at
       FROM oauth_refresh_tokens WHERE token_hash = ?`
    )
    .get(tokenHash) as {
    token_hash: string;
    client_id: string;
    user_id: string;
    scope: string;
    expires_at: number;
    revoked_at: number | null;
  } | undefined;

  if (!row) return null;
  if (row.client_id !== clientId) return null;
  if (row.expires_at < now) return null;
  if (row.revoked_at !== null) return null;

  db.prepare('UPDATE oauth_refresh_tokens SET revoked_at = ? WHERE token_hash = ?').run(now, tokenHash);

  const entitlement = getUserEntitlement(row.user_id);
  const planCode = (entitlement.plan_code as PlanCode) ?? 'free';
  const accessToken = await issueJwt(row.user_id, planCode, row.scope);
  const newRefreshToken = await issueRefreshToken(clientId, row.user_id, row.scope);

  return { accessToken, refreshToken: newRefreshToken, expiresIn: ACCESS_TOKEN_TTL_MS / 1000, scope: row.scope };
}

export function revokeRefreshToken(refreshToken: string): void {
  const db = getDb();
  db.prepare('UPDATE oauth_refresh_tokens SET revoked_at = ? WHERE token_hash = ?').run(
    Date.now(),
    hash(refreshToken)
  );
}
