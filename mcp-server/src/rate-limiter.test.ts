import { beforeEach, describe, expect, it, vi } from 'vitest';
import { McpLimitError } from './types.js';
import type { McpUser } from './types.js';

// Mock the api-client before importing rate-limiter
let mockCallCount = 0;
vi.mock('./client/api-client.js', () => ({
  apiPost: vi.fn(async (_path: string, body: { userId: string; weight: number }) => {
    mockCallCount += body.weight;
    return { callCount: mockCallCount };
  }),
}));

const { consumeCallQuota } = await import('./rate-limiter.js');

function makeFreeUser(callCount = 0, limitReached = false): McpUser {
  return { userId: 'user-free', planCode: 'free', callCount, limitReached };
}

function makeProUser(): McpUser {
  return { userId: 'user-pro', planCode: 'pro', callCount: 0, limitReached: false };
}

beforeEach(() => {
  mockCallCount = 0;
  vi.clearAllMocks();
});

describe('consumeCallQuota', () => {
  it('does not throw for pro user regardless of count', async () => {
    const user = makeProUser();
    for (let i = 0; i < 20; i++) {
      await expect(consumeCallQuota(user)).resolves.not.toThrow();
    }
  });

  it('does not throw for team user', async () => {
    const user: McpUser = { userId: 'user-team', planCode: 'team', callCount: 0, limitReached: false };
    await expect(consumeCallQuota(user)).resolves.not.toThrow();
  });

  it('throws McpLimitError for free user already at limit (limitReached flag)', async () => {
    const user = makeFreeUser(10, true);
    await expect(consumeCallQuota(user)).rejects.toThrow(McpLimitError);
  });

  it('throws McpLimitError for free user after exceeding 10 weighted units', async () => {
    // Simulate 10 prior calls already in the counter
    mockCallCount = 10;
    const user = makeFreeUser(10, false);
    // Next call pushes count to 11, should throw
    await expect(consumeCallQuota(user, 1)).rejects.toThrow(McpLimitError);
  });

  it('allows free user up to the 10 unit limit', async () => {
    const user = makeFreeUser(0, false);
    // 10 single-weight calls should all succeed (count stays at 10)
    for (let i = 0; i < 10; i++) {
      await expect(consumeCallQuota(user)).resolves.not.toThrow();
    }
  });

  it('counts weighted calls correctly (weight=5 hits limit faster)', async () => {
    mockCallCount = 6;
    const user = makeFreeUser(6, false);
    // count goes to 11 with weight=5
    await expect(consumeCallQuota(user, 5)).rejects.toThrow(McpLimitError);
  });
});
