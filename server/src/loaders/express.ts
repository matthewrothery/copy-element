import express, { type Express } from 'express';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';
import { extensionSessionRouter } from '../api/routes/extension-session.js';
import { handleStripeWebhook } from '../api/routes/billing.js';
import { mountApi } from '../api/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../../public');

function addAuthRouteDiagnostics(app: Express): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  app.use('/api/auth', (req, res, next) => {
    if (req.path === '/extension-session' || req.path.startsWith('/extension-session/')) {
      next();
      return;
    }

    const requestLabel = `${req.method} ${req.originalUrl}`;
    res.on('finish', () => {
      if (res.statusCode === 404) {
        console.warn(
          `[auth] 404 for ${requestLabel}. Verify Better Auth route names (for Google: POST /api/auth/sign-in/social with { provider, callbackURL }).`
        );
      }
    });
    next();
  });
}

export function createApp(): Express {
  const app = express();
  app.use(cors({ origin: true, credentials: true }));
  // Stripe webhook must receive raw body for signature verification; mount before express.json().
  app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
  app.use(express.json({ limit: '256kb' }));
  addAuthRouteDiagnostics(app);
  app.use('/api/auth/extension-session', extensionSessionRouter);
  app.all('/api/auth/*', toNodeHandler(auth));
  mountApi(app);
  app.use(express.static(publicDir));
  return app;
}
