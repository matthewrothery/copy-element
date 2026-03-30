import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { render } from '@react-email/render';
import { createElement } from 'react';
import { nanoid } from 'nanoid';
import { MagicLinkEmail } from '../emails/magic-link.js';
import { WelcomeEmail } from '../emails/welcome.js';
import { FirstCaptureEmail } from '../emails/first-capture.js';
import { LimitReachedEmail } from '../emails/limit-reached.js';
import { OnboardingReminderEmail } from '../emails/onboarding-reminder.js';
import { ValueEmail } from '../emails/value-email.js';
import { AccountNudgeEmail } from '../emails/account-nudge.js';
import { CaptureMilestoneEmail } from '../emails/capture-milestone.js';
import { SaveYourWorkEmail } from '../emails/save-your-work.js';
import { PostLimitFollowupEmail } from '../emails/post-limit-followup.js';
import { config } from '../config/index.js';
import { logEmailSend, wasSentRecently } from './email-tracking.js';
import { isEmailSuppressed } from './email-suppression.js';

const sesClient = new SESClient({
  region: config.AWS_SES_REGION,
  ...(config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY
    ? {
        credentials: {
          accessKeyId: config.AWS_ACCESS_KEY_ID,
          secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
        },
      }
    : {}),
});

function buildPixelUrl(sendId: string): string {
  return `${config.BETTER_AUTH_URL}/api/email/track/open/${sendId}.gif`;
}

function buildWrappedLink(sendId: string, dest: string): string {
  return `${config.BETTER_AUTH_URL}/api/email/track/click?id=${sendId}&url=${encodeURIComponent(dest)}`;
}

function buildUnsubUrl(sendId: string): string {
  return `${config.BETTER_AUTH_URL}/api/email/track/unsubscribe?id=${sendId}`;
}

export async function sendWelcomeViaSes(email: string, name?: string): Promise<void> {
  if (isEmailSuppressed(email)) {
    console.log(`[email] Suppressed: welcome → ${email}`);
    return;
  }
  // One welcome per address — skip if already sent or skipped
  if (wasSentRecently(email, 'welcome')) {
    console.log(`[email] Dedup: welcome already sent → ${email}`);
    return;
  }

  const sendId = nanoid();
  const subject = 'Welcome to Element Armory';
  const pixelUrl = buildPixelUrl(sendId);
  const ctaUrl = buildWrappedLink(sendId, config.FRONTEND_URL || 'https://elementarmory.com');
  const unsubUrl = buildUnsubUrl(sendId);

  const html = await render(createElement(WelcomeEmail, { email, name, pixelUrl, ctaUrl, unsubUrl }));

  try {
    const response = await sesClient.send(
      new SendEmailCommand({
        Source: config.FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: subject },
          Body: { Html: { Data: html } },
        },
      })
    );
    logEmailSend({ id: sendId, email, template: 'welcome', subject, sesMsgId: response.MessageId, status: 'sent' });
  } catch (err) {
    logEmailSend({ id: sendId, email, template: 'welcome', subject, status: 'failed', error: (err as Error).message });
    throw err;
  }
}

export async function sendFirstCaptureViaSes(email: string, name?: string): Promise<void> {
  if (isEmailSuppressed(email)) return;
  if (wasSentRecently(email, 'first_capture')) return;

  const sendId = nanoid();
  const subject = 'Your first capture is saved — here\'s what to do next';
  const pixelUrl = buildPixelUrl(sendId);
  const libraryUrl = buildWrappedLink(sendId, `${config.FRONTEND_URL || 'https://elementarmory.com'}/app/library`);
  const unsubUrl = buildUnsubUrl(sendId);

  const html = await render(createElement(FirstCaptureEmail, { email, name, libraryUrl, pixelUrl, unsubUrl }));

  try {
    const response = await sesClient.send(
      new SendEmailCommand({
        Source: config.FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: { Subject: { Data: subject }, Body: { Html: { Data: html } } },
      })
    );
    logEmailSend({ id: sendId, email, template: 'first_capture', subject, sesMsgId: response.MessageId, status: 'sent' });
  } catch (err) {
    logEmailSend({ id: sendId, email, template: 'first_capture', subject, status: 'failed', error: (err as Error).message });
    throw err;
  }
}

export async function sendLimitReachedViaSes(email: string, quotaLimit: number, name?: string): Promise<void> {
  if (isEmailSuppressed(email)) return;
  if (wasSentRecently(email, 'limit_reached')) return;

  const sendId = nanoid();
  const subject = `You've used all ${quotaLimit} captures this month`;
  const pixelUrl = buildPixelUrl(sendId);
  const upgradeUrl = buildWrappedLink(sendId, `${config.FRONTEND_URL || 'https://elementarmory.com'}/billing`);
  const unsubUrl = buildUnsubUrl(sendId);

  const html = await render(createElement(LimitReachedEmail, { email, name, quotaLimit, upgradeUrl, pixelUrl, unsubUrl }));

  try {
    const response = await sesClient.send(
      new SendEmailCommand({
        Source: config.FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: { Subject: { Data: subject }, Body: { Html: { Data: html } } },
      })
    );
    logEmailSend({ id: sendId, email, template: 'limit_reached', subject, sesMsgId: response.MessageId, status: 'sent' });
  } catch (err) {
    logEmailSend({ id: sendId, email, template: 'limit_reached', subject, status: 'failed', error: (err as Error).message });
    throw err;
  }
}

export async function sendOnboardingReminderViaSes(email: string, name?: string): Promise<void> {
  if (isEmailSuppressed(email)) return;
  if (wasSentRecently(email, 'onboarding_reminder')) return;

  const sendId = nanoid();
  const subject = 'Get your first capture in under a minute';
  const pixelUrl = buildPixelUrl(sendId);
  const ctaUrl = buildWrappedLink(sendId, `${config.FRONTEND_URL || 'https://elementarmory.com'}/app/library`);
  const unsubUrl = buildUnsubUrl(sendId);

  const html = await render(createElement(OnboardingReminderEmail, { email, name, ctaUrl, pixelUrl, unsubUrl }));

  try {
    const response = await sesClient.send(
      new SendEmailCommand({
        Source: config.FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: { Subject: { Data: subject }, Body: { Html: { Data: html } } },
      })
    );
    logEmailSend({ id: sendId, email, template: 'onboarding_reminder', subject, sesMsgId: response.MessageId, status: 'sent' });
  } catch (err) {
    logEmailSend({ id: sendId, email, template: 'onboarding_reminder', subject, status: 'failed', error: (err as Error).message });
    throw err;
  }
}

export async function sendValueEmailViaSes(email: string, name?: string): Promise<void> {
  if (isEmailSuppressed(email)) return;
  if (wasSentRecently(email, 'value_email')) return;

  const sendId = nanoid();
  const subject = 'Three workflows that save the most time';
  const pixelUrl = buildPixelUrl(sendId);
  const ctaUrl = buildWrappedLink(sendId, `${config.FRONTEND_URL || 'https://elementarmory.com'}/app/library`);
  const unsubUrl = buildUnsubUrl(sendId);

  const html = await render(createElement(ValueEmail, { email, name, ctaUrl, pixelUrl, unsubUrl }));

  try {
    const response = await sesClient.send(
      new SendEmailCommand({
        Source: config.FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: { Subject: { Data: subject }, Body: { Html: { Data: html } } },
      })
    );
    logEmailSend({ id: sendId, email, template: 'value_email', subject, sesMsgId: response.MessageId, status: 'sent' });
  } catch (err) {
    logEmailSend({ id: sendId, email, template: 'value_email', subject, status: 'failed', error: (err as Error).message });
    throw err;
  }
}

export async function sendAccountNudgeViaSes(email: string, name?: string): Promise<void> {
  if (isEmailSuppressed(email)) return;
  if (wasSentRecently(email, 'account_nudge')) return;

  const sendId = nanoid();
  const subject = "You've captured 3 elements — sign in to sync them";
  const pixelUrl = buildPixelUrl(sendId);
  const ctaUrl = buildWrappedLink(sendId, `${config.FRONTEND_URL || 'https://elementarmory.com'}/sign-in`);
  const unsubUrl = buildUnsubUrl(sendId);

  const html = await render(createElement(AccountNudgeEmail, { email, name, ctaUrl, pixelUrl, unsubUrl }));

  try {
    const response = await sesClient.send(
      new SendEmailCommand({
        Source: config.FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: { Subject: { Data: subject }, Body: { Html: { Data: html } } },
      })
    );
    logEmailSend({ id: sendId, email, template: 'account_nudge', subject, sesMsgId: response.MessageId, status: 'sent' });
  } catch (err) {
    logEmailSend({ id: sendId, email, template: 'account_nudge', subject, status: 'failed', error: (err as Error).message });
    throw err;
  }
}

export async function sendCaptureMilestoneViaSes(email: string, name?: string): Promise<void> {
  if (isEmailSuppressed(email)) return;
  if (wasSentRecently(email, 'capture_milestone')) return;

  const sendId = nanoid();
  const subject = '10 captures. A real library now.';
  const pixelUrl = buildPixelUrl(sendId);
  const ctaUrl = buildWrappedLink(sendId, `${config.FRONTEND_URL || 'https://elementarmory.com'}/app/library`);
  const unsubUrl = buildUnsubUrl(sendId);

  const html = await render(createElement(CaptureMilestoneEmail, { email, name, ctaUrl, pixelUrl, unsubUrl }));

  try {
    const response = await sesClient.send(
      new SendEmailCommand({
        Source: config.FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: { Subject: { Data: subject }, Body: { Html: { Data: html } } },
      })
    );
    logEmailSend({ id: sendId, email, template: 'capture_milestone', subject, sesMsgId: response.MessageId, status: 'sent' });
  } catch (err) {
    logEmailSend({ id: sendId, email, template: 'capture_milestone', subject, status: 'failed', error: (err as Error).message });
    throw err;
  }
}

export async function sendSaveYourWorkViaSes(email: string, quotaUsed: number, quotaLimit: number, name?: string): Promise<void> {
  if (isEmailSuppressed(email)) return;

  const d = new Date();
  const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  if (wasSentRecently(email, 'save_your_work', startOfMonth)) return;

  const sendId = nanoid();
  const subject = `Running low — ${quotaLimit - quotaUsed} captures left this month`;
  const pixelUrl = buildPixelUrl(sendId);
  const upgradeUrl = buildWrappedLink(sendId, `${config.FRONTEND_URL || 'https://elementarmory.com'}/billing`);
  const unsubUrl = buildUnsubUrl(sendId);

  const html = await render(createElement(SaveYourWorkEmail, { email, name, quotaUsed, quotaLimit, upgradeUrl, pixelUrl, unsubUrl }));

  try {
    const response = await sesClient.send(
      new SendEmailCommand({
        Source: config.FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: { Subject: { Data: subject }, Body: { Html: { Data: html } } },
      })
    );
    logEmailSend({ id: sendId, email, template: 'save_your_work', subject, sesMsgId: response.MessageId, status: 'sent' });
  } catch (err) {
    logEmailSend({ id: sendId, email, template: 'save_your_work', subject, status: 'failed', error: (err as Error).message });
    throw err;
  }
}

export async function sendPostLimitFollowupViaSes(email: string, quotaLimit: number, name?: string): Promise<void> {
  if (isEmailSuppressed(email)) return;

  const d = new Date();
  const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  if (wasSentRecently(email, 'post_limit_followup', startOfMonth)) return;

  const sendId = nanoid();
  const subject = 'Still blocked on captures?';
  const pixelUrl = buildPixelUrl(sendId);
  const upgradeUrl = buildWrappedLink(sendId, `${config.FRONTEND_URL || 'https://elementarmory.com'}/billing`);
  const unsubUrl = buildUnsubUrl(sendId);

  const html = await render(createElement(PostLimitFollowupEmail, { email, name, quotaLimit, upgradeUrl, pixelUrl, unsubUrl }));

  try {
    const response = await sesClient.send(
      new SendEmailCommand({
        Source: config.FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: { Subject: { Data: subject }, Body: { Html: { Data: html } } },
      })
    );
    logEmailSend({ id: sendId, email, template: 'post_limit_followup', subject, sesMsgId: response.MessageId, status: 'sent' });
  } catch (err) {
    logEmailSend({ id: sendId, email, template: 'post_limit_followup', subject, status: 'failed', error: (err as Error).message });
    throw err;
  }
}

const MAGIC_LINK_DEDUP_MS = 60 * 1000; // 1 minute

export async function sendMagicLinkViaSes(email: string, url: string): Promise<void> {
  if (isEmailSuppressed(email)) {
    console.log(`[email] Suppressed: magic_link → ${email}`);
    return;
  }
  if (wasSentRecently(email, 'magic_link', Date.now() - MAGIC_LINK_DEDUP_MS)) {
    console.log(`[email] Dedup: magic link sent within last minute → ${email}`);
    return;
  }

  const sendId = nanoid();
  const subject = 'Sign in to Element Armory';
  const pixelUrl = buildPixelUrl(sendId);
  const wrappedUrl = buildWrappedLink(sendId, url);
  const unsubUrl = buildUnsubUrl(sendId);

  const html = await render(createElement(MagicLinkEmail, { url: wrappedUrl, email, pixelUrl, unsubUrl }));

  try {
    const response = await sesClient.send(
      new SendEmailCommand({
        Source: config.FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: subject },
          Body: { Html: { Data: html } },
        },
      })
    );
    logEmailSend({ id: sendId, email, template: 'magic_link', subject, sesMsgId: response.MessageId, status: 'sent' });
  } catch (err) {
    logEmailSend({ id: sendId, email, template: 'magic_link', subject, status: 'failed', error: (err as Error).message });
    throw err;
  }
}
