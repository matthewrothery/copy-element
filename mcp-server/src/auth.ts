import { jwtVerify } from 'jose';
import { config } from './config.js';
import type { McpUser } from './types.js';

function jwtKey(): Uint8Array {
  return new TextEncoder().encode(config.JWT_SECRET);
}

export async function validateJwt(token: string): Promise<McpUser | null> {
  try {
    const { payload } = await jwtVerify(token, jwtKey(), {
      issuer: config.MAIN_SERVER_ISSUER,
      audience: config.MCP_SERVER_URL,
    });
    const userId = payload.sub;
    if (!userId) return null;
    return {
      userId,
      planCode: (payload['plan'] as McpUser['planCode']) ?? 'free',
    };
  } catch {
    return null;
  }
}
