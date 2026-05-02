import { apiPost } from './client/api-client.js';
import { McpLimitError } from './types.js';
import type { McpUser } from './types.js';

const FREE_MONTHLY_LIMIT = 10;

interface IncrementResponse {
  callCount: number;
}

/**
 * Consume quota units for a user. Throws McpLimitError if the limit is exceeded.
 * weight = 1 for regular tools, 5 for convertCapture.
 * Pro users are unlimited.
 */
export async function consumeCallQuota(user: McpUser, weight = 1): Promise<void> {
  if (user.planCode !== 'free') return;

  const data = await apiPost<IncrementResponse>(
    '/internal/mcp/usage/increment',
    { userId: user.userId, weight }
  );

  if (data.callCount > FREE_MONTHLY_LIMIT) {
    throw new McpLimitError();
  }
}
