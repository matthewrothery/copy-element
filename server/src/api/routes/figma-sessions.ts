import { Router, type Response } from 'express';
import { requireSession, type RequestWithSession } from '../middleware/session.js';
import {
  createFigmaSession,
  completeFigmaSession,
  pollFigmaSession,
} from '../../services/figma-session.js';

export const figmaSessionsRouter = Router();

/**
 * POST /api/figma-sessions
 * No auth. Plugin calls this to initiate the device-code auth flow.
 * Body: { session_id: string }
 */
figmaSessionsRouter.post('/', (req, res: Response) => {
  const sessionId = (req.body as { session_id?: unknown })?.session_id;
  if (typeof sessionId !== 'string' || sessionId.trim().length < 8) {
    res.status(400).json({ error: 'session_id is required (min 8 chars)' });
    return;
  }
  try {
    createFigmaSession(sessionId.trim());
    res.status(201).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create session';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/figma-sessions/:id/complete
 * Session-cookie auth. Website calls this once the user is authenticated.
 */
figmaSessionsRouter.post(
  '/:id/complete',
  requireSession,
  (req: RequestWithSession, res: Response) => {
    const sessionId = String(req.params.id);
    const userId = String(req.session!.user.id);
    const result = completeFigmaSession(sessionId, userId);
    if (!result) {
      res.status(404).json({ error: 'Session not found, expired, or already completed' });
      return;
    }
    res.status(200).json({ ok: true, expires_at: result.expires_at });
  }
);

/**
 * GET /api/figma-sessions/:id/poll
 * No auth. Plugin polls this to check if auth is complete and retrieve the token.
 */
figmaSessionsRouter.get('/:id/poll', (req, res: Response) => {
  const sessionId = req.params.id;
  const result = pollFigmaSession(sessionId);
  if (!result) {
    res.status(404).json({ error: 'Session not found or expired' });
    return;
  }
  res.status(200).json(result);
});
