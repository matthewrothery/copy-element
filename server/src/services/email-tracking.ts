import { getDb } from '../db/connection.js';

interface LogEmailSendParams {
  id: string;
  email: string;
  userId?: string;
  template: string;
  subject: string;
  sesMsgId?: string;
  status: 'sent' | 'failed' | 'skipped';
  error?: string;
}

export function logEmailSend(params: LogEmailSendParams): void {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO email_sends (id, email, user_id, template, subject, ses_message_id, sent_at, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      params.id,
      params.email,
      params.userId ?? null,
      params.template,
      params.subject,
      params.sesMsgId ?? null,
      Date.now(),
      params.status,
      params.error ?? null,
    );
  } catch {
    // fire-and-forget — tracking failures must never surface to callers
  }
}

export function recordOpen(emailSendId: string): void {
  try {
    const db = getDb();
    db.prepare(`
      UPDATE email_sends
      SET
        opened_at = CASE WHEN opened_at IS NULL THEN ? ELSE opened_at END,
        open_count = open_count + 1
      WHERE id = ?
    `).run(Date.now(), emailSendId);
  } catch {
    // fire-and-forget
  }
}

interface RecordClickParams {
  emailSendId: string;
  destinationUrl: string;
  userAgent?: string;
}

export function recordClick(params: RecordClickParams): void {
  try {
    const db = getDb();
    const now = Date.now();
    db.prepare(`
      UPDATE email_sends
      SET
        clicked_at = CASE WHEN clicked_at IS NULL THEN ? ELSE clicked_at END,
        click_count = click_count + 1
      WHERE id = ?
    `).run(now, params.emailSendId);
    db.prepare(`
      INSERT INTO email_clicks (email_send_id, destination_url, clicked_at, user_agent)
      VALUES (?, ?, ?, ?)
    `).run(params.emailSendId, params.destinationUrl, now, params.userAgent ?? null);
  } catch {
    // fire-and-forget
  }
}
