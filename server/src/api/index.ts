import type { Express } from 'express';
import { healthRouter } from './routes/health.js';

export function mountApi(app: Express): void {
  app.use(healthRouter);
}
