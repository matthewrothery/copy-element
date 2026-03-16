import { Router, type Request, type Response } from 'express';
import { getDb } from '../../db/connection.js';
import type { HealthResponse, ReadyResponse } from '../../types/index.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req: Request, res: Response<HealthResponse>) => {
  const body: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
  res.status(200).json(body);
});

healthRouter.get('/ready', (_req: Request, res: Response<ReadyResponse>) => {
  try {
    const db = getDb();
    db.prepare('SELECT 1').get();
    res.status(200).json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});
