import type { Express } from 'express';
import { healthRouter } from './routes/health.js';
import { installsRouter } from './routes/installs.js';
import { meRouter } from './routes/me.js';

export function mountApi(app: Express): void {
  app.use(healthRouter);
  app.use('/api/me', meRouter);
  app.use('/api/installs', installsRouter);
}
