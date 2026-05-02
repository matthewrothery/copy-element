import type { Express } from 'express';
import { healthRouter } from './routes/health.js';
import { installsRouter } from './routes/installs.js';
import { meRouter } from './routes/me.js';
import { billingRouter } from './routes/billing.js';
import { capturesRouter } from './routes/captures.js';
import { emailTrackingRouter } from './routes/email-tracking.js';
import { figmaSessionsRouter } from './routes/figma-sessions.js';
import { uninstallFeedbackRouter } from './routes/uninstall-feedback.js';
import { supportRouter } from './routes/support.js';
import { collectRouter } from './routes/collect.js';
import { adminRouter } from './routes/admin.js';

export function mountApi(app: Express): void {
  app.use(healthRouter);
  app.use('/api/me', meRouter);
  app.use('/api/installs', installsRouter);
  app.use('/api/billing', billingRouter);
  app.use('/api/captures', capturesRouter);
  app.use('/api/figma-sessions', figmaSessionsRouter);
  app.use('/api/email/track', emailTrackingRouter);
  app.use('/api/feedback/uninstall', uninstallFeedbackRouter);
  app.use('/api/support', supportRouter);
  app.use('/api/collect', collectRouter);
  app.use('/api/admin', adminRouter);
}
