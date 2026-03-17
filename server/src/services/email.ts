import { nanoid } from 'nanoid';
import { logEmailSend, wasSentRecently } from './email-tracking.js';
import { isEmailSuppressed } from './email-suppression.js';

const MAGIC_LINK_DEDUP_MS = 60 * 1000; // 1 minute

/**
 * Sends magic-link email. Uses SES + react-email when configured; otherwise no-op (logs in dev).
 */
export async function sendMagicLinkEmail(_email: string, url: string): Promise<void> {
  const { config } = await import('../config/index.js');

  if (isEmailSuppressed(_email)) {
    console.log(`[email] Suppressed: magic_link → ${_email}`);
    return;
  }
  if (wasSentRecently(_email, 'magic_link', Date.now() - MAGIC_LINK_DEDUP_MS)) {
    console.log(`[email] Dedup: magic link sent within last minute → ${_email}`);
    return;
  }

  if (!config.FROM_EMAIL || !config.AWS_SES_REGION) {
    console.warn('[email] SES not configured. Magic link:', url);
    logEmailSend({ id: nanoid(), email: _email, template: 'magic_link', subject: 'Sign in to Element Armory', status: 'skipped' });
    return;
  }
  const { sendMagicLinkViaSes } = await import('./email-ses.js');
  await sendMagicLinkViaSes(_email, url);
}

/**
 * Sends welcome email on account creation. Uses SES + react-email when configured; otherwise no-op (logs in dev).
 */
export async function sendWelcomeEmail(email: string, name?: string): Promise<void> {
  const { config } = await import('../config/index.js');

  if (isEmailSuppressed(email)) {
    console.log(`[email] Suppressed: welcome → ${email}`);
    return;
  }
  // One welcome per address — skip if already sent or skipped
  if (wasSentRecently(email, 'welcome')) {
    console.log(`[email] Dedup: welcome already sent → ${email}`);
    return;
  }

  if (!config.FROM_EMAIL || !config.AWS_SES_REGION) {
    console.log(`[email] Welcome email (not sent): ${email}`);
    logEmailSend({ id: nanoid(), email, template: 'welcome', subject: 'Welcome to Element Armory', status: 'skipped' });
    return;
  }
  const { sendWelcomeViaSes } = await import('./email-ses.js');
  await sendWelcomeViaSes(email, name);
}
