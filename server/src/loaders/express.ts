import express, { type Express } from 'express';
import cors from 'cors';
import { mountApi } from '../api/index.js';

export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(cors());
  mountApi(app);
  return app;
}
