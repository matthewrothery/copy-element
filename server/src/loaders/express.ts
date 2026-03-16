import express, { type Express } from 'express';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';
import { extensionSessionRouter } from '../api/routes/extension-session.js';
import { mountApi } from '../api/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '../../public');

export function createApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: true, credentials: true }));
  app.use('/api/auth/extension-session', extensionSessionRouter);
  app.all('/api/auth/*', toNodeHandler(auth));
  mountApi(app);
  app.use(express.static(publicDir));
  return app;
}
