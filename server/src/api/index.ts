import type { Express } from 'express';
import { healthRouter } from './routes/health.js';
import { installsRouter } from './routes/installs.js';
import { meRouter } from './routes/me.js';
import { billingRouter } from './routes/billing.js';
import { capturesRouter } from './routes/captures.js';
import { emailTrackingRouter } from './routes/email-tracking.js';
import { mcpTokensRouter } from './routes/mcp-tokens.js';

export function mountApi(app: Express): void {
  app.use(healthRouter);
  app.use('/api/me', meRouter);
  app.use('/api/installs', installsRouter);
  app.use('/api/billing', billingRouter);
  app.use('/api/captures', capturesRouter);
  app.use('/api/email/track', emailTrackingRouter);
  app.use('/api/mcp', mcpTokensRouter);
}
