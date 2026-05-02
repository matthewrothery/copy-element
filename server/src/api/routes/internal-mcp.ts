import { Router } from 'express';
import { requireInternalAuth } from '../middleware/internal-auth.js';
import { incrementMcpUsage } from '../../services/mcp-usage.js';
import { listCapturesForUser, getCaptureWithAssets } from '../../services/mcp-capture.js';
import { startConversion, completeConversion, failConversion } from '../../services/ai-conversion-log.js';

const router = Router();
router.use(requireInternalAuth);

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
