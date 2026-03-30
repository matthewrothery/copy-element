import { nanoid } from 'nanoid';
import { logEmailSend, wasSentRecently } from './email-tracking.js';
import { isEmailSuppressed } from './email-suppression.js';
import { FREE_MONTHLY_CAPTURE_LIMIT } from './entitlements.js';

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

/**
 * Sends first-capture email — one per address ever.
 */
export async function sendFirstCaptureEmail(email: string, name?: string): Promise<void> {
  const { config } = await import('../config/index.js');

  if (isEmailSuppressed(email)) return;
  if (wasSentRecently(email, 'first_capture')) return;

  if (!config.FROM_EMAIL || !config.AWS_SES_REGION) {
    logEmailSend({ id: nanoid(), email, template: 'first_capture', subject: 'Your first capture is saved', status: 'skipped' });
    return;
  }
  const { sendFirstCaptureViaSes } = await import('./email-ses.js');
  await sendFirstCaptureViaSes(email, name);
}

/**
 * Sends onboarding reminder email — once per address ever.
 */
export async function sendOnboardingReminderEmail(email: string, name?: string): Promise<void> {
  const { config } = await import('../config/index.js');

  if (isEmailSuppressed(email)) return;
  if (wasSentRecently(email, 'onboarding_reminder')) return;

  if (!config.FROM_EMAIL || !config.AWS_SES_REGION) {
    logEmailSend({ id: nanoid(), email, template: 'onboarding_reminder', subject: 'Get your first capture in under a minute', status: 'skipped' });
    return;
  }
  const { sendOnboardingReminderViaSes } = await import('./email-ses.js');
  await sendOnboardingReminderViaSes(email, name);
}

/**
 * Sends value email (day 3) — once per address ever.
 */
export async function sendValueEmail(email: string, name?: string): Promise<void> {
  const { config } = await import('../config/index.js');

  if (isEmailSuppressed(email)) return;
  if (wasSentRecently(email, 'value_email')) return;

  if (!config.FROM_EMAIL || !config.AWS_SES_REGION) {
    logEmailSend({ id: nanoid(), email, template: 'value_email', subject: 'Three workflows that save the most time', status: 'skipped' });
    return;
  }
  const { sendValueEmailViaSes } = await import('./email-ses.js');
  await sendValueEmailViaSes(email, name);
}

/**
 * Sends account nudge email (3rd capture) — once per address ever.
 */
export async function sendAccountNudgeEmail(email: string, name?: string): Promise<void> {
  const { config } = await import('../config/index.js');

  if (isEmailSuppressed(email)) return;
  if (wasSentRecently(email, 'account_nudge')) return;

  if (!config.FROM_EMAIL || !config.AWS_SES_REGION) {
    logEmailSend({ id: nanoid(), email, template: 'account_nudge', subject: "You've captured 3 elements — sign in to sync them", status: 'skipped' });
    return;
  }
  const { sendAccountNudgeViaSes } = await import('./email-ses.js');
  await sendAccountNudgeViaSes(email, name);
}

/**
 * Sends capture milestone email (10th capture) — once per address ever.
 */
export async function sendCaptureMilestoneEmail(email: string, name?: string): Promise<void> {
  const { config } = await import('../config/index.js');

  if (isEmailSuppressed(email)) return;
  if (wasSentRecently(email, 'capture_milestone')) return;

  if (!config.FROM_EMAIL || !config.AWS_SES_REGION) {
    logEmailSend({ id: nanoid(), email, template: 'capture_milestone', subject: '10 captures. A real library now.', status: 'skipped' });
    return;
  }
  const { sendCaptureMilestoneViaSes } = await import('./email-ses.js');
  await sendCaptureMilestoneViaSes(email, name);
}

/**
 * Sends save-your-work email (≥80% quota used) — once per calendar month per address.
 */
export async function sendSaveYourWorkEmail(email: string, quotaUsed: number, quotaLimit: number, name?: string): Promise<void> {
  const { config } = await import('../config/index.js');

  if (isEmailSuppressed(email)) return;
  const d = new Date();
  const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  if (wasSentRecently(email, 'save_your_work', startOfMonth)) return;

  if (!config.FROM_EMAIL || !config.AWS_SES_REGION) {
    logEmailSend({ id: nanoid(), email, template: 'save_your_work', subject: `Running low — ${quotaLimit - quotaUsed} captures left this month`, status: 'skipped' });
    return;
  }
  const { sendSaveYourWorkViaSes } = await import('./email-ses.js');
  await sendSaveYourWorkViaSes(email, quotaUsed, quotaLimit, name);
}

/**
 * Sends post-limit followup email — once per billing period per address.
 */
export async function sendPostLimitFollowupEmail(email: string, quotaLimit: number, name?: string): Promise<void> {
  const { config } = await import('../config/index.js');

  if (isEmailSuppressed(email)) return;
  const d = new Date();
  const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  if (wasSentRecently(email, 'post_limit_followup', startOfMonth)) return;

  if (!config.FROM_EMAIL || !config.AWS_SES_REGION) {
    logEmailSend({ id: nanoid(), email, template: 'post_limit_followup', subject: 'Still blocked on captures?', status: 'skipped' });
    return;
  }
  const { sendPostLimitFollowupViaSes } = await import('./email-ses.js');
  await sendPostLimitFollowupViaSes(email, quotaLimit, name);
}

/**
 * Sends limit-reached email — once per billing month per address.
 */
export async function sendLimitReachedEmail(email: string, quotaLimit = FREE_MONTHLY_CAPTURE_LIMIT, name?: string): Promise<void> {
  const { config } = await import('../config/index.js');

  if (isEmailSuppressed(email)) return;
  if (wasSentRecently(email, 'limit_reached')) return;

  if (!config.FROM_EMAIL || !config.AWS_SES_REGION) {
    logEmailSend({ id: nanoid(), email, template: 'limit_reached', subject: `You've used all ${quotaLimit} captures this month`, status: 'skipped' });
    return;
  }
  const { sendLimitReachedViaSes } = await import('./email-ses.js');
  await sendLimitReachedViaSes(email, quotaLimit, name);
}
