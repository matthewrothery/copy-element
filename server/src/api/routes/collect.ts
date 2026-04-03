import { Router, type Request, type Response } from 'express';
import { createRateLimiter } from '../middleware/rate-limit.js';
import { insertAnalyticsEvent, isAllowedEventType } from '../../services/analytics-collect.js';
import { optionalSession, type RequestWithSession } from '../middleware/session.js';
import { config } from '../../config/index.js';

export const collectRouter = Router();

const rateLimiter = createRateLimiter(30, 60_000);

const BOT_UA_PATTERN = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|ia_archiver|lighthouse/i;

/** Allowed origins for collect endpoint (website + no-origin for extension) */
function setCorsHeaders(req: Request, res: Response): void {
  const origin = req.headers.origin;
  if (!origin) {
    // Chrome extension service workers send no Origin — allow through
    return;
  }
  const allowed = [config.FRONTEND_URL, config.ADMIN_ORIGIN].filter(Boolean);
  if (allowed.some((o) => origin === o || origin.startsWith(o))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
}

collectRouter.options('/event', (req: Request, res: Response) => {
  setCorsHeaders(req, res);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.status(204).end();
});

/** POST /api/collect/event — public, rate-limited, no auth required */
collectRouter.post(
  '/event',
  rateLimiter,
  optionalSession,
  (req: RequestWithSession, res: Response) => {
    setCorsHeaders(req, res);

    // Silently drop known bots
    const ua = req.headers['user-agent'] ?? '';
    if (BOT_UA_PATTERN.test(ua)) {
      res.status(204).end();
      return;
    }

    const body = req.body as Record<string, unknown>;
    const eventType = typeof body?.event_type === 'string' ? body.event_type : null;

    if (!eventType || !isAllowedEventType(eventType)) {
      res.status(400).json({ error: 'Invalid event_type' });
      return;
    }

    const userId = req.session?.user?.id ?? null;
    const country = (req.headers['cloudfront-viewer-country'] as string | undefined) ?? '';

    try {
      insertAnalyticsEvent({
        event_type: eventType,
        visitor_id: typeof body.visitor_id === 'string' ? body.visitor_id : undefined,
        user_id: userId,
        install_id: typeof body.install_id === 'string' ? body.install_id : undefined,
        session_id: typeof body.session_id === 'string' ? body.session_id : undefined,
        properties: typeof body.properties === 'object' && body.properties !== null
          ? (body.properties as Record<string, unknown>)
          : undefined,
        url: typeof body.url === 'string' ? body.url : undefined,
        referrer: typeof body.referrer === 'string' ? body.referrer : undefined,
        utm_source: typeof body.utm_source === 'string' ? body.utm_source : undefined,
        utm_medium: typeof body.utm_medium === 'string' ? body.utm_medium : undefined,
        utm_campaign: typeof body.utm_campaign === 'string' ? body.utm_campaign : undefined,
        device: typeof body.device === 'string' ? body.device : undefined,
        browser: typeof body.browser === 'string' ? body.browser : undefined,
        country: country || undefined,
      });
    } catch (err) {
      console.error('[collect] insert failed:', err);
      // Do not expose internal errors — analytics should never break the client
    }

    res.status(204).end();
  },
);
