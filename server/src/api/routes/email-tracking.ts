import { Router } from 'express';
import { recordOpen, recordClick } from '../../services/email-tracking.js';

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
