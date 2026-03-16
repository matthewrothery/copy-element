/**
 * Sends magic-link email. Uses SES + react-email when configured; otherwise no-op (logs in dev).
 */
export async function sendMagicLinkEmail(_email: string, url: string): Promise<void> {
  const { config } = await import('../config/index.js');
  if (!config.FROM_EMAIL || !config.AWS_SES_REGION) {
    console.warn('[email] SES not configured. Magic link:', url);
    return;
  }
  const { sendMagicLinkViaSes } = await import('./email-ses.js');
  await sendMagicLinkViaSes(_email, url);
}
