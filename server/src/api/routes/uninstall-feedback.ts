import { Router, type Request, type Response } from 'express';
import { nanoid } from 'nanoid';
import { saveUninstallFeedback } from '../../services/uninstall-feedback.js';

export const uninstallFeedbackRouter = Router();

const VALID_REASONS = new Set([
  'not-using',
  'not-working',
  'better-tool',
  'privacy',
  'too-complex',
  'just-testing',
  'other',
]);

const MAX_COMMENT_LENGTH = 500;

uninstallFeedbackRouter.post('/', (req: Request, res: Response) => {
  const { reason, comment } = req.body as { reason?: unknown; comment?: unknown };

  if (typeof reason !== 'string' || !VALID_REASONS.has(reason)) {
    res.status(400).json({ error: 'Invalid reason.' });
    return;
  }

  const sanitizedComment =
    typeof comment === 'string' && comment.trim().length > 0
      ? comment.trim().slice(0, MAX_COMMENT_LENGTH)
      : null;

  saveUninstallFeedback({
    id: nanoid(),
    reason,
    comment: sanitizedComment,
    createdAt: Date.now(),
  });

  res.status(204).end();
});
