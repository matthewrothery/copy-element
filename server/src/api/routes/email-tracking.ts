import { Router } from 'express';
import { recordOpen, recordClick, getEmailBySendId } from '../../services/email-tracking.js';
import { suppressEmail } from '../../services/email-suppression.js';

export const emailTrackingRouter = Router();

// 43-byte transparent 1x1 GIF
const TRACKING_PIXEL = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

emailTrackingRouter.get('/open/:id.gif', (req, res) => {
  const { id } = req.params;
  recordOpen(id);
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store, no-cache');
  res.send(TRACKING_PIXEL);
});

emailTrackingRouter.get('/unsubscribe', (req, res) => {
  const { id } = req.query as { id?: string };

  if (id) {
    const email = getEmailBySendId(id);
    if (email) {
      suppressEmail(email, 'unsubscribe');
    }
  }

  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed – Element Armory</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 80px auto; padding: 0 24px; color: #111827; }
    h1 { font-size: 20px; margin-bottom: 8px; }
    p { color: #6b7280; font-size: 15px; line-height: 1.5; }
    a { color: #3b82f6; }
  </style>
</head>
<body>
  <h1>You&rsquo;ve been unsubscribed.</h1>
  <p>You won&rsquo;t receive further emails from Element Armory.</p>
  <p>Changed your mind? <a href="mailto:support@elementarmory.com">Contact support</a>.</p>
</body>
</html>`);
});

emailTrackingRouter.get('/click', (req, res) => {
  const { id, url } = req.query as { id?: string; url?: string };
  const fallback = 'https://elementarmory.com';

  if (!url) {
    res.redirect(302, fallback);
    return;
  }

  if (id) {
    recordClick({ emailSendId: id, destinationUrl: url, userAgent: req.headers['user-agent'] });
  }

  res.redirect(302, url);
});
