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

/**
 * Returns true if a non-failed send for this email+template exists within the given time window.
 * Pass `since` as epoch ms. Omit `since` to check all time (useful for one-time emails like welcome).
 */
export function wasSentRecently(email: string, template: string, since?: number): boolean {
  try {
    const db = getDb();
    const row = since !== undefined
      ? db.prepare(`
          SELECT 1 FROM email_sends
          WHERE email = ? AND template = ? AND status != 'failed' AND sent_at >= ?
          LIMIT 1
        `).get(email, template, since)
      : db.prepare(`
          SELECT 1 FROM email_sends
          WHERE email = ? AND template = ? AND status != 'failed'
          LIMIT 1
        `).get(email, template);
    return !!row;
  } catch {
    return false; // fail open — don't block sends on DB errors
  }
}

/**
 * Returns the email address associated with a sendId, or null if not found.
 */
export function getEmailBySendId(sendId: string): string | null {
  try {
    const db = getDb();
    const row = db.prepare('SELECT email FROM email_sends WHERE id = ?').get(sendId) as { email: string } | undefined;
    return row?.email ?? null;
  } catch {
    return null;
  }
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
