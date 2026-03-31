import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import cors from 'cors';
import morgan from 'morgan';
import chalk from 'chalk';
import cookieParser from 'cookie-parser';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';
import { extensionSessionRouter } from '../api/routes/extension-session.js';
import { handleStripeWebhook } from '../api/routes/billing.js';
import { mountApi } from '../api/index.js';
import { internalMcpRouter } from '../api/routes/internal-mcp.js';
import { internalAdminRouter } from '../api/routes/internal-admin.js';
import { config } from '../config/index.js';
import { logger } from '../logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../../public');

function addAuthRouteDiagnostics(app: Express): void {
  if (config.NODE_ENV === 'production') {
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
        logger.warn(
          `[auth] 404 for ${requestLabel}. Verify Better Auth route names (for Google: POST /api/auth/sign-in/social with { provider, callbackURL }).`
        );
      }
    });
    next();
  });
}

export function createApp(): Express {
  const app = express();

  // 1. Trust proxy — for reverse proxies (Heroku, ELB, Nginx)
  if (config.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }
  app.enable('trust proxy');

  // 2. CORS
  app.use(cors({ origin: true, credentials: true }));

  // 3. Request-time — timestamp before processing (for uploads, diagnostics)
  app.use((req: Request, _res, next) => {
    req.requestTime = Date.now();
    next();
  });

  // 4. Morgan — HTTP request logging
  app.use(
    morgan((tokens, req, res) => {
      const log = [
        chalk.blueBright(tokens.method(req, res)),
        chalk.green(tokens.url(req, res)),
        chalk.yellow(tokens.status(req, res)),
        chalk.gray(`${tokens['response-time'](req, res)} ms`),
      ];
      return log.join(' ');
    })
  );

  // 5. Cookie-parser
  app.use(cookieParser());

  // 6. Stripe webhook — must receive raw body; mount before express.json()
  app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

  // 7. Body parsing
  app.use(express.json({ limit: '256kb' }));

  // 8. Auth route diagnostics
  addAuthRouteDiagnostics(app);

  // 9. Extension-session router — before Better Auth catch-all
  app.use('/api/auth/extension-session', extensionSessionRouter);

  // 10. Better Auth catch-all
  app.all('/api/auth/*', toNodeHandler(auth));

  // 11. Internal MCP routes (not under /api/ — internal only)
  app.use('/internal/mcp', internalMcpRouter);
  app.use('/internal/admin', internalAdminRouter);

  // 12. API routes
  mountApi(app);

  // 13. Static files
  app.use(express.static(publicDir));

  // 14. 404 catch-all
  app.use((_req, _res, next) => {
    const err = new Error('Not Found') as Error & { status?: number };
    err.status = 404;
    next(err);
  });

  // 15. Error handlers
  app.use((err: Error & { name?: string; status?: number; data?: unknown }, _req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
      res.status((err as { status?: number }).status ?? 401).json({ message: err.message }).end();
      return;
    }
    next(err);
  });
  app.use((err: Error & { status?: number; data?: unknown }, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status ?? 500;
    const message = err.message || 'unknown error';
    const payload: { error: string; data?: unknown } = { error: message };
    if (err.data !== undefined) {
      payload.data = err.data;
    }
    res.status(status).json(payload);
  });

  logger.log('Express loaded');

  return app;
}
