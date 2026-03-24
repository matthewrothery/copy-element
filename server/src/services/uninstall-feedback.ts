import { getDb } from '../db/connection.js';

export interface UninstallFeedbackInput {
  id: string;
  reason: string;
  comment: string | null;
  createdAt: number;
}

export function saveUninstallFeedback(input: UninstallFeedbackInput): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO uninstall_feedback (id, reason, comment, created_at) VALUES (?, ?, ?, ?)'
  ).run(input.id, input.reason, input.comment ?? null, input.createdAt);
}
