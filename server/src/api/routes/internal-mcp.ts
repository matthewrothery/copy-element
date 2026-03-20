import { Router } from 'express';
import { requireInternalAuth } from '../middleware/internal-auth.js';
import { validateMcpTokenByHash } from '../../services/mcp-token.js';
import { getUserEntitlement } from '../../services/entitlements.js';
import { checkMcpLimit, incrementMcpUsage } from '../../services/mcp-usage.js';
import { listCapturesForUser, getCaptureWithAssets } from '../../services/mcp-capture.js';
import { startConversion, completeConversion, failConversion } from '../../services/ai-conversion-log.js';

const router = Router();
router.use(requireInternalAuth);

/**
 * POST /internal/mcp/auth
 * Body: { token_hash: string }
 * Resolves userId + plan + limit check from a pre-hashed MCP token.
 */
router.post('/auth', (req, res) => {
  const { token_hash } = req.body as { token_hash?: string };
  if (!token_hash || typeof token_hash !== 'string') {
    res.status(400).json({ error: 'token_hash required' });
    return;
  }

  const result = validateMcpTokenByHash(token_hash);
  if (!result) {
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  const { userId } = result;
  const entitlement = getUserEntitlement(userId);
  const limitCheck = checkMcpLimit(userId, entitlement.plan_code);

  res.json({
    userId,
    planCode: entitlement.plan_code,
    callCount: limitCheck.callCount,
    limitReached: !limitCheck.allowed,
  });
});

/**
 * GET /internal/mcp/captures
 * Query: { userId, limit?, cursor? }
 */
router.get('/captures', (req, res) => {
  const { userId, limit, cursor } = req.query as {
    userId?: string;
    limit?: string;
    cursor?: string;
  };

  if (!userId) {
    res.status(400).json({ error: 'userId required' });
    return;
  }

  const captures = listCapturesForUser(userId, {
    limit: limit ? parseInt(limit, 10) : undefined,
    cursor: cursor ? parseInt(cursor, 10) : undefined,
  });

  res.json({ captures });
});

/**
 * GET /internal/mcp/captures/:id
 * Query: { userId }
 * Returns capture with presigned GET URLs for assets.
 */
router.get('/captures/:id', async (req, res) => {
  const { userId } = req.query as { userId?: string };
  const captureId = parseInt(req.params.id, 10);

  if (!userId) {
    res.status(400).json({ error: 'userId required' });
    return;
  }

  if (Number.isNaN(captureId)) {
    res.status(400).json({ error: 'Invalid capture id' });
    return;
  }

  const capture = await getCaptureWithAssets(captureId, userId);
  if (!capture) {
    res.status(404).json({ error: 'Capture not found' });
    return;
  }

  res.json({ capture });
});

/**
 * POST /internal/mcp/usage/increment
 * Body: { userId, weight? }
 */
router.post('/usage/increment', (req, res) => {
  const { userId, weight } = req.body as { userId?: string; weight?: number };

  if (!userId) {
    res.status(400).json({ error: 'userId required' });
    return;
  }

  const callCount = incrementMcpUsage(userId, weight ?? 1);
  res.json({ callCount });
});

/**
 * POST /internal/mcp/ai-conversion/start
 * Body: StartConversionParams
 */
router.post('/ai-conversion/start', (req, res) => {
  const { userId, captureId, targetFramework, targetStyling, aiModel } = req.body as {
    userId?: string;
    captureId?: number;
    targetFramework?: string;
    targetStyling?: string;
    aiModel?: string;
  };

  if (!userId || !targetFramework || !targetStyling || !aiModel) {
    res.status(400).json({ error: 'userId, targetFramework, targetStyling, aiModel required' });
    return;
  }

  const id = startConversion({ userId, captureId, targetFramework, targetStyling, aiModel });
  res.json({ id });
});

/**
 * POST /internal/mcp/ai-conversion/complete
 * Body: { id, inputTokens, outputTokens, costMicros, responseText }
 */
router.post('/ai-conversion/complete', (req, res) => {
  const { id, inputTokens, outputTokens, costMicros, responseText } = req.body as {
    id?: string;
    inputTokens?: number;
    outputTokens?: number;
    costMicros?: number;
    responseText?: string;
  };

  if (!id || inputTokens == null || outputTokens == null || costMicros == null || !responseText) {
    res.status(400).json({ error: 'id, inputTokens, outputTokens, costMicros, responseText required' });
    return;
  }

  completeConversion(id, { inputTokens, outputTokens, costMicros, responseText });
  res.json({ ok: true });
});

/**
 * POST /internal/mcp/ai-conversion/fail
 * Body: { id, errorMessage }
 */
router.post('/ai-conversion/fail', (req, res) => {
  const { id, errorMessage } = req.body as { id?: string; errorMessage?: string };

  if (!id || !errorMessage) {
    res.status(400).json({ error: 'id and errorMessage required' });
    return;
  }

  failConversion(id, errorMessage);
  res.json({ ok: true });
});

export { router as internalMcpRouter };
