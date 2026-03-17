import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { render } from '@react-email/render';
import { createElement } from 'react';
import { nanoid } from 'nanoid';
import { MagicLinkEmail } from '../emails/magic-link.js';
import { WelcomeEmail } from '../emails/welcome.js';
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
