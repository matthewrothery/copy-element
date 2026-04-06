import { Router, type Request, type Response } from 'express';
import { nanoid } from 'nanoid';
import { saveUninstallFeedback } from '../../services/uninstall-feedback.js';
import { sendUninstallFeedbackViaSes } from '../../services/email-ses.js';

export const uninstallFeedbackRouter = Router();

const REASON_LABELS: Record<string, string> = {
  'not-using': "I don't use it enough",
  'not-working': "It didn't work as expected",
  'better-tool': "I found a better tool",
  'privacy': "Privacy or security concerns",
  'too-complex': "Too complex / too many features",
  'just-testing': "Just testing, don't need it",
  'other': "Other",
};

const VALID_REASONS = new Set(Object.keys(REASON_LABELS));

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

  const reasonLabel = REASON_LABELS[reason] ?? reason;
  sendUninstallFeedbackViaSes(reason, reasonLabel, sanitizedComment).catch(err => {
    console.error('[uninstall-feedback] Failed to send notification email:', err);
  });

  res.status(204).end();
});
