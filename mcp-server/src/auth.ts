import { createHash } from 'node:crypto';
import { apiPost } from './client/api-client.js';
import type { McpUser } from './types.js';

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

interface AuthResponse {
  userId: string;
  planCode: McpUser['planCode'];
  callCount: number;
  limitReached: boolean;
}

/**
 * Validate a raw user code from the URL path.
 * Hashes it locally — raw code never leaves this process.
 * Returns McpUser or null.
 */
export async function validateUserCode(rawCode: string): Promise<McpUser | null> {
  const tokenHash = hashCode(rawCode);
  try {
    const data = await apiPost<AuthResponse>('/internal/mcp/auth', { token_hash: tokenHash });
    return {
      userId: data.userId,
      planCode: data.planCode,
      callCount: data.callCount,
      limitReached: data.limitReached,
    };
  } catch {
    return null;
  }
}
