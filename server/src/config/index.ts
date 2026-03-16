import 'dotenv/config';
import { ENV_KEYS, DEFAULTS } from '../constants/index.js';
import type { AppConfig } from '../types/index.js';

function getConfig(): AppConfig {
  const portRaw = process.env[ENV_KEYS.PORT];
  const port = portRaw ? parseInt(portRaw, 10) : DEFAULTS.PORT;
  return {
    NODE_ENV: process.env[ENV_KEYS.NODE_ENV] ?? 'development',
    PORT: Number.isNaN(port) ? DEFAULTS.PORT : port,
    DATABASE_PATH: process.env[ENV_KEYS.DATABASE_PATH] ?? DEFAULTS.DATABASE_PATH,
  };
}

export const config = getConfig();
