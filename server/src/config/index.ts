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
    BETTER_AUTH_SECRET: process.env[ENV_KEYS.BETTER_AUTH_SECRET] ?? '',
    BETTER_AUTH_URL: process.env[ENV_KEYS.BETTER_AUTH_URL] ?? `http://localhost:${Number.isNaN(port) ? DEFAULTS.PORT : port}`,
    GOOGLE_CLIENT_ID: process.env[ENV_KEYS.GOOGLE_CLIENT_ID] ?? '',
    GOOGLE_CLIENT_SECRET: process.env[ENV_KEYS.GOOGLE_CLIENT_SECRET] ?? '',
    AWS_SES_REGION: process.env[ENV_KEYS.AWS_SES_REGION] ?? '',
    AWS_ACCESS_KEY_ID: process.env[ENV_KEYS.AWS_ACCESS_KEY_ID] ?? '',
    AWS_SECRET_ACCESS_KEY: process.env[ENV_KEYS.AWS_SECRET_ACCESS_KEY] ?? '',
    FROM_EMAIL: process.env[ENV_KEYS.FROM_EMAIL] ?? '',
  };
}

export const config = getConfig();
