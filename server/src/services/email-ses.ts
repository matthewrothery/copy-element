import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { render } from '@react-email/render';
import { createElement } from 'react';
import { MagicLinkEmail } from '../emails/magic-link.js';
import { config } from '../config/index.js';

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

export async function sendMagicLinkViaSes(email: string, url: string): Promise<void> {
  const html = await render(createElement(MagicLinkEmail, { url, email }));
  await sesClient.send(
    new SendEmailCommand({
      Source: config.FROM_EMAIL,
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: 'Sign in to Element Armory' },
        Body: {
          Html: { Data: html },
        },
      },
    })
  );
}
